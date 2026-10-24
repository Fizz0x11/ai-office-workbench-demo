const ASSETS = __ASSETS__;
// ponytail: Per-isolate throttling is best effort; add durable rate limiting before storing real data.
const attempts = new Map();
const encoder = new TextEncoder();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const SESSION_SECONDS = 8 * 60 * 60;
const COOKIE = 'demo_session';
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY'
};

function reply(body, status = 200, extra = {}) {
  return new Response(body, {status, headers: {...headers, ...extra}});
}

function loginPage(message = '') {
  const error = message ? `<p class="error" role="alert">${message}</p>` : '<p class="error" aria-hidden="true"></p>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>进入 Flowdesk 演示工作台</title><style>
  *{box-sizing:border-box}body{margin:0;font-family:system-ui,"Microsoft YaHei",sans-serif;color:#182640;background:radial-gradient(circle at 20% 18%,#ffccb9,transparent 28%),radial-gradient(circle at 85% 80%,#badff1,transparent 30%),#f3f6fb;min-height:100vh;display:grid;place-items:center;padding:24px}
  main{background:#fff;width:min(100%,460px);padding:30px 38px;border:1px solid #e7eaf2;border-radius:24px;box-shadow:0 28px 80px #263b5c26}.brand{display:flex;align-items:center;gap:9px;font-size:17px;font-weight:800}.mark{display:grid;place-items:center;background:#f27757;color:#fff;width:35px;height:35px;border-radius:10px;font-size:25px}.brand small{font-size:11px;font-weight:400;color:#8b95a5;margin-left:auto}img{display:block;width:126px;height:126px;object-fit:contain;margin:22px auto 7px;filter:drop-shadow(0 12px 12px #24354b20)}.eyebrow{text-align:center;color:#f27757;font-size:12px;font-weight:800;letter-spacing:.12em}h1{text-align:center;font-size:25px;margin:9px 0 8px}p{text-align:center;color:#78849a;font-size:12px;line-height:1.7;margin:0 0 23px}form{display:grid;gap:8px}label{font-size:12px;font-weight:700;color:#3a4760;margin-top:6px}input{width:100%;padding:12px 13px;border:1px solid #dce2eb;border-radius:10px;background:#fafbfe;font:inherit;outline:none}input:focus{border-color:#f27757;box-shadow:0 0 0 3px #f2775726}.error{color:#c33;min-height:18px;margin:0;text-align:left}button{margin-top:3px;padding:12px;border:0;border-radius:10px;background:#f27757;color:#fff;font:inherit;font-weight:800;cursor:pointer}button:hover{background:#e66c4d}footer{text-align:center;color:#9aa5b5;font-size:10px;margin-top:19px}@media(max-width:500px){main{padding:25px 22px}h1{font-size:22px}}
  </style></head><body><main><div class="brand"><span class="mark">✳</span>Flowdesk<small>演示工作台</small></div><img src="/mascot.png" alt="工作台卡通助手"><div class="eyebrow">先看效果，再讲方法</div><h1>欢迎进入 AI 办公现场</h1><p>输入内部演示账号，亲手体验从杂乱消息到可交付成果。</p><form method="post" action="/login"><label for="username">演示账号</label><input id="username" name="username" autocomplete="username" required><label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" required>${error}<button type="submit">进入工作台 →</button></form><footer>全站使用虚构数据 · 仅供教学演示</footer></main></body></html>`;
}

function decodeAsset(asset) {
  return Uint8Array.from(atob(asset.data), char => char.charCodeAt(0));
}

function assetResponse(path) {
  const asset = ASSETS[path];
  if (!asset) return reply('Not found', 404);
  return reply(decodeAsset(asset), 200, {'Content-Type': asset.type});
}

function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function passwordMatches(candidate, expected) {
  const [a, b] = await Promise.all([candidate, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function sessionKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign', 'verify']);
}

async function createSession(secret) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiry}.${nonce}`;
  const signature = hex(new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(secret), encoder.encode(payload))));
  return `${payload}.${signature}`;
}

async function hasSession(request, secret) {
  const value = request.headers.get('Cookie')?.match(/(?:^|;\s*)demo_session=([^;]+)/)?.[1];
  if (!value) return false;
  const match = /^(\d+)\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
  if (!match || Number(match[1]) < Date.now() / 1000) return false;
  const signature = Uint8Array.from(match[3].match(/../g), byte => parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await sessionKey(secret), signature, encoder.encode(`${match[1]}.${match[2]}`));
}

function clientKey(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function failureCount(key) {
  const entry = attempts.get(key);
  if (!entry || entry.until <= Date.now()) {
    attempts.delete(key);
    return 0;
  }
  return entry.count;
}

export default {
  async fetch(request, env) {
    if (!env.DEMO_PASSWORD || !env.SESSION_SECRET) return reply('Service unavailable', 503);
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (path === '/mascot.png' && request.method === 'GET') return assetResponse(path);
    if (path === '/login' && request.method === 'GET') {
      if (await hasSession(request, env.SESSION_SECRET)) return Response.redirect(new URL('/', request.url), 303);
      return reply(loginPage(), 200, {'Content-Type':'text/html; charset=utf-8'});
    }
    if (path === '/login' && request.method === 'POST') {
      const key = clientKey(request);
      if (failureCount(key) >= MAX_FAILURES) return reply(loginPage('尝试次数过多，请 15 分钟后再试。'), 429, {'Content-Type':'text/html; charset=utf-8', 'Retry-After':'900'});
      if (Number(request.headers.get('Content-Length') || 0) > 1024) return reply('Request too large', 413);
      const form = await request.formData();
      const username = String(form.get('username') || '');
      const password = String(form.get('password') || '');
      if (username.length > 64 || password.length > 128) return reply('Request too large', 413);
      const correct = await passwordMatches(password, env.DEMO_PASSWORD);
      if (username !== 'demo' || !correct) {
        const entry = attempts.get(key);
        attempts.set(key, {count:(entry?.count || 0) + 1, until:Date.now() + WINDOW_MS});
        return reply(loginPage('账号或密码不正确。'), 401, {'Content-Type':'text/html; charset=utf-8'});
      }
      attempts.delete(key);
      const session = await createSession(env.SESSION_SECRET);
      return reply(null, 303, {'Location':'/', 'Set-Cookie':`${COOKIE}=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`});
    }
    if (path === '/logout' && request.method === 'POST') {
      return reply(null, 303, {'Location':'/login', 'Set-Cookie':`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`});
    }
    if (!(await hasSession(request, env.SESSION_SECRET))) return Response.redirect(new URL('/login', request.url), 303);
    if (request.method !== 'GET' && request.method !== 'HEAD') return reply('Method not allowed', 405);
    return assetResponse(path);
  }
};

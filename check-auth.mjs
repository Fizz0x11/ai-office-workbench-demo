import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error('Set DEMO_PASSWORD to run authentication checks');
const source = readFileSync(new URL('./dist/server/index.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, new RegExp(password));
const {default:worker} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const env = {DEMO_PASSWORD:password, SESSION_SECRET:'local-check-session-secret-unique-and-long'};
const base = 'https://demo.example';
const form = (username, candidate, ip='198.51.100.1') => new Request(base+'/login', {
  method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded','CF-Connecting-IP':ip},
  body:new URLSearchParams({username,password:candidate})
});

let response = await worker.fetch(new Request(base+'/'), env);
assert.equal(response.status, 303);
assert.equal(response.headers.get('Location'), base+'/login');
response = await worker.fetch(new Request(base+'/app.js'), env);
assert.equal(response.status, 303);
response = await worker.fetch(form('demo','wrong'), env);
assert.equal(response.status, 401);
response = await worker.fetch(form('demo',password), env);
assert.equal(response.status, 303);
const cookie = response.headers.get('Set-Cookie').split(';')[0];
assert.match(response.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Strict/);
response = await worker.fetch(new Request(base+'/',{headers:{Cookie:cookie}}), env);
assert.equal(response.status, 200);
assert.match(await response.text(), /AI 办公流水线/);
response = await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:cookie}}), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request(base+'/logout',{method:'POST',headers:{Cookie:cookie}}), env);
assert.equal(response.status, 303);
assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
for (let i=0;i<5;i++) assert.equal((await worker.fetch(form('demo','wrong','198.51.100.2'), env)).status,401);
assert.equal((await worker.fetch(form('demo',password,'198.51.100.2'), env)).status,429);
console.log('Authentication check passed: gate, session, logout, and throttle.');

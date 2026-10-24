const loginScreen = document.getElementById('login-screen');
const workbench = document.getElementById('workbench');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const demoPasswordHash = 'f5754c8c432fecd6a00ab789c1ad949688bbd299c7d19587e87a07a5b855bda9';

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.textContent = '';
  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (username !== 'demo' || hash !== demoPasswordHash) {
    loginError.textContent = '账号或密码不正确，请检查后重试。';
    loginForm.elements.password.value = '';
    loginForm.elements.password.focus();
    return;
  }
  loginForm.reset();
  loginScreen.hidden = true;
  workbench.hidden = false;
});

document.getElementById('logout-button').addEventListener('click', () => {
  workbench.hidden = true;
  loginScreen.hidden = false;
  loginForm.elements.username.focus();
});

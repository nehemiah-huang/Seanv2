/* FILE: js/screens/login.js | SCREEN: Login */
/* ============================================================
   MEDCARE PMS — LOGIN SCREEN LOGIC
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Utils.initTheme();
  Storage.seedIfEmpty();
  // If already logged in go to dashboard
  if (Storage.getSession()) {
    window.location.href = '../dashboard/';
  }
});

function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Please enter your username and password');
    return;
  }

  setLoading(true);

  setTimeout(() => {
    const result = Auth.login(username, password);
    setLoading(false);

    if (result.success) {
      Storage.addAuditEntry('LOGIN', `${result.user.name} logged in`);
      Utils.showSnackbar(`Welcome back, ${result.user.name}!`, 'success');
      setTimeout(() => { window.location.href = '../dashboard/'; }, 1200);
    } else {
      showError('Invalid username or password');
      document.getElementById('username').classList.add('error');
      document.getElementById('password').classList.add('error');
    }
  }, 900);
}

function setLoading(on) {
  const btn     = document.getElementById('loginBtn');
  const content = document.getElementById('loginBtnContent');
  btn.disabled  = on;
  content.innerHTML = on
    ? '<span class="material-icons spinner">autorenew</span>'
    : 'Login';
}

function showError(msg) {
  document.getElementById('errorText').textContent = msg;
  document.getElementById('errorMsg').style.display = 'flex';
}

function clearError() {
  document.getElementById('errorMsg').style.display = 'none';
  document.getElementById('username').classList.remove('error');
  document.getElementById('password').classList.remove('error');
}

function togglePassword() {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eyeIcon');
  const show  = input.type === 'password';
  input.type       = show ? 'text' : 'password';
  icon.textContent = show ? 'visibility_off' : 'visibility';
}

function clearForm() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  clearError();
}

function openForgot() {
  document.getElementById('forgotModal').classList.add('show');
}

function closeForgot() {
  document.getElementById('forgotModal').classList.remove('show');
}

document.getElementById('forgotModal').addEventListener('click', function(e) {
  if (e.target === this) closeForgot();
});

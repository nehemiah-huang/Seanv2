/* FILE: js/screens/users.js | SCREEN: User Management */

let deleteTargetId = null;
let resetTargetId  = null;
const isDesktop    = () => window.innerWidth >= 768;

document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.requireAuth()) return;
  Storage.seedIfEmpty();
  Nav.render('users');
  renderUsers();
});

// ── Render user list ──────────────────────────────────────
function renderUsers() {
  const users = Storage.getUsers();
  const list  = document.getElementById('userList');

  if (!users.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-icons">group</span></div>
        <p>No users yet</p>
        <span>Add your first user account</span>
      </div>`;
    return;
  }

  const roleCls = { Admin:'role-badge-admin', Pharmacist:'role-badge-pharmacist', Attendant:'role-badge-attendant' };

  list.innerHTML = users.map(user => `
    <div class="user-card">
      <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-meta">
          @${user.username}
          &nbsp;&middot;&nbsp;
          <span class="badge ${roleCls[user.role] || ''}">${user.role}</span>
        </div>
      </div>
      <div class="user-actions">
        <button class="act-btn edit" onclick="openEdit('${user.id}')" aria-label="Edit user">
          <span class="material-icons">edit</span>
        </button>
        <button class="act-btn edit" onclick="openReset('${user.id}','${user.name.replace(/'/g,"\\'")}')">
          <span class="material-icons" style="color:var(--warn);">lock_reset</span>
        </button>
        <button class="act-btn del" onclick="openConfirm('${user.id}','${user.name.replace(/'/g,"\\'")}')">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>`).join('');
}

// ── Open add/edit ─────────────────────────────────────────
function openSheet() {
  if (isDesktop()) {
    openDesktopForm(null);
  } else {
    clearMobileForm();
    document.getElementById('sheetTitle').textContent   = 'Add new user';
    document.getElementById('mSaveBtnTxt').textContent  = 'Save user';
    document.getElementById('mPasswordLabel').textContent = 'Password *';
    document.getElementById('mEditUserId').value = '';
    showBottomSheet();
  }
}

function openEdit(id) {
  const user = Storage.getUserById(id);
  if (!user) return;
  if (isDesktop()) {
    openDesktopForm(user);
  } else {
    clearMobileForm();
    document.getElementById('sheetTitle').textContent   = 'Edit user';
    document.getElementById('mSaveBtnTxt').textContent  = 'Update user';
    document.getElementById('mPasswordLabel').textContent = 'New password (leave blank to keep)';
    document.getElementById('mEditUserId').value  = user.id;
    document.getElementById('mfName').value       = user.name;
    document.getElementById('mfUsername').value   = user.username;
    document.getElementById('mfRole').value       = user.role;
    showBottomSheet();
  }
}

// ── Desktop form ──────────────────────────────────────────
function openDesktopForm(user) {
  clearDesktopForm();
  const panel = document.getElementById('desktopForm');
  panel.style.display = 'block';
  if (user) {
    document.getElementById('desktopFormTitle').textContent = 'Edit user';
    document.getElementById('saveBtnTxt').textContent       = 'Update user';
    document.getElementById('passwordLabel').textContent    = 'New password (leave blank to keep)';
    document.getElementById('editUserId').value  = user.id;
    document.getElementById('fName').value       = user.name;
    document.getElementById('fUsername').value   = user.username;
    document.getElementById('fRole').value       = user.role;
  } else {
    document.getElementById('desktopFormTitle').textContent = 'Add new user';
    document.getElementById('saveBtnTxt').textContent       = 'Save user';
    document.getElementById('passwordLabel').textContent    = 'Password *';
    document.getElementById('editUserId').value = '';
  }
}

function closeDesktopForm() {
  document.getElementById('desktopForm').style.display = 'none';
  clearDesktopForm();
}

function clearDesktopForm() {
  ['editUserId','fName','fUsername','fRole','fPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('formError').style.display = 'none';
}

function saveUser() {
  const name     = document.getElementById('fName').value.trim();
  const username = document.getElementById('fUsername').value.trim().toLowerCase();
  const role     = document.getElementById('fRole').value;
  const password = document.getElementById('fPassword').value;
  const editId   = document.getElementById('editUserId').value;

  if (!name || !username || !role) {
    showFormError('formErrorText', 'formError', 'Name, username and role are required');
    return;
  }
  if (!editId && !password) {
    showFormError('formErrorText', 'formError', 'Password is required for new users');
    return;
  }

  // Check duplicate username
  const existing = Storage.getUsers().find(u => u.username === username && u.id !== editId);
  if (existing) {
    showFormError('formErrorText', 'formError', 'Username already taken');
    return;
  }

  if (editId) {
    const user = Storage.getUserById(editId);
    user.name     = name;
    user.username = username;
    user.role     = role;
    if (password) user.password = password;
    Storage.updateUser(user);
    Storage.addAuditEntry('USER_UPDATED', `Updated user: ${name}`);
    Utils.showSnackbar('User updated', 'success');
  } else {
    Storage.addUser({ name, username, role, password });
    Storage.addAuditEntry('USER_CREATED', `Created user: ${name} (${role})`);
    Utils.showSnackbar('User created', 'success');
  }

  closeDesktopForm();
  renderUsers();
}

// ── Mobile sheet ──────────────────────────────────────────
function showBottomSheet() {
  document.getElementById('overlay').classList.add('show');
  document.getElementById('userSheet').classList.add('open');
}

function closeSheet() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('userSheet').classList.remove('open');
}

function clearMobileForm() {
  ['mEditUserId','mfName','mfUsername','mfRole','mfPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('mFormError').style.display = 'none';
}

function saveMobileUser() {
  const name     = document.getElementById('mfName').value.trim();
  const username = document.getElementById('mfUsername').value.trim().toLowerCase();
  const role     = document.getElementById('mfRole').value;
  const password = document.getElementById('mfPassword').value;
  const editId   = document.getElementById('mEditUserId').value;

  if (!name || !username || !role) {
    showFormError('mFormErrorText', 'mFormError', 'Name, username and role are required');
    return;
  }
  if (!editId && !password) {
    showFormError('mFormErrorText', 'mFormError', 'Password is required for new users');
    return;
  }

  const existing = Storage.getUsers().find(u => u.username === username && u.id !== editId);
  if (existing) {
    showFormError('mFormErrorText', 'mFormError', 'Username already taken');
    return;
  }

  if (editId) {
    const user = Storage.getUserById(editId);
    user.name = name; user.username = username; user.role = role;
    if (password) user.password = password;
    Storage.updateUser(user);
    Storage.addAuditEntry('USER_UPDATED', `Updated user: ${name}`);
    Utils.showSnackbar('User updated', 'success');
  } else {
    Storage.addUser({ name, username, role, password });
    Storage.addAuditEntry('USER_CREATED', `Created user: ${name} (${role})`);
    Utils.showSnackbar('User created', 'success');
  }

  closeSheet();
  renderUsers();
}

// ── Delete ────────────────────────────────────────────────
function openConfirm(id, name) {
  deleteTargetId = id;
  document.getElementById('confirmBody').textContent =
    `"${name}" will be permanently removed from the system.`;
  document.getElementById('confirmDialog').classList.add('show');
}

function closeConfirm() {
  deleteTargetId = null;
  document.getElementById('confirmDialog').classList.remove('show');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  const user = Storage.getUserById(deleteTargetId);
  Storage.deleteUser(deleteTargetId);
  Storage.addAuditEntry('USER_DELETED', `Deleted user: ${user ? user.name : deleteTargetId}`);
  closeConfirm();
  closeDesktopForm();
  renderUsers();
  Utils.showSnackbar('User deleted', 'success');
}

// ── Reset password ────────────────────────────────────────
function openReset(id, name) {
  resetTargetId = id;
  document.getElementById('resetBody').textContent = `Set a new password for "${name}".`;
  document.getElementById('newPassword').value = '';
  document.getElementById('resetDialog').classList.add('show');
}

function closeReset() {
  resetTargetId = null;
  document.getElementById('resetDialog').classList.remove('show');
}

function confirmReset() {
  const newPw = document.getElementById('newPassword').value;
  if (!newPw) return;
  const user = Storage.getUserById(resetTargetId);
  if (!user) return;
  user.password = newPw;
  Storage.updateUser(user);
  Storage.addAuditEntry('PASSWORD_RESET', `Password reset for: ${user.name}`);
  closeReset();
  Utils.showSnackbar('Password reset successfully', 'success');
}

// ── Helpers ───────────────────────────────────────────────
function showFormError(textId, wrapId, msg) {
  document.getElementById(textId).textContent = msg;
  document.getElementById(wrapId).style.display = 'flex';
}

function togglePw(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  const show  = input.type === 'password';
  input.type       = show ? 'text' : 'password';
  icon.textContent = show ? 'visibility_off' : 'visibility';
}

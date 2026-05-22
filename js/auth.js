/* FILE: js/auth.js | Authentication and session management */
/* ============================================================
   MEDCARE PMS — AUTH HELPERS
   Session management and role-based access
   ============================================================ */

const Auth = (() => {

  // Mock users — replace with real API call in production
  const USERS = [
    { username: 'admin',      password: 'admin123',  role: 'Admin',       name: 'Admin' },
    { username: 'pharmacist', password: 'pharm123',  role: 'Pharmacist',  name: 'Dr. Asante' },
    { username: 'attendant',  password: 'attend123', role: 'Attendant',   name: 'Kofi' },
  ];

  // Nav cards visible per role
  const ROLE_NAV = {
    Admin:      ['inventory', 'sales', 'prescriptions', 'reports', 'users', 'audit'],
    Pharmacist: ['inventory', 'prescriptions', 'reports'],
    Attendant:  ['sales', 'inventory'],
  };

  function login(username, password) {
    const user = USERS.find(
      u => u.username === username.trim().toLowerCase()
        && u.password === password
    );
    if (user) {
      Storage.setSession({ username: user.username, role: user.role, name: user.name });
      return { success: true, user };
    }
    return { success: false };
  }

  function logout() {
    Storage.clearSession();
    window.location.href = '../login/';
  }

  function getSession() {
    return Storage.getSession();
  }

  function getRole() {
    const s = Storage.getSession();
    return s ? s.role : null;
  }

  function getName() {
    const s = Storage.getSession();
    return s ? s.name : 'User';
  }

  function canAccess(module) {
    const role = getRole();
    if (!role) return false;
    return (ROLE_NAV[role] || []).includes(module);
  }

  function getNavItems() {
    const role = getRole();
    return ROLE_NAV[role] || [];
  }

  return { login, logout, getSession, getRole, getName, canAccess, getNavItems };

})();

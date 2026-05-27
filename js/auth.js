/* FILE: js/auth.js | Authentication and session management */

const Auth = (() => {

  // Nav cards visible per role
  const ROLE_NAV = {
    Admin:      ['inventory', 'sales', 'prescriptions', 'reports', 'users', 'audit'],
    Pharmacist: ['inventory', 'prescriptions', 'reports', 'users', 'audit'],
    Attendant:  ['sales', 'inventory', 'prescriptions'],
  };

  function login(username, password) {
    // Handled by API.login() in login.js
    return { success: false };
  }

  function logout() {
    API.logout();
  }

  function getSession() {
    return API.getUser();
  }

  function getRole() {
    const u = API.getUser();
    return u ? u.role : null;
  }

  function getName() {
    const u = API.getUser();
    return u ? u.name : 'User';
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
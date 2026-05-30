/* FILE: js/api.js | Frontend API client — talks to Node.js backend */

const API = (() => {

  const BASE_URL = 'http://localhost:5000/api';

  // ── Token management ──────────────────────────────────────
  function getToken()        { return sessionStorage.getItem('medcare_token'); }
  function setToken(token)   { sessionStorage.setItem('medcare_token', token); }
  function clearToken()      { sessionStorage.removeItem('medcare_token'); }
  function getUser()         { return JSON.parse(sessionStorage.getItem('medcare_user') || 'null'); }
  function setUser(user)     { sessionStorage.setItem('medcare_user', JSON.stringify(user)); }
  function clearUser()       { sessionStorage.removeItem('medcare_user'); }

  function isLoggedIn()      { return !!getToken(); }

  // ── Base fetch with auth header ───────────────────────────
  async function request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res  = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  const get    = (endpoint)        => request('GET',    endpoint);
  const post   = (endpoint, body)  => request('POST',   endpoint, body);
  const put    = (endpoint, body)  => request('PUT',    endpoint, body);
  const del    = (endpoint)        => request('DELETE', endpoint);

  // ── Auth ──────────────────────────────────────────────────
  async function login(username, password) {
    const data = await post('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try { await post('/auth/logout'); } catch (e) { /* ignore */ }
    clearToken();
    clearUser();
    window.location.href = '/login/';
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return false;
    }
    return true;
  }

  // ── Drugs ─────────────────────────────────────────────────
  const getDrugs    = ()       => get('/drugs');
  const addDrug     = (drug)   => post('/drugs', drug);
  const updateDrug  = (id, d)  => put(`/drugs/${id}`, d);
  const deleteDrug  = (id)     => del(`/drugs/${id}`);

  // ── Sales ─────────────────────────────────────────────────
  const getSales  = ()     => get('/sales');
  const addSale   = (sale) => post('/sales', sale);

  // ── Prescriptions ─────────────────────────────────────────
  const getPrescriptions = ()    => get('/prescriptions');
  const addPrescription  = (rx)  => post('/prescriptions', rx);

  // ── Users ─────────────────────────────────────────────────
  const getUsers        = ()          => get('/users');
  const addUser         = (user)      => post('/users', user);
  const updateUser      = (id, user)  => put(`/users/${id}`, user);
  const deleteUser      = (id)        => del(`/users/${id}`);
  const resetPassword   = (id, pass)  => put(`/users/${id}/reset-password`, { password: pass });

  // ── Audit ─────────────────────────────────────────────────
  const getAuditLog = (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return get(`/audit${params ? '?' + params : ''}`);
  };

  return {
    // Auth
    login, logout, requireAuth, isLoggedIn, getToken, getUser,
    // Drugs
    getDrugs, addDrug, updateDrug, deleteDrug,
    // Sales
    getSales, addSale,
    // Prescriptions
    getPrescriptions, addPrescription,
    // Users
    getUsers, addUser, updateUser, deleteUser, resetPassword,
    // Audit
    getAuditLog,
  };

})();
/* FILE: js/storage.js | Shared localStorage helpers */
/* ============================================================
   MEDCARE PMS — STORAGE HELPERS
   Single source of truth for all localStorage operations
   ============================================================ */

const Storage = (() => {

  const KEYS = {
    SESSION:       'medcare_session',
    DRUGS:         'medcare_drugs',
    SALES:         'medcare_sales',
    PRESCRIPTIONS: 'medcare_prescriptions',
    THEME:         'medcare_theme',
    AUDIT:         'medcare_audit',
    USERS:         'medcare_users',
  };

  // ── Generic ──────────────────────────────────────────────
  function get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // ── Session ───────────────────────────────────────────────
  function getSession()        { return get(KEYS.SESSION); }
  function setSession(user)    { return set(KEYS.SESSION, user); }
  function clearSession()      { remove(KEYS.SESSION); }

  // ── Drugs ─────────────────────────────────────────────────
  function getDrugs()          { return get(KEYS.DRUGS) || []; }
  function setDrugs(drugs)     { return set(KEYS.DRUGS, drugs); }

  function addDrug(drug) {
    const drugs = getDrugs();
    drug.id = Date.now().toString();
    drugs.push(drug);
    return setDrugs(drugs);
  }

  function updateDrug(updated) {
    const drugs = getDrugs().map(d => d.id === updated.id ? updated : d);
    return setDrugs(drugs);
  }

  function deleteDrug(id) {
    const drugs = getDrugs().filter(d => d.id !== id);
    return setDrugs(drugs);
  }

  function getDrugById(id) {
    return getDrugs().find(d => d.id === id) || null;
  }

  // ── Sales ─────────────────────────────────────────────────
  function getSales()          { return get(KEYS.SALES) || []; }
  function setSales(sales)     { return set(KEYS.SALES, sales); }

  function addSale(sale) {
    const sales = getSales();
    sale.id = Date.now().toString();
    sale.timestamp = new Date().toISOString();
    sales.unshift(sale);
    return setSales(sales);
  }

  // ── Prescriptions ─────────────────────────────────────────
  function getPrescriptions()       { return get(KEYS.PRESCRIPTIONS) || []; }
  function setPrescriptions(list)   { return set(KEYS.PRESCRIPTIONS, list); }

  function addPrescription(rx) {
    const list = getPrescriptions();
    rx.id = Date.now().toString();
    rx.timestamp = new Date().toISOString();
    list.unshift(rx);
    return setPrescriptions(list);
  }

  // ── Theme ─────────────────────────────────────────────────
  function getTheme()          { return get(KEYS.THEME) || 'light'; }
  function setTheme(theme)     { return set(KEYS.THEME, theme); }

  // ── Seed data (first run) ─────────────────────────────────
  function seedIfEmpty() {
    if (getDrugs().length === 0) {
      setDrugs([
        { id:'1', name:'Amoxicillin 500mg',  category:'Antibiotic',       stock:120, price:12.50, expiry:'2026-08-15', supplier:'PharmaCo' },
        { id:'2', name:'Ibuprofen 400mg',    category:'Painkiller',       stock:45,  price:8.99,  expiry:'2026-06-20', supplier:'MediSupply' },
        { id:'3', name:'Lisinopril 10mg',    category:'Antihypertensive', stock:200, price:15.00, expiry:'2026-11-01', supplier:'HealthPlus' },
        { id:'4', name:'Metformin 500mg',    category:'Antidiabetic',     stock:7,   price:9.50,  expiry:'2026-05-28', supplier:'PharmaCo' },
        { id:'5', name:'Atorvastatin 20mg',  category:'Antihypertensive', stock:15,  price:22.00, expiry:'2026-06-10', supplier:'MediSupply' },
        { id:'6', name: 'Paracetamol 500mg', category:'Painkiller',       stock:200, price:10.00, expiry:'2029-09-10', supplier:'Nene Ltd'} 
      ]);
    };
    if (getUsers().length === 0) {
      setUsers([
        { id:'u1', username:'admin',      password:'admin123',  role:'Admin',      name:'Admin'      },
        { id:'u2', username:'pharmacist', password:'pharm123',  role:'Pharmacist', name:'Dr. Asante' },
        { id:'u3', username:'attendant',  password:'attend123', role:'Attendant',  name:'Kofi'       },
      ]);
    };
  }
  // ── Audit Log ─────────────────────────────────────────────
  function getAuditLog()     { return get(KEYS.AUDIT) || []; }
  function setAuditLog(logs) { return set(KEYS.AUDIT, logs); }

  function addAuditEntry(action, detail) {
    const session = getSession();
    const logs    = getAuditLog();
    logs.unshift({
      id:        Date.now().toString(),
      action,
      detail,
      user:      session ? session.name     : 'System',
      role:      session ? session.role     : '—',
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 entries
    if (logs.length > 500) logs.splice(500);
    return setAuditLog(logs);
  }

  // ── Users ─────────────────────────────────────────────────
  function getUsers()        { return get(KEYS.USERS) || []; }
  function setUsers(users)   { return set(KEYS.USERS, users); }

  function addUser(user) {
    const users = getUsers();
    user.id     = Date.now().toString();
    users.push(user);
    return setUsers(users);
  }

  function updateUser(updated) {
    const users = getUsers().map(u => u.id === updated.id ? updated : u);
    return setUsers(users);
  }

  function deleteUser(id) {
    const users = getUsers().filter(u => u.id !== id);
    return setUsers(users);
  }

  function getUserById(id) {
    return getUsers().find(u => u.id === id) || null;
  }
  return {
    // Session
    getSession, setSession, clearSession,
    // Drugs
    getDrugs, setDrugs, addDrug, updateDrug, deleteDrug, getDrugById,
    // Sales
    getSales, setSales, addSale,
    // Prescriptions
    getPrescriptions, addPrescription,
    // Theme
    getTheme, setTheme,
    // Seed
    seedIfEmpty,
    // Audit
    getAuditLog, addAuditEntry,
    // Users
    getUsers, addUser, updateUser, deleteUser, getUserById,
  };

})();

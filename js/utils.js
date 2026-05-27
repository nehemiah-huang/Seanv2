/* FILE: js/utils.js | Shared utility functions */
/* ============================================================
   MEDCARE PMS — UTILITY HELPERS
   Currency, dates, expiry logic, low stock, theme
   ============================================================ */

const Utils = (() => {

  const LOW_STOCK_THRESHOLD   = 10;
  const EXPIRY_CRITICAL_DAYS  = 30;
  const EXPIRY_WARNING_DAYS   = 60;

  // ── Currency ──────────────────────────────────────────────
  function formatCurrency(amount) {
    return `GH₵ ${parseFloat(amount || 0).toFixed(2)}`;
  }

  // ── Dates ─────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function daysUntilExpiry(dateStr) {
    const expiry = new Date(dateStr + 'T00:00:00');
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }

  // ── Expiry status ─────────────────────────────────────────
  function getExpiryStatus(dateStr) {
    const days = daysUntilExpiry(dateStr);
    if (days <= 0)                        return { cls: 'badge-red',    icon: 'warning',       label: 'Expired' };
    if (days <= EXPIRY_CRITICAL_DAYS)     return { cls: 'badge-red',    icon: 'warning',       label: `${days}d left` };
    if (days <= EXPIRY_WARNING_DAYS)      return { cls: 'badge-yellow', icon: 'schedule',      label: `${days}d left` };
    return                                       { cls: 'badge-green',  icon: 'check_circle',  label: 'OK' };
  }

  // ── Low stock ─────────────────────────────────────────────
  function isLowStock(stock) {
    return parseInt(stock) < LOW_STOCK_THRESHOLD;
  }

  // ── Greeting ──────────────────────────────────────────────
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ── Today's date label ────────────────────────────────────
  function getTodayLabel() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  // ── Theme ─────────────────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.setTheme(theme);
  }

  function initTheme() {
    const saved = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  }

  function toggleTheme() {
    const current = Storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  }

  // ── Snackbar ──────────────────────────────────────────────
  function showSnackbar(message, type = 'success') {
    let snack = document.getElementById('snackbar');
    if (!snack) {
      snack = document.createElement('div');
      snack.id = 'snackbar';
      snack.className = 'snackbar';
      snack.innerHTML = `<span class="material-icons" id="snack-icon"></span>
                         <span id="snack-msg"></span>`;
      document.body.appendChild(snack);
    }
    snack.className = `snackbar ${type}`;
    document.getElementById('snack-icon').textContent = type === 'success' ? 'check_circle' : 'error';
    document.getElementById('snack-msg').textContent  = message;
    snack.classList.add('show');
    clearTimeout(snack._timer);
    snack._timer = setTimeout(() => snack.classList.remove('show'), 2800);
  }

  // ── Nav active tab ────────────────────────────────────────
  function setActiveNav(pageId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === pageId);
    });
  }

  // ── Guard: redirect to login if no session ────────────────
  function requireAuth() {
    if (!Storage.getSession()) {
      // Works from any subfolder depth
      const depth = window.location.pathname.split('/').filter(Boolean).length;
      const back  = depth > 1 ? '../'.repeat(depth - 1) : '';
      window.location.href = '/login/';
      return false;
    }
    return true;
  }

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
    daysUntilExpiry,
    getExpiryStatus,
    isLowStock,
    getGreeting,
    getTodayLabel,
    applyTheme,
    initTheme,
    toggleTheme,
    showSnackbar,
    setActiveNav,
    requireAuth,
    LOW_STOCK_THRESHOLD,
    EXPIRY_CRITICAL_DAYS,
    EXPIRY_WARNING_DAYS,
  };

})();

/* FILE: js/screens/dashboard.js | SCREEN: Dashboard */

const NAV_CARDS = [
  { id:'inventory',     label:'Inventory',      icon:'inventory_2',    href:'/inventory/',     active:true },
  { id:'sales',         label:'Sales',           icon:'point_of_sale',  href:'/sales/',         active:true },
  { id:'prescriptions', label:'Prescriptions',   icon:'medication',     href:'/prescriptions/', active:true },
  { id:'reports',       label:'Reports',         icon:'bar_chart',      href:'/reports/',       active:true },
  { id:'users',         label:'User Management', icon:'manage_accounts',href:'/users/',         active:true },
  { id:'audit',         label:'Audit Log',       icon:'history',        href:'/audit/',         active:true },
];

document.addEventListener('DOMContentLoaded', () => {
  if (!API.requireAuth()) return;
  Nav.render('dashboard');

  const theme = Utils.initTheme();
  const mobileToggle = document.getElementById('mobileThemeToggle');
  if (mobileToggle) mobileToggle.checked = (theme === 'dark');

  const session = Auth.getSession();
  document.getElementById('greetTitle').textContent =
    `${Utils.getGreeting()}, ${session.name}`;
  document.getElementById('greetDate').textContent = Utils.getTodayLabel();

  // Mobile avatar
  const avatarBtn = document.getElementById('avatarBtn');
  if (avatarBtn) {
    avatarBtn.textContent = session.name.charAt(0).toUpperCase();
    document.getElementById('roleChip').textContent = `Role: ${session.role}`;
  }

  loadKPIs();
  renderNavCards();

  document.addEventListener('click', (e) => {
    const btn  = document.getElementById('avatarBtn');
    const chip = document.getElementById('roleChip');
    if (btn && chip && !btn.contains(e.target)) {
      chip.classList.remove('show');
    }
  });
});

async function loadKPIs() {
  try {
    const [drugs, sales] = await Promise.all([
      API.getDrugs(),
      API.getSales(),
    ]);

    const today = new Date().toDateString();
    const todayTotal = sales
      .filter(s => new Date(s.created_at).toDateString() === today)
      .reduce((sum, s) => sum + parseFloat(s.grand_total || 0), 0);

    document.getElementById('kpiSales').textContent = Utils.formatCurrency(todayTotal);
    document.getElementById('kpiLow').textContent   = drugs.filter(d => Utils.isLowStock(d.stock)).length;
    document.getElementById('kpiExp').textContent   = drugs.filter(d => Utils.daysUntilExpiry(d.expiry) <= 60).length;
    document.getElementById('kpiTotal').textContent = drugs.length;
  } catch (err) {
    console.error('Failed to load KPIs:', err);
  }
}

function renderNavCards() {
  const accessible = Auth.getNavItems();
  const grid = document.getElementById('navGrid');
  grid.innerHTML = NAV_CARDS.map(card => {
    const canSee   = accessible.includes(card.id);
    const isActive = card.active && canSee;
    return `
      <a class="nav-card ${!isActive ? 'disabled' : ''}"
         href="${isActive ? card.href : '#'}"
         onclick="${!isActive ? 'return false;' : ''}">
        ${!isActive ? `<span class="badge-soon nav-card-soon">Coming soon</span>` : ''}
        <span class="material-icons">${card.icon}</span>
        <span class="nav-card-label">${card.label}</span>
        ${isActive ? `<span class="material-icons nav-card-arrow">chevron_right</span>` : ''}
      </a>`;
  }).join('');
}

function toggleRoleChip() {
  document.getElementById('roleChip').classList.toggle('show');
}

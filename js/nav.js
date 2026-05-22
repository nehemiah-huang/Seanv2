/* FILE: js/nav.js | Shared top navigation renderer */

const Nav = (() => {

  const LINKS = [
    { id:'dashboard',     label:'Dashboard',    icon:'home',          href:'../dashboard/'     },
    { id:'inventory',     label:'Inventory',    icon:'inventory_2',   href:'../inventory/'     },
    { id:'sales',         label:'Sales',         icon:'point_of_sale', href:'../sales/'         },
    { id:'prescriptions', label:'Prescriptions', icon:'medication',    href:'../prescriptions/' },
    { id:'reports',       label:'Reports',       icon:'bar_chart',     href:'../reports/'       },
  ];

  function render(activePage) {
    const session = Auth.getSession();
    if (!session) return;

    const accessible = Auth.getNavItems();
    const visibleLinks = LINKS.filter(l => accessible.includes(l.id));

    const topNav = document.getElementById('topNav');
    if (!topNav) return;

    topNav.innerHTML = `
      <!-- Brand -->
      <a class="top-nav-brand" href="../dashboard/">
        <span class="material-icons">medication</span>
        <span class="top-nav-brand-name">MedCare</span>
      </a>

      <!-- Nav links -->
      <div class="top-nav-links">
        ${visibleLinks.map(l => `
          <a class="top-nav-link ${l.id === activePage ? 'active' : ''}"
             href="${l.href}">
            <span class="material-icons">${l.icon}</span>
            ${l.label}
          </a>`).join('')}
      </div>

      <!-- Actions -->
      <div class="top-nav-actions">
        <label class="theme-toggle" title="Toggle dark mode">
          <input type="checkbox" id="themeToggle" onchange="handleThemeToggle(this)">
          <span class="theme-toggle-slider"></span>
        </label>
        <div style="position:relative;">
          <button class="top-nav-avatar" id="avatarBtn" onclick="toggleRoleChip()">
            ${session.name.charAt(0).toUpperCase()}
          </button>
          <div class="role-chip" id="roleChip" style="right:0;top:44px;">
            ${session.name} &middot; ${session.role}
          </div>
        </div>
        <button class="icon-btn" onclick="Auth.logout()" title="Logout" aria-label="Logout">
          <span class="material-icons">logout</span>
        </button>
      </div>
    `;

    // Set theme toggle state
    const theme = Utils.initTheme();
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.checked = (theme === 'dark');

    // Close role chip on outside click
    document.addEventListener('click', (e) => {
      const btn  = document.getElementById('avatarBtn');
      const chip = document.getElementById('roleChip');
      if (btn && chip && !btn.contains(e.target)) {
        chip.classList.remove('show');
      }
    });
  }

  return { render };

})();

function handleThemeToggle(checkbox) {
  Utils.applyTheme(checkbox.checked ? 'dark' : 'light');
  // Sync mobile theme icon if present
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = checkbox.checked ? 'light_mode' : 'dark_mode';
}

function toggleRoleChip() {
  document.getElementById('roleChip').classList.toggle('show');
}

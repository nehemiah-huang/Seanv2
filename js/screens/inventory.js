/* FILE: js/screens/inventory.js | SCREEN: Inventory */

let deleteTargetId = null;
let currentQuery   = '';
let isDesktop      = () => window.innerWidth >= 768;

document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.requireAuth()) return;
  Storage.seedIfEmpty();
  Nav.render('inventory');

  // Sync mobile theme icon
  const theme = Utils.getTheme ? Storage.getTheme() : 'light';
  updateThemeIcon(theme);

  renderList();

  // Hide desktop form panel initially
  closeDesktopForm();
});

// ── Render drug list ──────────────────────────────────────
function renderList() {
  const drugs    = Storage.getDrugs();
  const filtered = drugs.filter(d =>
    d.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(currentQuery.toLowerCase())
  );

  document.getElementById('chipTotal').textContent = `${drugs.length} drug${drugs.length !== 1 ? 's' : ''}`;
  document.getElementById('chipLow').textContent   = `${drugs.filter(d => Utils.isLowStock(d.stock)).length} low stock`;
  document.getElementById('chipExp').textContent   = `${drugs.filter(d => Utils.daysUntilExpiry(d.expiry) <= 60).length} expiring`;
  document.getElementById('searchHint').textContent = currentQuery
    ? `Showing ${filtered.length} of ${drugs.length} drugs`
    : `Showing all ${drugs.length} drugs`;

  const list = document.getElementById('drugList');

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-icons">medication</span></div>
        <p>${currentQuery ? 'No drugs found' : 'No drugs yet'}</p>
        <span>${currentQuery ? 'Try a different search term' : 'Tap + to add your first drug'}</span>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(drug => {
    const es    = Utils.getExpiryStatus(drug.expiry);
    const isLow = Utils.isLowStock(drug.stock);
    return `
    <div class="drug-card">
      <div class="drug-card-body">
        <div class="drug-left">
          <div class="drug-name">${drug.name}</div>
          <div class="drug-meta">
            <span>${drug.category}</span>
            <span>&middot;</span>
            <span>Stock: <strong>${drug.stock}</strong></span>
            <span>&middot;</span>
            <span>${drug.supplier || '—'}</span>
          </div>
        </div>
        <div class="drug-right">
          <div class="drug-price">${Utils.formatCurrency(drug.price)}</div>
          <div class="drug-actions">
            <button class="act-btn edit" onclick="openEdit('${drug.id}')" aria-label="Edit">
              <span class="material-icons">edit</span>
            </button>
            <button class="act-btn del" onclick="openConfirm('${drug.id}','${drug.name.replace(/'/g,"\\'")}')">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge ${es.cls}">
          <span class="material-icons">${es.icon}</span>
          ${Utils.formatDate(drug.expiry)} &middot; ${es.label}
        </span>
        ${isLow ? `<span class="badge badge-orange"><span class="material-icons">warning</span>Low stock</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── Search ────────────────────────────────────────────────
function handleSearch(val) {
  currentQuery = val;
  renderList();
}

// ── Open add/edit ─────────────────────────────────────────
function openSheet() {
  if (isDesktop()) {
    openDesktopForm(null);
  } else {
    clearMobileForm();
    document.getElementById('sheetTitle').textContent  = 'Add new drug';
    document.getElementById('mSaveBtnTxt').textContent = 'Save drug';
    document.getElementById('mEditId').value = '';
    showBottomSheet();
  }
}

function openEdit(id) {
  const drug = Storage.getDrugById(id);
  if (!drug) return;
  if (isDesktop()) {
    openDesktopForm(drug);
  } else {
    clearMobileForm();
    document.getElementById('sheetTitle').textContent  = 'Edit drug';
    document.getElementById('mSaveBtnTxt').textContent = 'Update drug';
    document.getElementById('mEditId').value    = drug.id;
    document.getElementById('mfName').value     = drug.name;
    document.getElementById('mfCategory').value = drug.category;
    document.getElementById('mfStock').value    = drug.stock;
    document.getElementById('mfPrice').value    = drug.price;
    document.getElementById('mfExpiry').value   = drug.expiry;
    document.getElementById('mfSupplier').value = drug.supplier || '';
    showBottomSheet();
  }
}

// ── Desktop form ──────────────────────────────────────────
function openDesktopForm(drug) {
  const panel = document.getElementById('desktopFormPanel');
  panel.style.display = 'block';
  clearDesktopForm();
  if (drug) {
    document.getElementById('desktopFormTitle').textContent = 'Edit drug';
    document.getElementById('saveBtnTxt').textContent       = 'Update drug';
    document.getElementById('editId').value    = drug.id;
    document.getElementById('fName').value     = drug.name;
    document.getElementById('fCategory').value = drug.category;
    document.getElementById('fStock').value    = drug.stock;
    document.getElementById('fPrice').value    = drug.price;
    document.getElementById('fExpiry').value   = drug.expiry;
    document.getElementById('fSupplier').value = drug.supplier || '';
  } else {
    document.getElementById('desktopFormTitle').textContent = 'Add new drug';
    document.getElementById('saveBtnTxt').textContent       = 'Save drug';
    document.getElementById('editId').value = '';
  }
}

function closeDesktopForm() {
  const panel = document.getElementById('desktopFormPanel');
  if (panel) panel.style.display = 'none';
  clearDesktopForm();
}

function clearDesktopForm() {
  ['editId','fName','fCategory','fStock','fPrice','fExpiry','fSupplier'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const err = document.getElementById('sheetError');
  if (err) err.style.display = 'none';
}

function saveDrug() {
  const name     = document.getElementById('fName').value.trim();
  const category = document.getElementById('fCategory').value;
  const stock    = parseInt(document.getElementById('fStock').value) || 0;
  const price    = parseFloat(document.getElementById('fPrice').value) || 0;
  const expiry   = document.getElementById('fExpiry').value;
  const supplier = document.getElementById('fSupplier').value.trim();
  const editId   = document.getElementById('editId').value;

  if (!name || !category || !expiry) {
    document.getElementById('sheetErrorText').textContent = 'Drug name, category and expiry date are required';
    document.getElementById('sheetError').style.display = 'flex';
    return;
  }

  const drug = { name, category, stock, price, expiry, supplier };
  if (editId) { drug.id = editId; Storage.updateDrug(drug); Utils.showSnackbar('Drug updated', 'success'); }
  else        { Storage.addDrug(drug); Utils.showSnackbar('Drug added', 'success'); }

  closeDesktopForm();
  renderList();
}

// ── Mobile bottom sheet ───────────────────────────────────
function showBottomSheet() {
  document.getElementById('overlay').classList.add('show');
  document.getElementById('drugSheet').classList.add('open');
}

function closeSheet() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('drugSheet').classList.remove('open');
}

function clearMobileForm() {
  ['mEditId','mfName','mfCategory','mfStock','mfPrice','mfExpiry','mfSupplier'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('mSheetError').style.display = 'none';
}

function saveMobileDrug() {
  const name     = document.getElementById('mfName').value.trim();
  const category = document.getElementById('mfCategory').value;
  const stock    = parseInt(document.getElementById('mfStock').value) || 0;
  const price    = parseFloat(document.getElementById('mfPrice').value) || 0;
  const expiry   = document.getElementById('mfExpiry').value;
  const supplier = document.getElementById('mfSupplier').value.trim();
  const editId   = document.getElementById('mEditId').value;

  if (!name || !category || !expiry) {
    document.getElementById('mSheetErrorText').textContent = 'Drug name, category and expiry are required';
    document.getElementById('mSheetError').style.display = 'flex';
    return;
  }

  const drug = { name, category, stock, price, expiry, supplier };
  if (editId) { drug.id = editId; Storage.updateDrug(drug); Utils.showSnackbar('Drug updated', 'success'); }
  else        { Storage.addDrug(drug); Utils.showSnackbar('Drug added', 'success'); }

  closeSheet();
  renderList();
}

// ── Delete ────────────────────────────────────────────────
function openConfirm(id, name) {
  deleteTargetId = id;
  document.getElementById('confirmBody').textContent = `"${name}" will be permanently removed from inventory.`;
  document.getElementById('confirmDialog').classList.add('show');
}

function closeConfirm() {
  deleteTargetId = null;
  document.getElementById('confirmDialog').classList.remove('show');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  Storage.deleteDrug(deleteTargetId);
  closeConfirm();
  closeDesktopForm();
  renderList();
  Utils.showSnackbar('Drug deleted', 'success');
}

// ── Theme ─────────────────────────────────────────────────
function toggleMobileTheme() {
  const next = Utils.toggleTheme();
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

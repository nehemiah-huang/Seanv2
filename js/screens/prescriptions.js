/* FILE: js/screens/prescriptions.js | SCREEN: Prescriptions */

let prescribedDrugs = [];
let activeTab = 'new';

document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.requireAuth()) return;
  Storage.seedIfEmpty();
  Nav.render('prescriptions');
  populateDrugDropdown();
  renderChips();
});

function populateDrugDropdown() {
  const select = document.getElementById('fDrug');
  const drugs  = Storage.getDrugs();
  select.innerHTML = '<option value="">Select drug…</option>' +
    drugs.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('panelNew').style.display     = tab === 'new'     ? 'block' : 'none';
  document.getElementById('panelHistory').style.display = tab === 'history' ? 'block' : 'none';
  document.getElementById('tab-new').classList.toggle('active',     tab === 'new');
  document.getElementById('tab-history').classList.toggle('active', tab === 'history');
  if (tab === 'history') renderHistory();
}

function addDrug() {
  const name   = document.getElementById('fDrug').value;
  const dosage = document.getElementById('fDosage').value.trim();
  if (!name) return;

  if (prescribedDrugs.find(d => d.name === name)) {
    document.getElementById('dupMsg').textContent = `"${name}" is already on this prescription.`;
    document.getElementById('dupWarning').style.display = 'flex';
    setTimeout(() => document.getElementById('dupWarning').style.display = 'none', 3000);
    return;
  }

  document.getElementById('dupWarning').style.display = 'none';
  prescribedDrugs.push({ name, dosage: dosage || 'As directed' });
  document.getElementById('fDrug').value   = '';
  document.getElementById('fDosage').value = '';
  renderChips();
}

function removeDrug(idx) {
  prescribedDrugs.splice(idx, 1);
  renderChips();
}

function renderChips() {
  const list = document.getElementById('drugChipList');
  if (!prescribedDrugs.length) { list.innerHTML = ''; return; }
  list.innerHTML = prescribedDrugs.map((d, i) => `
    <div class="drug-chip-item">
      <div>
        <div class="dc-name">${d.name}</div>
        <div class="dc-dose">${d.dosage}</div>
      </div>
      <button class="dc-remove" onclick="removeDrug(${i})" aria-label="Remove">
        <span class="material-icons">close</span>
      </button>
    </div>`).join('');
}

function saveRx() {
  const patient = document.getElementById('fPatient').value.trim();
  if (!patient) {
    document.getElementById('rxErrorText').textContent = 'Patient name is required';
    document.getElementById('rxError').style.display = 'flex';
    return;
  }
  if (!prescribedDrugs.length) {
    document.getElementById('rxErrorText').textContent = 'Add at least one drug';
    document.getElementById('rxError').style.display = 'flex';
    return;
  }

  document.getElementById('rxError').style.display = 'none';

  Storage.addPrescription({
    patient,
    age:       document.getElementById('fAge').value || '—',
    doctor:    document.getElementById('fDoctor').value || '—',
    diagnosis: document.getElementById('fDiagnosis').value || '—',
    notes:     document.getElementById('fNotes').value || '',
    drugs:     [...prescribedDrugs],
  });

  // Reset form
  ['fPatient','fAge','fDoctor','fDiagnosis','fNotes'].forEach(id =>
    document.getElementById(id).value = '');
  prescribedDrugs = [];
  renderChips();

  Storage.addAuditEntry('PRESCRIPTION_SAVED', `Prescription saved for ${patient}`);
  Utils.showSnackbar('Prescription saved successfully', 'success');
  setTimeout(() => switchTab('history'), 1000);
}

function renderHistory() {
  const list = document.getElementById('rxHistoryList');
  const rxs  = Storage.getPrescriptions();

  if (!rxs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-icons">description</span></div>
        <p>No prescriptions yet</p>
        <span>Saved prescriptions will appear here</span>
      </div>`;
    return;
  }

  list.innerHTML = rxs.map(rx => `
    <div class="rx-card">
      <div class="rx-header">
        <span class="rx-patient">${rx.patient}, ${rx.age}</span>
        <span class="rx-date">${Utils.formatDate(rx.timestamp ? rx.timestamp.split('T')[0] : '')}</span>
      </div>
      <div class="rx-meta">${rx.diagnosis} &middot; ${rx.doctor}</div>
      <div class="rx-drugs">
        ${rx.drugs.map(d => `<span class="badge badge-blue">${d.name || d}</span>`).join('')}
      </div>
    </div>`).join('');
}

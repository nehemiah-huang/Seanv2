/* FILE: js/screens/audit.js | SCREEN: Audit Log */

let filteredLogs = [];

const ACTION_LABELS = {
  LOGIN:               'Login',
  LOGOUT:              'Logout',
  DRUG_ADDED:          'Drug Added',
  DRUG_UPDATED:        'Drug Updated',
  DRUG_DELETED:        'Drug Deleted',
  SALE_COMPLETED:      'Sale Completed',
  PRESCRIPTION_SAVED:  'Prescription Saved',
  USER_CREATED:        'User Created',
  USER_UPDATED:        'User Updated',
  USER_DELETED:        'User Deleted',
  PASSWORD_RESET:      'Password Reset',
};

document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.requireAuth()) return;
  Nav.render('audit');

  // Default date range — last 30 days
  const today = new Date();
  const from  = new Date();
  from.setDate(from.getDate() - 30);
  document.getElementById('filterTo').value   = today.toISOString().split('T')[0];
  document.getElementById('filterFrom').value = from.toISOString().split('T')[0];

  applyFilters();
});

function applyFilters() {
  const logs      = Storage.getAuditLog();
  const fromDate  = document.getElementById('filterFrom').value;
  const toDate    = document.getElementById('filterTo').value;
  const action    = document.getElementById('filterAction').value;
  const userQuery = document.getElementById('filterUser').value.trim().toLowerCase();

  filteredLogs = logs.filter(log => {
    const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
    if (fromDate && logDate < fromDate) return false;
    if (toDate   && logDate > toDate)   return false;
    if (action   && log.action !== action) return false;
    if (userQuery && !log.user.toLowerCase().includes(userQuery)) return false;
    return true;
  });

  renderTable();
}

function clearFilters() {
  document.getElementById('filterAction').value = '';
  document.getElementById('filterUser').value   = '';
  const today = new Date();
  const from  = new Date();
  from.setDate(from.getDate() - 30);
  document.getElementById('filterTo').value   = today.toISOString().split('T')[0];
  document.getElementById('filterFrom').value = from.toISOString().split('T')[0];
  applyFilters();
}

function renderTable() {
  const tbody = document.getElementById('auditTableBody');
  const count = document.getElementById('resultCount');
  count.textContent = `Showing ${filteredLogs.length} entr${filteredLogs.length !== 1 ? 'ies' : 'y'}`;

  if (!filteredLogs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="audit-empty">No log entries found for the selected filters</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filteredLogs.map(log => `
    <tr>
      <td style="white-space:nowrap;">${Utils.formatDateTime(log.timestamp)}</td>
      <td>
        <span class="audit-action-badge action-${log.action}">
          ${ACTION_LABELS[log.action] || log.action}
        </span>
      </td>
      <td>${log.user}</td>
      <td>${log.role}</td>
      <td>${log.detail}</td>
    </tr>`).join('');
}

function exportCSV() {
  if (!filteredLogs.length) {
    Utils.showSnackbar('No data to export', 'error');
    return;
  }

  const headers = ['Date & Time', 'Action', 'User', 'Role', 'Detail'];
  const rows = filteredLogs.map(log => [
    Utils.formatDateTime(log.timestamp),
    ACTION_LABELS[log.action] || log.action,
    log.user,
    log.role,
    `"${log.detail.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `medcare_audit_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  Utils.showSnackbar('Audit log exported', 'success');
}

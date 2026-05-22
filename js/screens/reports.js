/* FILE: js/screens/reports.js | SCREEN: Reports */

let reportType = 'sales';

document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.requireAuth()) return;
  Storage.seedIfEmpty();
  Nav.render('reports');

  // Set default date range (last 30 days)
  const today = new Date();
  const from  = new Date();
  from.setDate(from.getDate() - 30);
  document.getElementById('toDate').value   = today.toISOString().split('T')[0];
  document.getElementById('fromDate').value = from.toISOString().split('T')[0];
});

function selectType(type) {
  reportType = type;
  ['sales','stock','expired'].forEach(t => {
    document.getElementById(`rtype-${t}`).classList.toggle('active', t === type);
  });
  document.getElementById('reportResult').style.display = 'none';
}

function generateReport() {
  const btn  = document.getElementById('generateBtn');
  const icon = document.getElementById('generateIcon');
  const txt  = document.getElementById('generateTxt');

  icon.textContent = 'autorenew';
  icon.classList.add('spinner');
  txt.textContent  = 'Generating…';
  btn.disabled     = true;

  setTimeout(() => {
    icon.classList.remove('spinner');
    icon.textContent = 'bar_chart';
    txt.textContent  = 'Generate report';
    btn.disabled     = false;
    renderReport();
  }, 800);
}

function renderReport() {
  const drugs = Storage.getDrugs();
  const sales = Storage.getSales();
  const from  = document.getElementById('fromDate').value;
  const to    = document.getElementById('toDate').value;

  let title, sub, bars, maxVal, heads, rows;

  if (reportType === 'sales') {
    const filtered = sales.filter(s => {
      const d = s.timestamp ? s.timestamp.split('T')[0] : '';
      return d >= from && d <= to;
    });

    // Group by drug
    const drugTotals = {};
    filtered.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (!drugTotals[item.name]) drugTotals[item.name] = { qty: 0, revenue: 0 };
        drugTotals[item.name].qty     += item.qty;
        drugTotals[item.name].revenue += item.qty * item.price;
      });
    });

    const entries = Object.entries(drugTotals).sort((a,b) => b[1].revenue - a[1].revenue);
    title  = 'Sales Summary';
    sub    = `${Utils.formatDate(from)} — ${Utils.formatDate(to)}`;
    maxVal = entries.length ? Math.max(...entries.map(e => e[1].revenue)) : 1;
    bars   = entries.slice(0,7).map(([name, d]) => ({
      label: name.split(' ')[0],
      val:   d.revenue,
      color: '#2C7DA0',
    }));
    heads  = ['Drug', 'Qty Sold', 'Revenue'];
    rows   = entries.map(([name, d]) => [
      name,
      d.qty,
      Utils.formatCurrency(d.revenue),
    ]);
    if (!rows.length) rows = [['No sales in this period', '—', '—']];

  } else if (reportType === 'stock') {
    title  = 'Low Stock Report';
    sub    = 'Current inventory levels';
    const sorted = [...drugs].sort((a,b) => a.stock - b.stock);
    maxVal = Math.max(...sorted.map(d => d.stock), 1);
    bars   = sorted.slice(0,7).map(d => ({
      label: d.name.split(' ')[0],
      val:   d.stock,
      color: d.stock < 10 ? '#FFCDD2' : d.stock < 20 ? '#FFF9C4' : '#C8E6C9',
    }));
    heads  = ['Drug', 'Category', 'Stock', 'Status'];
    rows   = sorted.map(d => {
      const status = d.stock < 10
        ? `<span class="badge badge-red"><span class="material-icons">warning</span>Critical</span>`
        : d.stock < 20
          ? `<span class="badge badge-yellow">Low</span>`
          : `<span class="badge badge-green"><span class="material-icons">check_circle</span>OK</span>`;
      return [d.name, d.category, d.stock, status];
    });

  } else {
    title  = 'Expired / Expiring Drugs';
    sub    = `As of ${Utils.formatDate(new Date().toISOString().split('T')[0])}`;
    const sorted = [...drugs].sort((a,b) => Utils.daysUntilExpiry(a.expiry) - Utils.daysUntilExpiry(b.expiry));
    maxVal = 1;
    bars   = [
      { label:'Expired', val: drugs.filter(d => Utils.daysUntilExpiry(d.expiry) <= 0).length,  color:'#FFCDD2' },
      { label:'<30d',    val: drugs.filter(d => { const x = Utils.daysUntilExpiry(d.expiry); return x > 0 && x <= 30; }).length,  color:'#FFCDD2' },
      { label:'<60d',    val: drugs.filter(d => { const x = Utils.daysUntilExpiry(d.expiry); return x > 30 && x <= 60; }).length, color:'#FFF9C4' },
      { label:'>60d',    val: drugs.filter(d => Utils.daysUntilExpiry(d.expiry) > 60).length,   color:'#C8E6C9' },
    ];
    maxVal = Math.max(...bars.map(b => b.val), 1);
    heads  = ['Drug', 'Expiry Date', 'Days Left', 'Status'];
    rows   = sorted.map(d => {
      const es = Utils.getExpiryStatus(d.expiry);
      return [d.name, Utils.formatDate(d.expiry), Utils.daysUntilExpiry(d.expiry), `<span class="badge ${es.cls}">${es.label}</span>`];
    });
  }

  // Render
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultSub').textContent   = sub;

  // Chart
  document.getElementById('chartBars').innerHTML = bars.map(b => {
    const h = Math.max(4, Math.round((b.val / maxVal) * 100));
    return `
      <div class="bar-col">
        <span class="bar-value">${reportType === 'sales' ? 'GH₵' + Math.round(b.val) : b.val}</span>
        <div class="bar-fill" style="height:${h}px;background:${b.color};"></div>
        <span class="bar-label">${b.label}</span>
      </div>`;
  }).join('');

  // Table
  document.getElementById('tableHead').innerHTML =
    `<tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr>`;
  document.getElementById('tableBody').innerHTML =
    rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');

  document.getElementById('reportResult').style.display = 'block';
}

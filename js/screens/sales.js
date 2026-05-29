/* FILE: js/screens/sales.js | SCREEN: Sales */

let cart          = [];
let selectedDrug  = null;
let qty           = 1;
let payMethod     = 'cash';

const PAY_LABELS = { cash:'Cash', momo:'MTN MoMo', voda:'Vodafone Cash', card:'Card' };

  document.addEventListener('DOMContentLoaded', () => {
    if (!API.requireAuth()) return;
    Nav.render('sales');
    renderCart();

    document.addEventListener('click', (e) => {
      if (!document.getElementById('drugSearch').contains(e.target)) {
        document.getElementById('suggestions').classList.remove('open');
      }
    });
  });


// ── Drug search ───────────────────────────────────────────
async function handleDrugSearch(val) {
  const sug = document.getElementById('suggestions');
  if (!val.trim()) { sug.classList.remove('open'); return; }

  const drugs = await API.getDrugs();
  const matches = drugs.filter(d =>
    d.name.toLowerCase().includes(val.toLowerCase()) && d.stock > 0
  ).slice(0, 6);

  if (!matches.length) { sug.classList.remove('open'); return; }

  sug.innerHTML = matches.map(d => `
    <div class="sug-item" onclick="selectDrug(${d.id}, '${d.name.replace(/'/g,"\\'")}', ${d.stock}, ${d.price})">
      <span class="sug-name">${d.name}</span>
      <span class="sug-stock">Stock: ${d.stock}</span>
    </div>`).join('');
  sug.classList.add('open');
}

function selectDrug(id, name, stock, price) {
  selectedDrug = { id, name, stock, price };
  qty = 1;
  document.getElementById('qtyVal').textContent  = 1;
  document.getElementById('scName').textContent  = name;
  document.getElementById('scMeta').textContent  = `Stock: ${stock}  ·  ${Utils.formatCurrency(price)}`;
  document.getElementById('selectedDrugWrap').style.display = 'block';
  document.getElementById('suggestions').classList.remove('open');
  document.getElementById('drugSearch').value = '';
  document.getElementById('stockError').style.display = 'none';
}

function clearSelected() {
  selectedDrug = null;
  qty = 1;
  document.getElementById('selectedDrugWrap').style.display = 'none';
  document.getElementById('drugSearch').value = '';
  document.getElementById('qtyVal').textContent = 1;
}

// ── Quantity stepper ──────────────────────────────────────
function changeQty(delta) {
  if (!selectedDrug) return;
  qty = Math.max(1, Math.min(qty + delta, selectedDrug.stock));
  document.getElementById('qtyVal').textContent = qty;
}

// ── Add to cart ───────────────────────────────────────────
function addToCart() {
  if (!selectedDrug) return;

  const existing = cart.find(i => i.id === selectedDrug.id);
  const totalQty = (existing ? existing.qty : 0) + qty;

  if (totalQty > selectedDrug.stock) {
    document.getElementById('stockErrorText').textContent =
      `Only ${selectedDrug.stock} units available`;
    document.getElementById('stockError').style.display = 'flex';
    return;
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: selectedDrug.id, name: selectedDrug.name, price: selectedDrug.price, qty });
  }

  clearSelected();
  renderCart();
}

// ── Cart ──────────────────────────────────────────────────
function renderCart() {
  const list  = document.getElementById('cartList');
  const count = cart.reduce((s, i) => s + i.qty, 0);

  document.getElementById('cartCount').textContent = `(${count} item${count !== 1 ? 's' : ''})`;
  document.getElementById('clearCartBtn').style.display = cart.length ? 'block' : 'none';

  // Cart badge (mobile)
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent    = count;
    badge.style.display  = count > 0 ? 'flex' : 'none';
  }

  if (!cart.length) {
    list.innerHTML = `
      <div class="cart-empty-msg">
        <span class="material-icons">shopping_basket</span>
        <span>Cart is empty</span>
      </div>`;
    setCompleteBtn(false);
    calcTotals();
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-meta">${item.qty} &times; ${Utils.formatCurrency(item.price)}</div>
      </div>
      <span class="ci-total">${Utils.formatCurrency(item.qty * item.price)}</span>
      <button class="ci-remove" onclick="removeFromCart('${item.id}')" aria-label="Remove">
        <span class="material-icons">close</span>
      </button>
    </div>`).join('');

  setCompleteBtn(true);
  calcTotals();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function scrollToCart() {
  document.getElementById('cartList').scrollIntoView({ behavior: 'smooth' });
}

// ── Totals ────────────────────────────────────────────────
function calcTotals() {
  const sub    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc   = Math.min(parseFloat(document.getElementById('discountInput').value) || 0, sub);
  const grand  = Math.max(0, sub - disc);
  document.getElementById('subtotal').textContent  = Utils.formatCurrency(sub);
  document.getElementById('grandTotal').textContent = Utils.formatCurrency(grand);
}

function setCompleteBtn(on) {
  const btn = document.getElementById('completeSaleBtn');
  btn.disabled = !on;
  btn.style.opacity = on ? '1' : '0.4';
}

// ── Payment ───────────────────────────────────────────────
function selectPay(method) {
  payMethod = method;
  ['cash','momo','voda','card'].forEach(m => {
    document.getElementById(`pay-${m}`).classList.toggle('selected', m === method);
  });
}

// ── Complete sale ─────────────────────────────────────────
async function completeSale() {
  if (!cart.length) return;

  const sub   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc  = Math.min(parseFloat(document.getElementById('discountInput').value) || 0, sub);
  const grand = Math.max(0, sub - disc);
  const session = Auth.getSession();

  try {
    await API.addSale({
      items:         cart,
      subtotal:      sub,
      discount:      disc,
      grandTotal:    grand,
      paymentMethod: payMethod,
    });

    // Build receipt
    const now = new Date();
    document.getElementById('receiptDate').textContent    = Utils.formatDateTime(now.toISOString());
    document.getElementById('receiptCashier').textContent = session.name;
    document.getElementById('receiptPayment').textContent = PAY_LABELS[payMethod];
    document.getElementById('receiptSubtotal').textContent = Utils.formatCurrency(sub);

    const discRow = document.getElementById('receiptDiscountRow');
    discRow.style.display = disc > 0 ? 'flex' : 'none';
    document.getElementById('receiptDiscount').textContent = `- ${Utils.formatCurrency(disc)}`;
    document.getElementById('receiptTotal').textContent    = Utils.formatCurrency(grand);

    document.getElementById('receiptItems').innerHTML = cart.map(i => `
      <div class="receipt-item">
        <span class="receipt-item-name">${i.qty}&times; ${i.name}</span>
        <span class="receipt-item-amt">${Utils.formatCurrency(i.qty * i.price)}</span>
      </div>`).join('');

    document.getElementById('overlay').classList.add('show');
    document.getElementById('receiptSheet').classList.add('open');

  } catch (err) {
    Utils.showSnackbar(err.message, 'error');
  }
}

function closeReceipt() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('receiptSheet').classList.remove('open');
}

function newSale() {
  closeReceipt();
  cart = [];
  document.getElementById('discountInput').value = '';
  selectPay('cash');
  renderCart();
  Utils.showSnackbar('New sale started', 'success');
}

import { EVENTS, GOOGLE_FORM } from './config.js';

// ── Active event ──────────────────────────────────────────────────────────────
const event = EVENTS.find(e => e.status === 'open') ?? null;

// ── DOM ───────────────────────────────────────────────────────────────────────
const modal        = document.getElementById('preorder-modal');
const modalClose   = document.getElementById('preorder-modal-close');
const openBtns     = document.querySelectorAll('[data-preorder-open]');
const productGrid  = document.getElementById('preorder-products');
const cartCount    = document.getElementById('cart-count');
const cartBadge    = document.getElementById('cart-badge');
const cartPanel    = document.getElementById('cart-panel');
const cartItems    = document.getElementById('cart-items');
const cartTotal    = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const orderStatus  = document.getElementById('order-status');
const eventInfo    = document.getElementById('event-info');
const preorderHero = document.getElementById('preorder-hero-cta');

// ── State ─────────────────────────────────────────────────────────────────────
const STORAGE_KEY = `brewmigos-cart-${event?.id ?? 'none'}`;
let cart = loadCart();

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  if (!event) {
    // No open event — hide pre-order CTAs
    document.querySelectorAll('[data-preorder-open], #preorder-section').forEach(el => el.setAttribute('hidden', ''));
    return;
  }

  // Render event info
  document.querySelectorAll('.event-name').forEach(el => el.textContent = event.name);
  document.querySelectorAll('.event-date').forEach(el => el.textContent = event.displayDate);
  document.querySelectorAll('.event-location').forEach(el => el.textContent = event.location);
  document.querySelectorAll('.event-deadline').forEach(el => {
    const d = new Date(event.deadline);
    el.textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  // Check deadline passed
  const deadlinePassed = new Date() > new Date(event.deadline + 'T23:59:59');
  if (deadlinePassed) {
    document.querySelectorAll('[data-preorder-open]').forEach(btn => {
      btn.textContent = 'Pre-orders closed';
      btn.disabled = true;
    });
  }

  renderProducts();
  renderCart();
  updateBadge();

  // Open/close modal
  openBtns.forEach(btn => btn.addEventListener('click', () => !deadlinePassed && openModal()));
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal(); });

  // Checkout
  checkoutForm?.addEventListener('submit', handleSubmit);
}

// ── Product cards ─────────────────────────────────────────────────────────────
function renderProducts() {
  if (!productGrid || !event) return;
  productGrid.innerHTML = event.products.map(p => /* html */ `
    <div class="po-card" data-id="${p.id}">
      <div class="po-card__img-wrap">
        <img src="${p.photo}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="po-card__body">
        <h4 class="po-card__name">${p.name}</h4>
        <p class="po-card__desc">${p.desc}</p>
        <div class="po-card__footer">
          <span class="po-card__price">₹${p.price}</span>
          <div class="qty-stepper" data-id="${p.id}">
            <button class="qty-btn" data-action="dec" aria-label="Remove one">−</button>
            <span class="qty-val">${cart[p.id] ?? 0}</span>
            <button class="qty-btn" data-action="inc" aria-label="Add one">+</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  productGrid.addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const id = btn.closest('.qty-stepper').dataset.id;
    const action = btn.dataset.action;
    if (action === 'inc') cart[id] = (cart[id] ?? 0) + 1;
    if (action === 'dec') cart[id] = Math.max(0, (cart[id] ?? 0) - 1);
    if (cart[id] === 0) delete cart[id];
    saveCart();
    updateQtyDisplay(id);
    renderCart();
    updateBadge();
  });
}

function updateQtyDisplay(id) {
  document.querySelectorAll(`.qty-stepper[data-id="${id}"] .qty-val`).forEach(el => {
    el.textContent = cart[id] ?? 0;
  });
}

// ── Cart ──────────────────────────────────────────────────────────────────────
function renderCart() {
  if (!cartItems || !event) return;
  const entries = Object.entries(cart);
  if (entries.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">No items yet. Pick some cookies above!</p>';
    cartTotal.textContent = '₹0';
    return;
  }
  let total = 0;
  cartItems.innerHTML = entries.map(([id, qty]) => {
    const p = event.products.find(x => x.id === id);
    if (!p) return '';
    const subtotal = p.price * qty;
    total += subtotal;
    return /* html */ `
      <div class="cart-row">
        <span class="cart-row__name">${p.name}</span>
        <span class="cart-row__qty">× ${qty}</span>
        <span class="cart-row__sub">₹${subtotal}</span>
      </div>`;
  }).join('');
  const totalQty = entries.reduce((s, [, q]) => s + q, 0);
  if (event.minOrderQty && totalQty < event.minOrderQty) {
    cartItems.innerHTML += `<p class="cart-note">Minimum order: ${event.minOrderQty} cookies (${event.minOrderQty - totalQty} more to go)</p>`;
  }
  cartTotal.textContent = `₹${total}`;
}

function updateBadge() {
  const qty = Object.values(cart).reduce((s, q) => s + q, 0);
  if (cartCount) cartCount.textContent = qty;
  if (cartBadge) cartBadge.classList.toggle('visible', qty > 0);
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  if (!checkoutForm.checkValidity()) { checkoutForm.reportValidity(); return; }

  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);
  if (event.minOrderQty && totalQty < event.minOrderQty) {
    showStatus('error', `Minimum order is ${event.minOrderQty} cookies. Add ${event.minOrderQty - totalQty} more.`);
    return;
  }
  if (totalQty === 0) { showStatus('error', 'Cart is empty.'); return; }

  const data = Object.fromEntries(new FormData(checkoutForm));
  const itemsSummary = Object.entries(cart).map(([id, qty]) => {
    const p = event.products.find(x => x.id === id);
    return p ? `${p.name} ×${qty} (₹${p.price * qty})` : '';
  }).filter(Boolean).join(' | ');

  const totalPrice = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = event.products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);

  const submitBtn = checkoutForm.querySelector('[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing order…';
  showStatus('', '');

  if (GOOGLE_FORM.formId) {
    await submitToGoogleForm({ ...data, itemsSummary, totalQty, totalPrice });
  } else {
    // Fallback: show summary + copy
    showFallbackSummary({ ...data, itemsSummary, totalQty, totalPrice });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Pre-order';
    return;
  }

  // Success
  cart = {};
  saveCart();
  renderCart();
  updateBadge();
  event.products.forEach(p => updateQtyDisplay(p.id));
  checkoutForm.reset();
  submitBtn.disabled = false;
  submitBtn.textContent = 'Place Pre-order';
  showStatus('success', `Order confirmed for ${event.displayDate}! We'll DM you on Instagram to confirm details. ☕🍪`);
}

async function submitToGoogleForm({ name, phone, email, notes, itemsSummary, totalQty, totalPrice }) {
  const { formId, entries: e } = GOOGLE_FORM;
  const body = new URLSearchParams();
  if (e.name)  body.set(e.name,  name);
  if (e.phone) body.set(e.phone, phone);
  if (e.email) body.set(e.email, email);
  if (e.event) body.set(e.event, event.displayDate);
  if (e.items) body.set(e.items, itemsSummary);
  if (e.qty)   body.set(e.qty,   String(totalQty));
  if (e.total) body.set(e.total, `₹${totalPrice}`);
  if (e.notes) body.set(e.notes, notes ?? '');

  const iframe = document.createElement('iframe');
  iframe.name = 'gform-target';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
  form.target = 'gform-target';
  form.style.display = 'none';
  body.forEach((v, k) => {
    const inp = document.createElement('input');
    inp.name = k; inp.value = v;
    form.appendChild(inp);
  });
  document.body.appendChild(form);
  form.submit();

  await new Promise(r => setTimeout(r, 1500));
  form.remove();
  setTimeout(() => iframe.remove(), 3000);
}

function showFallbackSummary({ name, phone, email, notes, itemsSummary, totalQty, totalPrice }) {
  const summary = [
    `Order for: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Event: ${event.displayDate}`,
    `Items: ${itemsSummary}`,
    `Total: ${totalQty} cookies — ₹${totalPrice}`,
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join('\n');

  showStatus('info', `
    <strong>Order summary (Google Form not configured yet)</strong><br>
    <pre class="order-summary-text">${summary}</pre>
    <button class="btn btn--outline btn--sm" id="copy-order">Copy to clipboard</button>
  `);

  document.getElementById('copy-order')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(summary).then(() => {
      document.getElementById('copy-order').textContent = 'Copied!';
    });
  });
}

function showStatus(type, html) {
  if (!orderStatus) return;
  orderStatus.className = `order-status${type ? ` order-status--${type}` : ''}`;
  orderStatus.innerHTML = html;
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal() {
  modal?.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal?.querySelector('.po-modal__inner')?.scrollTo(0, 0);
}
function closeModal() {
  modal?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Persistence ───────────────────────────────────────────────────────────────
function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
}

init();

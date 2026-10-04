// ── Nav ───────────────────────────────────
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

function setMenu(open) {
  navLinks?.classList.toggle('open', open);
  hamburger?.classList.toggle('open', open);
  hamburger?.setAttribute('aria-expanded', String(open));
}

hamburger?.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));

navLinks?.addEventListener('click', e => {
  if (e.target.closest('.nav__link, [data-preorder-open], [data-install-open]')) setMenu(false);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks?.classList.contains('open')) {
    setMenu(false);
    hamburger?.focus();
  }
});

// ── Scroll reveal ─────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseFloat(el.dataset.delay ?? '0');
    setTimeout(() => el.classList.add('visible'), delay);
    io.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  const siblings = [...(el.parentElement?.querySelectorAll(':scope > .reveal') ?? [])];
  if (siblings.length > 1) el.dataset.delay = String(siblings.indexOf(el) * 75);
  io.observe(el);
});

// ── Contact form ──────────────────────────
const contactForm   = document.getElementById('contact-form');
const contactStatus = document.getElementById('form-status');

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
  const btn = contactForm.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'Sending…';
  await new Promise(r => setTimeout(r, 900));
  if (contactStatus) contactStatus.textContent = 'Message sent. We\'ll be in touch soon.';
  btn.disabled = false; btn.textContent = 'Send Message';
  contactForm.reset();
});

// ── Lightbox (gallery) ────────────────────
const lb    = document.getElementById('lightbox');
const lbImg = lb?.querySelector('img');
let lbImages = [], lbIdx = 0, lbReturnFocus = null;

function openLightbox(imgs, idx) {
  lbImages = imgs; lbIdx = idx;
  lbImg.src = lbImages[lbIdx];
  lbReturnFocus = document.activeElement;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  lb.querySelector('.lightbox__close')?.focus();
}
function closeLightbox() {
  lb?.classList.remove('open');
  document.body.style.overflow = '';
  lbReturnFocus?.focus?.();
}
function navLightbox(dir) {
  lbIdx = (lbIdx + dir + lbImages.length) % lbImages.length;
  lbImg.src = lbImages[lbIdx];
}

lb?.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
lb?.querySelector('.lightbox__prev')?.addEventListener('click', () => navLightbox(-1));
lb?.querySelector('.lightbox__next')?.addEventListener('click', () => navLightbox(1));
lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lb?.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   navLightbox(-1);
  if (e.key === 'ArrowRight')  navLightbox(1);
});

document.addEventListener('click', e => {
  const img = e.target.closest('.masonry img');
  if (!img || !lb) return;
  const all = [...img.closest('.masonry').querySelectorAll('img')];
  openLightbox(all.map(i => i.src), all.indexOf(img));
});

// ── Install the app (Android only) ─────────
// `beforeinstallprompt` only fires in Chromium browsers, and not on every
// visit, so the pill doesn't wait for it: on Android it always shows, uses
// the native prompt when one has been captured, and otherwise falls back
// to manual "browser menu → Install app" steps.
const isAndroid    = /Android/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const canOfferInstall = isAndroid && !isStandalone;
const DISMISS_KEY  = 'brewmigos-install-dismissed';
const PILL_DELAY_MS = 2500;

const installIndicator = document.getElementById('install-indicator');
const installBtn       = document.getElementById('install-btn');
const installClose     = document.getElementById('install-close');
const installHelp      = document.getElementById('install-help');
const installHelpClose = document.getElementById('install-help-close');
const installOpeners   = document.querySelectorAll('[data-install-open]');
let deferredInstallPrompt = null;
let helpReturnFocus = null;

function wasDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}
function rememberDismissed() {
  try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
}
function hideInstallUI() {
  installIndicator?.setAttribute('hidden', '');
  installOpeners.forEach(el => el.setAttribute('hidden', ''));
}

function openInstallHelp() {
  helpReturnFocus = document.activeElement;
  installHelp?.removeAttribute('hidden');
  installHelpClose?.focus();
}
function closeInstallHelp() {
  installHelp?.setAttribute('hidden', '');
  helpReturnFocus?.focus?.();
}

async function startInstall() {
  if (!deferredInstallPrompt) { openInstallHelp(); return; }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (outcome === 'accepted') hideInstallUI();
}

if (canOfferInstall) {
  installOpeners.forEach(el => el.removeAttribute('hidden'));
  if (!wasDismissed()) setTimeout(() => installIndicator?.removeAttribute('hidden'), PILL_DELAY_MS);
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

installBtn?.addEventListener('click', startInstall);
installOpeners.forEach(el => el.addEventListener('click', startInstall));

installClose?.addEventListener('click', () => {
  rememberDismissed();
  installIndicator?.setAttribute('hidden', '');
});

installHelpClose?.addEventListener('click', closeInstallHelp);
installHelp?.addEventListener('click', e => { if (e.target === installHelp) closeInstallHelp(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && installHelp && !installHelp.hasAttribute('hidden')) closeInstallHelp();
});

window.addEventListener('appinstalled', hideInstallUI);

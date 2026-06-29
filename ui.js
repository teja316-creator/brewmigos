// ── Lucide icons ──────────────────────────
// lucide UMD loaded via <script> tag before this module
window.lucide?.createIcons();

// ── Nav scroll ────────────────────────────
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

navLinks?.addEventListener('click', e => {
  if (e.target.classList.contains('nav__link')) {
    navLinks.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
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
  const siblings = [...(el.parentElement?.querySelectorAll('.reveal') ?? [])];
  if (siblings.length > 1) el.dataset.delay = String(siblings.indexOf(el) * 75);
  io.observe(el);
});

// ── Card tilt ─────────────────────────────
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ── Reduced motion: pause hero video ──────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.getElementById('hero-video')?.pause();
}

// ── Contact form ──────────────────────────
const contactForm   = document.getElementById('contact-form');
const contactStatus = document.getElementById('form-status');

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
  const btn = contactForm.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'Sending…';
  await new Promise(r => setTimeout(r, 900));
  if (contactStatus) {
    contactStatus.className = 'form__status success';
    contactStatus.textContent = 'Message sent. We\'ll be in touch soon.';
  }
  btn.disabled = false; btn.textContent = 'Send Message';
  contactForm.reset();
});

// ── Gallery toggle ─────────────────────────
const galleryToggle = document.getElementById('gallery-toggle');
const galleryAll    = document.getElementById('gallery-all');

galleryToggle?.addEventListener('click', () => {
  const open = galleryAll.hasAttribute('hidden');
  if (open) {
    galleryAll.removeAttribute('hidden');
    galleryToggle.textContent = 'Show Less';
    galleryAll.classList.add('visible');
  } else {
    galleryAll.setAttribute('hidden', '');
    galleryToggle.textContent = 'See All Photos';
  }
});

// ── Lightbox ──────────────────────────────
const lb    = document.getElementById('lightbox');
const lbImg = lb?.querySelector('img');
let lbImages = [], lbIdx = 0;

function openLightbox(imgs, idx) {
  lbImages = imgs; lbIdx = idx;
  lbImg.src = lbImages[lbIdx];
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb?.classList.remove('open');
  document.body.style.overflow = '';
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
  const img = e.target.closest('.gallery-item img, .gallery__masonry img');
  if (!img) return;
  const section = img.closest('.gallery__featured, .gallery__masonry');
  const imgs = [...section.querySelectorAll('img')].map(i => i.src);
  openLightbox(imgs, [...section.querySelectorAll('img')].indexOf(img));
});

// 3D gallery click → open lightbox with full masonry set
document.addEventListener('gallery-3d-click', e => {
  const allImgs = [
    'assets/PHOTO-2026-06-29-11-44-33.jpg',
    'assets/PHOTO-2026-06-29-11-44-33%202.jpg',
    'assets/PHOTO-2026-06-29-11-44-33%203.jpg',
    'assets/PHOTO-2026-06-29-11-44-33%204.jpg',
    'assets/PHOTO-2026-06-29-11-44-33%205.jpg',
    'assets/PHOTO-2026-06-29-11-44-33%206.jpg',
    'assets/PHOTO-2026-06-29-11-44-35.jpg',
    'assets/PHOTO-2026-06-29-11-44-35%202.jpg',
    'assets/PHOTO-2026-06-29-11-44-35%203.jpg',
  ];
  openLightbox(allImgs, e.detail.idx ?? 0);
});

// ── Active nav on scroll ───────────────────
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav__link');
const secIO = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: `-${Math.round(window.innerHeight * 0.45)}px 0px -${Math.round(window.innerHeight * 0.45)}px 0px` });
sections.forEach(s => secIO.observe(s));

// ── Nav ───────────────────────────────────
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
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseFloat(el.dataset.delay ?? '0');
    setTimeout(() => el.classList.add('visible'), delay);
    io.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  const siblings = el.parentElement?.querySelectorAll('.reveal');
  if (siblings && siblings.length > 1) {
    const idx = [...siblings].indexOf(el);
    el.dataset.delay = String(idx * 80);
  }
  io.observe(el);
});

// ── Card tilt ─────────────────────────────
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── Contact form ──────────────────────────
const form   = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const btn = form.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.className = 'form__status';
  status.textContent = '';

  await new Promise(r => setTimeout(r, 1200));

  status.className = 'form__status success';
  status.textContent = 'Message sent! We\'ll get back to you soon. ☕';
  btn.disabled = false;
  btn.textContent = 'Send Message ✉️';
  form.reset();
});

// ── Gallery toggle ────────────────────────
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
const lb = document.createElement('div');
lb.className = 'lightbox';
lb.innerHTML = `
  <button class="lightbox__close" aria-label="Close">✕</button>
  <button class="lightbox__nav lightbox__prev" aria-label="Previous">‹</button>
  <img src="" alt="" />
  <button class="lightbox__nav lightbox__next" aria-label="Next">›</button>
`;
document.body.appendChild(lb);

const lbImg  = lb.querySelector('img');
let lbImages = [];
let lbIdx    = 0;

function openLightbox(imgs, idx) {
  lbImages = imgs;
  lbIdx    = idx;
  lbImg.src = lbImages[lbIdx];
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
}
function navLightbox(dir) {
  lbIdx = (lbIdx + dir + lbImages.length) % lbImages.length;
  lbImg.src = lbImages[lbIdx];
}

lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
lb.querySelector('.lightbox__prev').addEventListener('click', () => navLightbox(-1));
lb.querySelector('.lightbox__next').addEventListener('click', () => navLightbox(1));
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft')  navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

document.addEventListener('click', e => {
  const img = e.target.closest('.gallery-item img, .gallery__masonry img');
  if (!img) return;
  const section = img.closest('.gallery__featured, .gallery__masonry');
  const imgs = [...section.querySelectorAll('img')].map(i => i.src);
  const idx  = [...section.querySelectorAll('img')].indexOf(img);
  openLightbox(imgs, idx);
});

// ── Active nav link on scroll ─────────────
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav__link');

const secIO = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  });
}, { rootMargin: `-${Math.round(window.innerHeight * 0.4)}px 0px -${Math.round(window.innerHeight * 0.4)}px 0px` });

sections.forEach(s => secIO.observe(s));

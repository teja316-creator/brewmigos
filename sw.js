const CACHE = 'brewmigos-v8';
const PRECACHE = [
  '/',
  '/index.html',
  '/menu.html',
  '/events.html',
  '/gallery.html',
  '/about.html',
  '/contact.html',
  '/style.css',
  '/ui.js',
  '/preorder.js',
  '/config.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/favicon.svg',
  '/icons/cursor-cookie.svg',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400&family=Albert+Sans:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Cache-first for CDN assets (fonts)
  if (url.origin === 'https://unpkg.com' || url.origin === 'https://fonts.gstatic.com' || url.origin === 'https://fonts.googleapis.com') {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // Network-first for same-origin, forcing revalidation instead of
  // trusting the browser's own HTTP cache — GitHub Pages serves these
  // with Cache-Control: max-age=600, so a plain fetch() can silently
  // resolve from disk cache for up to 10 minutes after a deploy and
  // serve stale HTML paired with fresh (or vice versa) CSS/JS. 'no-cache'
  // forces a conditional GET (ETag/Last-Modified) every time — cheap
  // (304s if unchanged), but guarantees a genuinely new deploy is seen
  // immediately rather than however long is left on the old max-age.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

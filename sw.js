/* IvritSuite service worker — bump VERSION to invalidate the cache on deploy. */
const VERSION = 'v1';
const CACHE = 'ivritsuite-' + VERSION;

/* Core app shell. Big media (og-card, the data/ corpus) is left to runtime caching. */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/hebrew_blend_generator.html',
  '/hebrew_dictionary.html',
  '/classroom_dashboard.html',
  '/flash_cards.html',
  '/torah_trainer.html',
  '/resources.html',
  '/privacy.html',
  '/manifest.webmanifest',
  '/pwa.js',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // add() per-asset so a single 404 can't abort the whole install
      .then((cache) => Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Let cross-origin requests (Google Fonts, analytics) go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Cache-first, falling back to network; runtime-cache successful same-origin GETs.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline and uncached: fall back to the home shell for navigations.
          if (req.mode === 'navigate') return caches.match('/index.html');
          return Response.error();
        });
    })
  );
});

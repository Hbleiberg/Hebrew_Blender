/* IvritSuite service worker — bump VERSION to invalidate the cache on deploy. */
const VERSION = 'v329';
const CACHE = 'ivritsuite-' + VERSION;
// Version-independent cache for the big data/ corpora (dictionary words / emoji / parshiyot /
// pockettorah). Kept OUT of the version-scoped CACHE so a routine VERSION bump no longer evicts
// the ~7 MB of data files and forces a full re-download on the next visit. Bump this name only if
// the /data/ eviction semantics below actually change.
const DATA_CACHE = 'ivritsuite-data-v1';

/* Core app shell. Big media (og-card, the data/ corpus) is left to runtime caching. */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/hebrew_blend_generator.html',
  '/hebrew_dictionary.html',
  '/classroom_dashboard.html',
  '/flash_cards.html',
  '/torah_trainer.html',
  '/trope_tutor.html',
  '/Hebrew_Font_Maker.html',
  '/resources.html',
  '/privacy.html',
  '/contact.html',
  '/404.html',
  '/fonts/FrankRuhlLibre-Regular.ttf',
  '/manifest.webmanifest',
  '/pwa.js',
  '/js/i18n.js',
  '/locales/en.json',
  '/locales/he.json',
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
      // Keep both the current shell cache and the version-independent data cache.
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Let cross-origin requests (Google Fonts, analytics) go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Data corpora: cache-first into the version-independent DATA_CACHE so a VERSION bump
  // doesn't evict them. Match WITHOUT ignoreSearch so a ?v= cache-buster is an intentional
  // miss (the app bumps ?v= when a data file changes); on a fresh store, drop stale entries
  // that share the pathname but have a different ?v= so the cache doesn't grow unbounded.
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req)
            .then((res) => {
              if (res && res.ok && res.type === 'basic') {
                const copy = res.clone();
                cache.keys().then((keys) => keys.forEach((k) => {
                  const ku = new URL(k.url);
                  if (ku.pathname === url.pathname && k.url !== req.url) cache.delete(k);
                }));
                cache.put(req, copy);
              }
              return res;
            })
            .catch(() => cached || Response.error());
        })
      )
    );
    return;
  }

  // Locale dictionaries: network-first (like pages) so new i18n keys shipped in a deploy aren't
  // masked by the stale precached locale until the next worker activation — otherwise fresh
  // (network-first) HTML can reference keys the cache-first locale doesn't have yet, and the UI
  // shows raw `page.feature.key` strings. `cache: 'no-store'` bypasses the browser HTTP cache;
  // falls back to the precached copy offline.
  if (url.pathname.startsWith('/locales/')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // Network-first for pages + scripts (pwa.js) so a fresh deploy is never hidden
  // behind a stale cached copy; fall back to cache (then the home shell) offline.
  // `cache: 'no-store'` bypasses the BROWSER HTTP cache — GitHub Pages sets a max-age
  // on HTML, so without this the network-first fetch could itself be answered from the
  // HTTP cache and keep handing back a stale page after a deploy.
  if (req.mode === 'navigate' || req.destination === 'script') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(
          (cached) => cached || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error())))
    );
    return;
  }

  // Cache-first for static media (icons, splash, manifest); runtime-cache misses.
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
        .catch(() => Response.error());
    })
  );
});

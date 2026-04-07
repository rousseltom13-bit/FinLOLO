// FinLOLO — Service Worker v3
// Mise à jour : incrémenter CACHE_NAME à chaque déploiement
const CACHE_NAME = 'finlolo-v3';

const PRECACHE = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js',
  'https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVxsWxjBZRjr0FKM_04uQ.woff2',
  'https://fonts.gstatic.com/s/dmmono/v14/aFTU7PB1QTsUX8KYvrGyIYSnbKX9Rl0.woff2',
  'https://fonts.gstatic.com/s/dmsans/v15/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K65d50.woff2'
];

// Installation — précache des assets critiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(err => {
        // Certaines fonts peuvent échouer (CORS) — on continue quand même
        console.warn('[SW] Précache partiel:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// Activation — supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — stratégie hybride
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Navigation (HTML) : network-first avec fallback cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets CDN (Chart.js, fonts) : cache-first
  if (url.hostname.includes('jsdelivr') || url.hostname.includes('fonts.g')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // Tout le reste : network avec fallback cache
  e.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

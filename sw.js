const CACHE = "finlolo-v1";
const ASSETS = [
  "/", "/index.html",
  "/css/style.css",
  "/js/app.js", "/js/router.js", "/js/state.js",
  "/js/views/dashboard.js", "/js/views/enveloppe.js",
  "/js/views/structures.js", "/js/views/lombard.js",
  "/js/views/pe.js", "/js/views/mouvements.js",
  "/js/views/frais.js",
  "/js/components/chart.js",
  "/data/data.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first — comme OrTopos/OrLog
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

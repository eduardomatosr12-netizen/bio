/* ================================================================
   Axiumlink — Service Worker (PWA)
   ----------------------------------------------------------------
   Estratégia:
   - Navegações e config.js → rede primeiro (dados sempre frescos).
   - Assets estáticos (CSS/JS/ícones) → cache primeiro, atualiza em background.
   - Offline: serve o cache quando a rede falhar.
   ================================================================ */
const CACHE_NAME = 'axiumlink-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './config.js',
  './firebase-config.js',
  './js/engine.js',
  './js/icons.js',
  './js/firebase.js',
  './manifest.webmanifest',
  './favicon-32x32.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Navegação → rede primeiro, fallback para cache (offline) */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  /* config.js → rede primeiro (nunca servir config velho sem motivo) */
  if (url.pathname.endsWith('config.js')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response('', { status: 504 })))
    );
    return;
  }

  /* Assets estáticos → cache primeiro com atualização em background */
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
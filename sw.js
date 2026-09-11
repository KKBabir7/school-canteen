/**
 * Lightweight service worker — caches shell assets for offline-ish PWA demo.
 */
const CACHE = 'schoolfood-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/css/dashboard.css',
  './assets/css/components.css',
  './assets/css/forms.css',
  './assets/css/responsive.css',
  './assets/css/rtl.css',
  './assets/js/config.js',
  './assets/js/storage.js',
  './assets/js/utils.js',
  './assets/js/translations.js',
  './assets/js/mock-data.js',
  './assets/js/app.js',
  './assets/images/logo/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

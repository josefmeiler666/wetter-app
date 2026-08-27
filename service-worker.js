const CACHE_NAME = 'kempten-wetter-shell-v2';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Only cache the app shell. Weather data from api.open-meteo.com always
// goes to the network so forecasts stay current and never get stuck stale.
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (url.hostname === 'api.open-meteo.com') {
    return; // never intercept — always live
  }

  const isShellFile = SHELL_FILES.some(function(f) {
    return url.pathname.endsWith(f.replace('./', '/'));
  });

  if (isShellFile && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request);
      })
    );
  }
});

/*
  Glasscast Command Center — Service Worker
  Caches all screen assets for offline resilience.
  Strategy: Network-first with cache fallback.
  - When online: fetches fresh, updates cache
  - When offline: serves from cache seamlessly
*/
var CACHE_NAME = 'glasscast-cc-v2';
var ASSETS = [
  '/screen-1-daily.html',
  '/screen-2-brand-v11.html',
  '/screen-3-network.html',
  '/control-panel.html'
];

// Install — pre-cache all screens
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Got a good network response — cache it
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — serve from cache
      return caches.match(e.request);
    })
  );
});

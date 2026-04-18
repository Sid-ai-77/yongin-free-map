const CACHE_NAME = 'gbb-v2';
const STATIC_ASSETS = [
  '/yongin-free-map/',
  '/yongin-free-map/index.html',
  '/yongin-free-map/icon-192.png',
  '/yongin-free-map/icon-512.png',
  '/yongin-free-map/marker-icon.png',
  '/yongin-free-map/marker-icon-2x.png',
  '/yongin-free-map/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: network first, cache fallback
  if (url.hostname.includes('rss2json') || url.hostname.includes('news.google')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

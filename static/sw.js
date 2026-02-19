// Özcük Service Worker for PWA support
const CACHE_NAME = 'ozcuk-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// CDN base for word data
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache word data from CDN
  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/ozcuk-data')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // For app pages, try network first
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation requests
          if (response.ok && event.request.mode === 'navigate') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Default: just fetch
  event.respondWith(fetch(event.request));
});


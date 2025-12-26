// Nail Art Match - Service Worker
// Progressive Web App offline support

const CACHE_VERSION = 'v2';
const CACHE_NAME = `nail-art-match-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `nail-art-static-${CACHE_VERSION}`;

// Core files that should always be cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/instructions.html',
  '/favicon.svg',
  '/manifest.json'
];

// Additional assets to cache (will be added during runtime)
const RUNTIME_CACHE_URLS = new Set();

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old version caches
              return !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - cache-first with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except same-origin assets)
  if (url.origin !== location.origin) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving page from cache:', request.url);
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
              // Offline - return cached index.html
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images, etc.)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        return fetch(request)
          .then((response) => {
            // Don't cache invalid responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache everything from our origin
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
                console.log('[Service Worker] Cached:', request.url);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed (offline?):', error);

            // Try to return cached version
            return caches.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  console.log('[Service Worker] Returning cached fallback:', request.url);
                  return cachedResponse;
                }

                // For images, return a placeholder or throw
                if (request.destination === 'image') {
                  console.log('[Service Worker] Image not cached, offline');
                  // Could return a placeholder image here
                }

                throw error;
              });
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Nail Art Match - Service Worker
// Progressive Web App offline support

const CACHE_VERSION = 'v8';
const CACHE_NAME = `nail-art-match-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `nail-art-static-${CACHE_VERSION}`;

// Core files that should always be cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/instructions.html',
  '/favicon.svg',
  '/manifest.json',
  // Images
  '/hand.png',
  '/bakground.png',
  '/pink-sparkle-bg.jpg',
  '/nails_mask.svg',
  '/mask_nails.png',
  // Stickers - all nail art stickers
  '/stickers/break-up.png',
  '/stickers/cherry.png',
  '/stickers/diamond.png',
  '/stickers/rainbow.png',
  '/stickers/rose.png',
  '/stickers/shooting-star.png',
  '/stickers/sunflower.png'
];

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
        console.log('[Service Worker] Installed successfully, skipping waiting');
        // Immediately activate this version
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
        // Delete all caches that don't match current version
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] All old caches deleted');
        console.log('[Service Worker] Taking control of all clients');
        // Take control of all pages immediately
        return self.clients.claim();
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
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
  // Use network-first for JS/CSS to always get latest version
  const isAppAsset = request.url.includes('/assets/') ||
                     request.url.includes('.js') ||
                     request.url.includes('.css');

  if (isAppAsset) {
    // Network-first strategy for app assets (JS/CSS)
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              console.log('[Service Worker] Updated cache:', request.url);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving from cache (offline):', request.url);
                return cachedResponse;
              }
              throw new Error('Asset not cached and offline');
            });
        })
    );
  } else {
    // Cache-first for images and other static content
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
                console.log('[Service Worker] Cached:', request.url);
              });

              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              return caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                  console.log('[Service Worker] Returning cached fallback:', request.url);
                  return cachedResponse;
                }
                throw error;
              });
            });
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

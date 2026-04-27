const CACHE_NAME = 'nightfall-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event: Network-first approach for API calls, Cache-first for local assets
self.addEventListener('fetch', event => {
    // Ignore API calls to Gemini (we want these to always try the network)
    if (event.request.url.includes('generativelanguage.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Return cached version if found, otherwise fetch from network
            return cachedResponse || fetch(event.request).then(response => {
                // Optionally cache new successful GET requests (like external fonts/icons)
                if (event.request.method === 'GET' && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            });
        }).catch(() => {
            // Fallback for offline if caching fails completely
            return caches.match('/');
        })
    );
});

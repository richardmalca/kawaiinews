// KawaiiNews Service Worker
const CACHE_NAME = 'kawaiinews-v1';
const PRECACHE_ASSETS = [
    '/',
    '/favicon.ico',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/apple-touch-icon.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch(() => {
                // Ignore failure of any individual non-critical precache asset
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-first strategy with cache fallback for navigation and static assets
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Skip handling API/internal requests that shouldn't be cached
    if (
        url.pathname.startsWith('/livewire') ||
        url.pathname.startsWith('/telescope') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.includes('/api/')
    ) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                const rootCached = await caches.match('/');
                if (rootCached) return rootCached;
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            })
        );
        return;
    }

    if (
        event.request.destination === 'image' ||
        event.request.destination === 'style' ||
        event.request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise.then((res) => res || new Response(null, { status: 404 }));
            })
        );
    }
});

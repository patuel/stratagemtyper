const cacheName = 'cache-v1';
const precacheResources = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/assets/css/code.css',
    '/assets/css/stratagems.css',
    '/assets/images/stratagems.png',
    '/assets/images/up.webp',
    '/data.js',
    '/typer.js',
    '/main.js'
];

self.addEventListener('install', (event) => {
    console.log('Service worker install event!');
    event.waitUntil(
        caches.open(cacheName).then(
            (cache) => cache.addAll(precacheResources)));
});

self.addEventListener('activate', (event) => {
    console.log('Service worker activate event!');
});

self.addEventListener('fetch', (event) => {
    console.log('Fetch intercepted for:', event.request.url);
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        }),
    );
});

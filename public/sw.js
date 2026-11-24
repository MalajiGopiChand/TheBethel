// Only cache the application shell and same-origin static assets. Firebase,
// notification APIs and user data must always use their own network behavior.
const CACHE_NAME = 'bethel-ams-v5';
const APP_CACHE_PREFIX = 'bethel-ams-';
const SHELL = ['/index.html', '/manifest.json', '/image.png', '/admin-landscape.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  // Keep the old shell and its assets together until every existing tab closes.
  // An explicit update request may activate a waiting worker.
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(APP_CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch {
        return (await caches.match('/index.html')) || new Response('You are offline. Reconnect and try again.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }
  const isAsset = url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname);
  if (!isAsset) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    // Never cache an SPA fallback served as HTML for a missing JS chunk.
    if (response.ok && !response.headers.get('content-type')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});

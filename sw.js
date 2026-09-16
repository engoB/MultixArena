const CACHE = 'multiarena-v4.5.4';
const SHELL = ['./', './index.html', './atelier.html', './manifest.webmanifest', './version.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
    .then(async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => client.postMessage({ type: 'APP_UPDATED', version: '4.5.4' }));
    }));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      const target = url.pathname.endsWith('/atelier.html') ? './atelier.html' : './index.html';
      if (response.ok) void caches.open(CACHE).then(cache => cache.put(target, response.clone()));
      return response;
    }).catch(() => caches.match(url.pathname.endsWith('/atelier.html') ? './atelier.html' : './index.html')));
    return;
  }

  if (url.origin === self.location.origin && (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js'))) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const hit = await cache.match(request);
      const fresh = fetch(request).then(response => {
        if (response.ok) void cache.put(request, response.clone());
        return response;
      });
      if (hit) { event.waitUntil(fresh.catch(() => undefined)); return hit; }
      return fresh;
    }));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

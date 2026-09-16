/* Multi Arena — service worker.
   Deux caches séparés : la coquille de l'app, et les médias.
   Les médias sont volumineux : on les met en cache à l'usage, avec un plafond,
   pour ne pas saturer le stockage du téléphone. */
const SHELL_CACHE = 'multiarena-shell-4.6.0';
const MEDIA_CACHE = 'multiarena-media-4.6.0';
const MEDIA_MAX = 90;            // nombre maximum de fichiers médias gardés
const SHELL = ['./', './index.html', './atelier.html', './manifest.webmanifest', './version.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png'];

const isMedia = url => /\/assets\//.test(url.pathname) || /\.(png|jpe?g|webp|m4a|mp3|ogg|wav)$/i.test(url.pathname);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE)
    .then(cache => Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key !== SHELL_CACHE && key !== MEDIA_CACHE)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim())
    .then(async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => client.postMessage({ type: 'APP_UPDATED', version: '4.6.0' }));
    }));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

/** Garde le cache média sous son plafond, en retirant les plus anciennes entrées. */
async function trimMedia(cache) {
  const keys = await cache.keys();
  if (keys.length <= MEDIA_MAX) return;
  for (const key of keys.slice(0, keys.length - MEDIA_MAX)) await cache.delete(key);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // la page elle-même : réseau d'abord, cache en secours
  if (request.mode === 'navigate') {
    const target = url.pathname.endsWith('/atelier.html') ? './atelier.html' : './index.html';
    event.respondWith(fetch(request, { cache: 'no-store' })
      .then(response => {
        if (response.ok) void caches.open(SHELL_CACHE).then(cache => cache.put(target, response.clone()));
        return response;
      })
      .catch(() => caches.match(target)));
    return;
  }

  // version et service worker : jamais de cache
  if (url.origin === self.location.origin && /\/(version\.json|sw\.js)$/.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // l'habillage doit pouvoir changer : réseau d'abord, cache en secours
  if (url.origin === self.location.origin && /\/pack\.json$/.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' })
      .then(response => {
        if (response.ok) void caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request)));
    return;
  }

  // images et sons : cache d'abord, plafonné
  if (url.origin === self.location.origin && isMedia(url)) {
    event.respondWith(caches.open(MEDIA_CACHE).then(async cache => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) { void cache.put(request, response.clone()).then(() => trimMedia(cache)); }
      return response;
    }));
    return;
  }

  // reste du même domaine et polices : cache d'abord, rafraîchi en tâche de fond
  if (url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    event.respondWith(caches.open(SHELL_CACHE).then(async cache => {
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

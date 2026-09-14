const CACHE = 'multiarena-r2';
const SHELL = ['./', './index.html', './atelier.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(r.url)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
      const net = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', './atelier.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
});

const CACHE = 'multiarena-v4.2.1';
const SHELL = ['./', './index.html', './atelier.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(url => c.add(new Request(url, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
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
    e.respondWith(fetch(r, { cache: 'no-store' }).then(res => {
      const copy = res.clone();
      const target = new URL(r.url).pathname.endsWith('/atelier.html') ? './atelier.html' : './index.html';
      caches.open(CACHE).then(c => c.put(target, copy));
      return res;
    }).catch(() => caches.match(new URL(r.url).pathname.endsWith('/atelier.html') ? './atelier.html' : './index.html')));
    return;
  }
  if (new URL(r.url).origin === self.location.origin) {
    e.respondWith(fetch(r, { cache: 'no-store' }).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone()));
      return res;
    }).catch(() => caches.match(r)));
    return;
  }
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});

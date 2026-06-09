const CACHE_VER = 'sgdiv-v6';
const STATIC_CACHE = `${CACHE_VER}-static`;
const DATA_CACHE = `${CACHE_VER}-data`;

const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('sgdiv-') && !k.startsWith(CACHE_VER))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('yahoo.com') || url.hostname.includes('query1') || url.hostname.includes('query2')) {
    e.respondWith(
      fetch(e.request.clone())
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(DATA_CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});

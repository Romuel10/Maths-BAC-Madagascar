const CACHE_NAME = 'maths-bac-madagascar-v4-5-0';

function scoped(path = '') {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      scoped('./'),
      scoped('./index.html'),
      scoped('./manifest.json'),
      scoped('./icon-192.png'),
      scoped('./icon-512.png')
    ])).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('maths-bac-madagascar-') && key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Réseau d'abord pour le code et les pages : une mise à jour de l'application
// ne doit jamais rester bloquée derrière une ancienne copie mise en cache.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const destination = event.request.destination;
  const isCodeOrPage = event.request.mode === 'navigate' || ['script', 'style', 'worker'].includes(destination);

  if (isCodeOrPage) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(scoped('./index.html'))))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

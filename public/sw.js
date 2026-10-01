const CACHE_NAME = 'maths-bac-madagascar-v7-0-0-r2';
const CORE_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './asset-manifest.json'];

function scoped(path = '') {
  return new URL(path, self.registration.scope).toString();
}

async function precacheApplication() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch(scoped('./index.html'), { cache: 'reload' });
  if (!indexResponse.ok) throw new Error('Index indisponible pendant l’installation hors ligne.');
  await Promise.all([
    cache.put(scoped('./index.html'), indexResponse.clone()),
    cache.put(scoped('./'), indexResponse.clone())
  ]);

  const urls = new Set(CORE_FILES.map(scoped));
  let entryAsset = '';
  try {
    const manifestResponse = await fetch(scoped('./asset-manifest.json'), { cache: 'reload' });
    if (manifestResponse.ok) {
      await cache.put(scoped('./asset-manifest.json'), manifestResponse.clone());
      const buildManifest = await manifestResponse.json();
      const visitedEntries = new Set();
      const addManifestEntry = key => {
        if (!key || visitedEntries.has(key)) return;
        const entry = buildManifest[key];
        if (!entry || typeof entry !== 'object') return;
        visitedEntries.add(key);
        if (typeof entry.file === 'string') urls.add(scoped(entry.file));
        if (Array.isArray(entry.css)) entry.css.forEach(file => urls.add(scoped(file)));
        // KaTeX publie les mêmes polices dans trois formats : WOFF2 suffit aux
        // navigateurs modernes et évite de télécharger aussi WOFF et TTF.
        if (Array.isArray(entry.assets)) entry.assets.filter(file => file.endsWith('.woff2')).forEach(file => urls.add(scoped(file)));
        if (Array.isArray(entry.imports)) entry.imports.forEach(addManifestEntry);
      };
      const entryKey = Object.keys(buildManifest).find(key => buildManifest[key]?.isEntry);
      // Précharger toutes les entrées Vite garantit que les outils chargés avec
      // React.lazy restent disponibles même si l'appareil passe hors connexion
      // avant leur première ouverture.
      Object.keys(buildManifest).forEach(addManifestEntry);
      entryAsset = entryKey && typeof buildManifest[entryKey]?.file === 'string' ? buildManifest[entryKey].file : '';
      if (entryAsset) {
        const entryResponse = await fetch(scoped(entryAsset), { cache: 'reload' });
        if (entryResponse.ok) {
          const entryCode = await entryResponse.text();
          for (const workerFile of entryCode.match(/analysis\.worker-[A-Za-z0-9_-]+\.js/g) || []) {
            urls.add(scoped(`./assets/${workerFile}`));
          }
        }
      }
    }
  } catch {
    // L’index reste disponible même si l’hébergeur ne publie pas le manifeste Vite.
  }

  urls.delete(scoped('./'));
  urls.delete(scoped('./index.html'));
  await Promise.allSettled([...urls].map(url => cache.add(url)));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheApplication());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('maths-bac-madagascar-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, navigation = false) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (navigation) {
      const fallback = await cache.match(scoped('./index.html'));
      if (fallback) return fallback;
    }
    return new Response('Ressource indisponible hors connexion.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const navigation = event.request.mode === 'navigate';
  const code = ['script', 'style', 'worker'].includes(event.request.destination);
  if (navigation || code) {
    event.respondWith(networkFirst(event.request, navigation));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || networkFirst(event.request))
  );
});

const CACHE_NAME = 'maths-bac-madagascar-v1-0-2';
const CORE_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './asset-manifest.json'];

function scoped(path = '') {
  return new URL(path, self.registration.scope).toString();
}

async function fetchRequired(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error(`Ressource hors ligne indisponible (${response.status}) : ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function precacheApplication() {
  const stagingName = `${CACHE_NAME}-install`;
  await caches.delete(stagingName);
  const cache = await caches.open(stagingName);
  try {
    const indexResponse = await fetchRequired(scoped('./index.html'));
    const manifestResponse = await fetchRequired(scoped('./asset-manifest.json'));
    const buildManifest = await manifestResponse.clone().json();
    const urls = new Set(CORE_FILES.map(scoped));
    const entryKey = Object.keys(buildManifest).find(key => buildManifest[key]?.isEntry);
    if (!entryKey) throw new Error('Manifeste incomplet : entrée de l’application absente.');
    for (const entry of Object.values(buildManifest)) {
      if (!entry || typeof entry !== 'object') continue;
      if (typeof entry.file === 'string') urls.add(scoped(entry.file));
      if (Array.isArray(entry.css)) entry.css.forEach(file => urls.add(scoped(file)));
      if (Array.isArray(entry.assets)) entry.assets.filter(file => file.endsWith('.woff2')).forEach(file => urls.add(scoped(file)));
    }
    const entryResponse = await fetchRequired(scoped(buildManifest[entryKey].file));
    const entryCode = await entryResponse.clone().text();
    for (const workerFile of entryCode.match(/analysis\.worker-[A-Za-z0-9_-]+\.js/g) || []) urls.add(scoped(`./assets/${workerFile}`));
    await cache.put(scoped(buildManifest[entryKey].file), entryResponse);
    await cache.put(scoped('./asset-manifest.json'), manifestResponse);
    urls.delete(scoped('./')); urls.delete(scoped('./index.html')); urls.delete(scoped('./asset-manifest.json'));
    // A failed module rejects installation. The previous complete version remains active.
    await Promise.all([...urls].map(async url => cache.put(url, await fetchRequired(url))));
    await cache.put(scoped('./index.html'), indexResponse.clone());
    await cache.put(scoped('./'), indexResponse);
    const complete = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    await Promise.all(requests.map(async request => complete.put(request, await cache.match(request))));
  } finally {
    await caches.delete(stagingName);
  }
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
    if (response.ok) return response;
    const cached = await cache.match(request);
    return cached || response;
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

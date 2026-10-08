const NAME='maths-bac-v2-BUILD_VERSION';
const ASSETS=/* injected at build */ 'BUILD_ASSETS';
const urls=Array.isArray(ASSETS)?ASSETS.map(p=>new URL(p,self.registration.scope).href):[];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(NAME);
 try{
  let index=0;
  const downloads=await Promise.allSettled(Array.from({length:4},async()=>{while(index<urls.length){const url=urls[index++];let response;for(let attempt=0;attempt<3;attempt++){try{response=await fetch(url,{cache:'reload'});if(response.ok)break;}catch{} await new Promise(r=>setTimeout(r,200*(attempt+1)));}if(!response?.ok)throw Error('Téléchargement incomplet');await cache.put(url,response);}}));
  if(downloads.some(result=>result.status==='rejected'))throw Error('Téléchargement incomplet');
  await self.skipWaiting();
 }catch(error){await caches.delete(NAME);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==NAME&&(key.startsWith('maths-bac-v2-')||key.startsWith('maths-bac-madagascar-')))await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(NAME),url=new URL(event.request.url);url.search='';
  const cached=await cache.match(url.href);if(cached)return cached;
  if(event.request.mode==='navigate'){const entry=await cache.match(new URL('index.html',self.registration.scope).href);if(entry)return entry;}
  try{return await fetch(event.request);}catch{return new Response('Ressource indisponible hors connexion',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
 })());
});

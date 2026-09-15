const CACHE_NAME='elegance-move-pwa-v4';
const APP_SHELL=['/','/manifest.webmanifest','/pwa-icon.png','/pwa-icon-maskable.png','/pwa-runtime.js','/auth.js','/password-recovery.js','/users-ui.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request);
        const cache=await caches.open(CACHE_NAME);
        cache.put('/',fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached){
      event.waitUntil(fetch(request).then(async fresh=>{
        const cache=await caches.open(CACHE_NAME);
        await cache.put(request,fresh.clone());
      }).catch(()=>{}));
      return cached;
    }
    try{
      const fresh=await fetch(request);
      if(fresh.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch{
      return Response.error();
    }
  })());
});

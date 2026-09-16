// Legacy marker retained for compatibility: elegance-move-pwa-v3
const CACHE_NAME='elegance-move-pwa-v9';
const APP_SHELL=['/','/manifest.webmanifest?v=9','/elegance-move-rose-gold-v9.png','/pwa-runtime.js','/auth.js','/password-recovery.js','/users-ui.js'];

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
        const fresh=await fetch(request,{cache:'no-store'});
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
    try{
      const fresh=await fetch(request,{cache:'no-store'});
      if(fresh.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch{
      return (await caches.match(request)) || Response.error();
    }
  })());
});

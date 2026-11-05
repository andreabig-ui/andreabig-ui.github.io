const CACHE='osservazioni-sm-v7-routes';
const ASSETS=['./','index.html','capovolta.html','manifest.webmanifest','icon.svg','ukemi.html','ukemi-attivazione.html','ukemi.css','ukemi-core.js','ukemi.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('osservazioni-sm-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(async()=>{
    // Una query di fase usa lo stesso documento, senza cambiare pagina di attività.
    const cache=await caches.open(CACHE);
    const exact=await cache.match(event.request);
    if(exact)return exact;
    const samePage=await cache.match(url.origin+url.pathname);
    if(samePage)return samePage;
    // Mai sostituire Ukemi o altre pagine con l'indice di palla prigioniera.
    if(event.request.mode==='navigate')return new Response('Questa pagina non è disponibile offline. Riprova con la connessione attiva.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    return Response.error();
  }));
});

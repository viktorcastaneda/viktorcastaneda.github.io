/* sw-entregas.js — Service Worker exclusivo de entregas.html
   Cachea el "app shell" completo (HTML/CSS inline/JS/logo/fuentes) para que
   la página abra sin conexión aunque el navegador la haya cerrado o el
   teléfono se haya reiniciado en pleno modo avión. Los datos de contratos
   NO pasan por aquí — esos ya viven en localStorage (ver entregas.html).

   Para forzar que los repartidores reciban una actualización, sube este
   número en el próximo deploy. */
var CACHE_VERSION = "casvel-entregas-v1";

var APP_SHELL = [
  "./entregas.html",
  "./shared.js",
  "./logo-b64.js",
  "./manifest-entregas.json",
  "./apple-touch-icon.png",
  "./eventos_casvel_favicon.ico"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_VERSION; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);
  // Firebase (RTDB/Auth) nunca se cachea — siempre debe ir a la red en vivo,
  // o fallar limpiamente si no hay conexión (la app ya maneja ese error).
  if(url.hostname.indexOf("firebaseio.com")!==-1 || url.hostname.indexOf("firebaseapp.com")!==-1){
    return;
  }

  // Cache-first con actualización en segundo plano: responde de inmediato
  // con lo cacheado (rápido y funciona sin red) y refresca el caché desde
  // la red para la próxima vez, si hay conexión.
  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        caches.open(CACHE_VERSION).then(function(cache){
          try{ cache.put(req, res.clone()); }catch(e){}
        });
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});

/* sw-app.js — Service Worker de toda la app CASVEL (Contratos, Reportes,
   Cotizaciones, Catálogo). Cachea el "app shell" para que abra sin conexión
   aunque el navegador la haya cerrado o el teléfono se haya reiniciado.

   NO cubre entregas.html a propósito: esa página tiene su propia mini-app
   instalable independiente (sw-entregas.js, manifest-entregas.json), con su
   propio ícono, pensada solo para repartidores. Como su registro usa un
   scope más específico ('./entregas.html'), sigue teniendo prioridad ahí
   aunque este Service Worker cubra todo el sitio ('./').

   Para forzar que los usuarios reciban una actualización, sube este número
   en el próximo deploy. */
var CACHE_VERSION = "casvel-app-v1";

var APP_SHELL = [
  "./mobile.html",
  "./index.html",
  "./reporte-mobile.html",
  "./inventario.html",
  "./shared.js",
  "./logo-b64.js",
  "./manifest-app.json",
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
  // o fallar limpiamente si no hay conexión.
  if(url.hostname.indexOf("firebaseio.com")!==-1 || url.hostname.indexOf("firebaseapp.com")!==-1){
    return;
  }

  // Cache-first con actualización en segundo plano: responde de inmediato
  // con lo cacheado (rápido y funciona sin red) y refresca el caché desde
  // la red para la próxima vez, si hay conexión. Así, docx-b64.js /
  // fairy-logo-b64.js (que no se precachean, solo se cargan bajo demanda)
  // quedan disponibles offline en cuanto se usan una vez.
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

/* VERSION: 2026-09-29 · entregas v2.1 (mapa de ruta + sync en línea) */
/* sw-entregas.js — Service Worker exclusivo de entregas.html
   Cachea el "app shell" completo (HTML/CSS inline/JS/logo/fuentes) para que
   la página abra sin conexión aunque el navegador la haya cerrado o el
   teléfono se haya reiniciado en pleno modo avión. Los datos de contratos
   NO pasan por aquí — esos ya viven en localStorage (ver entregas.html).

   Para forzar que los repartidores reciban una actualización, sube este
   número en el próximo deploy. */
// MODIFIED: subido a v3 — el deploy que agregó la sincronización en línea de
// orden/entregado/recolectado (entregaKey/saveEntregaMeta/onEntregasChange en
// shared.js) se subió a producción SOLO como entregas.html, sin shared.js ni
// este archivo, así que los dispositivos con el Service Worker v1 (cache-first
// para todo) siguieron sirviendo el shared.js viejo cacheado junto al
// entregas.html nuevo — "ReferenceError: entregaKey is not defined" al
// renderizar, que se veía como "al cambiar de fecha no muestra contratos".
// Subir este número fuerza a esos dispositivos a descartar ese caché viejo.
var CACHE_VERSION = "casvel-entregas-v4";

var APP_SHELL = [
  "./entregas.html",
  "./shared.js",
  "./logo-b64.js",
  "./manifest-entregas.json",
  "./apple-touch-icon.png",
  "./eventos_casvel_favicon.ico"
];

// ADDED: el HTML/JS de la app cambia con cada deploy; los assets de abajo
// (logo, icono, manifest) casi nunca cambian. Servir el app shell
// network-first evita depender de acordarse de subir CACHE_VERSION a mano
// (la causa exacta del bug de arriba) — un deploy nuevo se aplica de
// inmediato en cuanto haya conexión, y solo cae a caché si falla la red.
var NETWORK_FIRST = ["/entregas.html", "/shared.js"];

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

  // ADDED: network-first para entregas.html/shared.js — ver nota de
  // NETWORK_FIRST arriba. Si falla la red (sin conexión), cae a la última
  // copia cacheada, así que el offline-first sigue funcionando igual.
  // MODIFIED: {cache:"reload"} — un fetch() normal desde dentro del Service
  // Worker puede seguir sirviéndose de la caché HTTP del navegador (una capa
  // aparte de este Cache Storage), devolviendo la misma versión vieja aunque
  // aquí ya sea "network-first". "reload" fuerza una ida real a la red.
  var isAppShellCode = NETWORK_FIRST.some(function(suffix){ return url.pathname.indexOf(suffix) !== -1; });
  if(isAppShellCode){
    event.respondWith(
      fetch(req, {cache:"reload"}).then(function(res){
        caches.open(CACHE_VERSION).then(function(cache){
          try{ cache.put(req, res.clone()); }catch(e){}
        });
        return res;
      }).catch(function(){ return caches.match(req); })
    );
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

/* shared.js — CASVEL: datos, utilidades, renderizador A4, storage Firebase/local */
"use strict";

var LOGO_B64 = "";
var DOCX_B64 = "";
// ADDED (perf): LOGO_B64/DOCX_B64 ya no viven inline aquí — eran ~610KB de las
// ~656KB de este archivo, y cualquier edición a shared.js forzaba a re-descargar
// ese bloque completo en cada visita aunque el logo/plantilla no hubieran
// cambiado. Ahora viven en logo-b64.js / docx-b64.js (archivos aparte,
// cacheables por separado y que casi nunca cambian) y se cargan bajo demanda
// con ensureLogoLoaded() / ensureDocxLoaded().
var _logoLoadPromise = null;
var _docxLoadPromise = null;
function _loadScriptOnce(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement("script");
    s.src=src;
    s.onload=function(){ resolve(); };
    s.onerror=function(){ reject(new Error("No se pudo cargar "+src)); };
    document.head.appendChild(s);
  });
}
function ensureLogoLoaded(){
  if(LOGO_B64) return Promise.resolve(LOGO_B64);
  if(!_logoLoadPromise) _logoLoadPromise=_loadScriptOnce("logo-b64.js").then(function(){ return LOGO_B64; });
  return _logoLoadPromise;
}
function ensureDocxLoaded(){
  if(DOCX_B64) return Promise.resolve(DOCX_B64);
  if(!_docxLoadPromise) _docxLoadPromise=_loadScriptOnce("docx-b64.js").then(function(){ return DOCX_B64; });
  return _docxLoadPromise;
}

// ADDED: logo de Fairy Decoraciones (negocio hermano de decoración) — se agrega
// a las cotizaciones y al contrato formal PDF solo cuando el usuario incluyó
// un artículo adicional de Fairy Decoraciones. Igual que LOGO_B64/DOCX_B64,
// vive aparte (fairy-logo-b64.js) y solo se descarga cuando realmente se usa.
var FAIRY_LOGO_B64 = "";
var _fairyLogoLoadPromise = null;
function ensureFairyLogoLoaded(){
  if(FAIRY_LOGO_B64) return Promise.resolve(FAIRY_LOGO_B64);
  if(!_fairyLogoLoadPromise) _fairyLogoLoadPromise=_loadScriptOnce("fairy-logo-b64.js").then(function(){ return FAIRY_LOGO_B64; });
  return _fairyLogoLoadPromise;
}

/* ═══════════════════════════════════════════════════════════════════════
   ADDED: PWA genérica — registro de Service Worker + banner de instalación,
   reutilizable por cualquier página que se ofrezca como app instalable.
   entregas.html mantiene su PROPIA copia independiente a propósito (es una
   mini-app aparte, con su propio ícono e instalación, para repartidores).
   Esta versión la usan mobile.html / index.html para el resto de la app.
═══════════════════════════════════════════════════════════════════════ */
var _pwaDeferredPrompt = null;
function pwaIsStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
function pwaIsIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function pwaRegisterSW(swPath, scope){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(swPath, scope?{scope:scope}:undefined).catch(function(e){
    console.warn("No se pudo registrar el Service Worker "+swPath, e);
  });
}
function pwaCanPromptInstall(){ return !!_pwaDeferredPrompt; }
function pwaDoInstall(onDone){
  if(!_pwaDeferredPrompt) return;
  _pwaDeferredPrompt.prompt();
  _pwaDeferredPrompt.userChoice.finally(function(){
    _pwaDeferredPrompt=null;
    if(onDone) onDone();
  });
}
window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault();
  _pwaDeferredPrompt=e;
  if(typeof onPwaInstallAvailable==="function") onPwaInstallAvailable();
});
window.addEventListener("appinstalled", function(){
  _pwaDeferredPrompt=null;
  if(typeof onPwaInstalled==="function") onPwaInstalled();
});


/* ═══════════════════════════════════════════════════════════════════════
   ADDED: Catálogo dinámico — reemplaza constantes hardcoded ITEMS, ITEM_ABBREV,
   DAILY_INVENTORY, ITEM_RESOURCES, RESOURCE_NAMES.

   COMPATIBILIDAD CON CONTRATOS PASADOS:
   Los contratos almacenan items[] por índice posicional (0–12).
   El catálogo preserva ese orden exacto en los primeros 13 artículos (DEFAULT_CATALOG).
   Artículos nuevos se añaden al final. Contratos viejos se leen siempre correctamente
   porque su índice sigue apuntando al mismo artículo del catálogo.

   ESTRUCTURA del catálogo:
   {
     items: [{ id, desc, abbrev, price, pq, pa, resources:[{key,qty}] }],
     resources: { key: { name, total } }   ← pool de inventario físico
   }
   - id: string único (p.ej. "item_0", "item_new_1718...")
   - pq/pa: IDs bookmark OOXML para plantilla DOCX (heredados del hardcode original)
   - resources: array de {key, qty} — recursos que consume 1 unidad de este artículo
   - resources pool: clave → {name, total} (cantidad total disponible por día)
═══════════════════════════════════════════════════════════════════════ */

// ADDED: Catálogo por defecto — refleja exactamente los 13 artículos hardcoded originales
// (orden preservado para compatibilidad con contratos existentes)
var DEFAULT_CATALOG = {
  items: [
    {id:"item_0", desc:"Mantel rectangular color:",    abbrev:"Mantel rect",        price:40,   pq:"603E3063",pa:"5A979215", resources:[{key:"mantel_rect",qty:1}]},
    {id:"item_1", desc:"Mantel con camino, color:",    abbrev:"Mantel camino",      price:65,   pq:"2E8767B1",pa:"26F86CE7", resources:[{key:"mantel_camino",qty:1}]},
    {id:"item_2", desc:"Sillas negras metálicas",      abbrev:"Sillas met",         price:15,   pq:"442668F0",pa:"2E32C510", resources:[{key:"sillas_negras",qty:1}]},
    {id:"item_3", desc:"Mesa rectangular 1.80 mts",    abbrev:"Mesa 1.80",          price:60,   pq:"2CE2F57E",pa:"4221F47C", resources:[{key:"mesa_180",qty:1}]},
    {id:"item_4", desc:"Mesa rectangular infantil 1.20 mts", abbrev:"Mesa inf 1.20",price:50,   pq:"1B3AD2DC",pa:"3F4270BC", resources:[{key:"mesa_inf",qty:1}]},
    {id:"item_5", desc:"Juego de Mesa y 8 Sillas Tiffany infantil", abbrev:"Tiffany inf", price:180, pq:"636EF224",pa:"3034C0C0", resources:[{key:"mesa_inf",qty:1},{key:"sillas_tiffany",qty:8}]},
    {id:"item_6", desc:"Juego de Mesa y 8 Sillas Colors infantil",  abbrev:"Colors inf",  price:180, pq:"71D8FA17",pa:"799013AE", resources:[{key:"mesa_inf",qty:1},{key:"sillas_colors",qty:8}]},
    {id:"item_7", desc:"Juego de Mesa y 8 Sillas metálicas",        abbrev:"Mesas met",   price:130, pq:"72278F03",pa:"75A931AA", resources:[{key:"mesa_180",qty:1},{key:"sillas_negras",qty:8}]},
    {id:"item_8", desc:"Brinca Brinca para bebes",                  abbrev:"BB bebés",    price:350, pq:"59149711",pa:"0A0F89D2", resources:[{key:"bb_bebes",qty:1}]},
    {id:"item_9", desc:"Brinca Brinca Castillo Colors de 3x4 mts",  abbrev:"BB Castillo Col", price:450, pq:"31C0F202",pa:"6F2C1098", resources:[{key:"bb_castillo_colors",qty:1}]},
    {id:"item_10",desc:"Brinca Brinca Castillo Caramelo de 4x4 mts",abbrev:"BB Caram",    price:500, pq:"60078EC9",pa:"48CB43A9", resources:[{key:"bb_caramelo",qty:1}]},
    {id:"item_11",desc:"Brinca Brinca Resbaladilla Colors 4x5 mts", abbrev:"BB Resbaladilla", price:550, pq:"154AF4FB",pa:"0CE938FA", resources:[{key:"bb_resbaladilla",qty:1}]},
    {id:"item_12",desc:"Area Infantil",                             abbrev:"Área Inf",    price:1200,pq:"6E84C2CA",pa:"6A98D161", resources:[{key:"area_infantil",qty:1}]}
  ],
  resources: {
    mantel_rect:        {name:"Manteles rect.",          total:10},
    mantel_camino:      {name:"Manteles camino",         total:10},
    sillas_negras:      {name:"Sillas negras",           total:72},
    mesa_180:           {name:"Mesas 1.80",              total:10},
    mesa_inf:           {name:"Mesas inf.",              total:10},
    sillas_tiffany:     {name:"Sillas Tiffany inf.",     total:48},
    sillas_colors:      {name:"Sillas Colors inf.",      total:48},
    bb_bebes:           {name:"BB bebés",                total:2},
    bb_castillo_colors: {name:"BB Castillo Colors",      total:1},
    bb_caramelo:        {name:"BB Caramelo",             total:1},
    bb_resbaladilla:    {name:"BB Resbaladilla",         total:1},
    area_infantil:      {name:"Área infantil",           total:1}
  }
};

// ADDED: variables vivas — se populan desde el catálogo cargado
// Siguen siendo arrays/objetos para que index.html y mobile.html funcionen sin cambios
var ITEMS        = DEFAULT_CATALOG.items.slice();   // array de artículos activos
var ITEM_ABBREV  = ITEMS.map(function(it){return it.abbrev;});
var DAILY_INVENTORY = {};    // key → total (se reconstruye al cargar catálogo)
var ITEM_RESOURCES  = [];    // ITEMS[i] → [[key,qty],...] (formato legacy para checkInventory)
var RESOURCE_NAMES  = {};    // key → nombre legible

// ADDED: listeners para cambios en el catálogo (similar a _listeners de contratos)
var _catListeners = [];
var _catalogCache = null;    // catálogo cargado en memoria
var _fbCatRef     = null;    // ref Firebase para /casvel_catalog

// ADDED: reconstruye ITEMS, ITEM_ABBREV, DAILY_INVENTORY, ITEM_RESOURCES, RESOURCE_NAMES
// desde el objeto catálogo en memoria. Llamado cada vez que el catálogo cambia.
function _rebuildCatalogVars(cat){
  ITEMS       = cat.items.slice();
  ITEM_ABBREV = ITEMS.map(function(it){return it.abbrev;});
  DAILY_INVENTORY = {};
  RESOURCE_NAMES  = {};
  Object.keys(cat.resources).forEach(function(k){
    DAILY_INVENTORY[k] = cat.resources[k].total;
    RESOURCE_NAMES[k]  = cat.resources[k].name;
  });
  ITEM_RESOURCES = ITEMS.map(function(it){
    return (it.resources||[]).map(function(r){return [r.key, r.qty];});
  });
}

// ADDED: notifica listeners del catálogo
function _notifyCatListeners(){
  var snap = JSON.parse(JSON.stringify(_catalogCache));
  _catListeners.forEach(function(fn){ try{ fn(snap); }catch(e){} });
}

// ADDED: inicializa catálogo desde localStorage (primera vez)
function _initLocalCatalog(){
  if(_catalogCache !== null) return;
  try{
    var raw = localStorage.getItem("casvel_catalog");
    _catalogCache = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_CATALOG));
  } catch(e){
    _catalogCache = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
  }
  _rebuildCatalogVars(_catalogCache);
}

// ADDED: carga el catálogo (garantiza init) y devuelve copia
function loadCatalog(){
  if(!_fbMode) _initLocalCatalog();
  return _catalogCache ? JSON.parse(JSON.stringify(_catalogCache)) : JSON.parse(JSON.stringify(DEFAULT_CATALOG));
}

// ADDED: guarda el catálogo (local o Firebase)
function saveCatalog(cat){
  _catalogCache = JSON.parse(JSON.stringify(cat));
  _rebuildCatalogVars(_catalogCache);
  if(_fbMode && _fbCatRef){
    _fbCatRef.set(_catalogCache).catch(function(e){console.error("Firebase catalog write",e);});
  } else {
    localStorage.setItem("casvel_catalog", JSON.stringify(_catalogCache));
  }
  _notifyCatListeners();
}

// ADDED: registra listener para cambios en el catálogo
function onCatalogChange(fn){
  _catListeners.push(fn);
  if(_catalogCache !== null) try{ fn(JSON.parse(JSON.stringify(_catalogCache))); }catch(e){}
  return function(){ _catListeners = _catListeners.filter(function(x){return x!==fn;}); };
}

// ADDED: obtiene artículo por índice posicional (para lectura de contratos pasados)
// Si el índice existe en el catálogo activo lo devuelve; si no, devuelve stub básico
function getItemByIndex(i){
  if(ITEMS[i]) return ITEMS[i];
  // Fallback para contratos muy viejos con más índices que el catálogo actual
  return {id:"item_"+i, desc:"Artículo #"+i, abbrev:"Art."+i, price:0, pq:"", pa:"", resources:[]};
}

// ── Variables de compatibilidad (se mantienen como alias) ──────────
// ITEMS, ITEM_ABBREV, DAILY_INVENTORY, ITEM_RESOURCES, RESOURCE_NAMES
// se populan en _initLocalCatalog(), que se llama al final del archivo.

var TIME_OPTIONS=[
  {value:'',label:'-- Hora --'},
  {value:'06:00',label:'6:00 AM'},
  {value:'06:15',label:'6:15 AM'},
  {value:'06:30',label:'6:30 AM'},
  {value:'06:45',label:'6:45 AM'},
  {value:'07:00',label:'7:00 AM'},
  {value:'07:15',label:'7:15 AM'},
  {value:'07:30',label:'7:30 AM'},
  {value:'07:45',label:'7:45 AM'},
  {value:'08:00',label:'8:00 AM'},
  {value:'08:15',label:'8:15 AM'},
  {value:'08:30',label:'8:30 AM'},
  {value:'08:45',label:'8:45 AM'},
  {value:'09:00',label:'9:00 AM'},
  {value:'09:15',label:'9:15 AM'},
  {value:'09:30',label:'9:30 AM'},
  {value:'09:45',label:'9:45 AM'},
  {value:'10:00',label:'10:00 AM'},
  {value:'10:15',label:'10:15 AM'},
  {value:'10:30',label:'10:30 AM'},
  {value:'10:45',label:'10:45 AM'},
  {value:'11:00',label:'11:00 AM'},
  {value:'11:15',label:'11:15 AM'},
  {value:'11:30',label:'11:30 AM'},
  {value:'11:45',label:'11:45 AM'},
  {value:'12:00',label:'12:00 PM'},
  {value:'12:15',label:'12:15 PM'},
  {value:'12:30',label:'12:30 PM'},
  {value:'12:45',label:'12:45 PM'},
  {value:'13:00',label:'1:00 PM'},
  {value:'13:15',label:'1:15 PM'},
  {value:'13:30',label:'1:30 PM'},
  {value:'13:45',label:'1:45 PM'},
  {value:'14:00',label:'2:00 PM'},
  {value:'14:15',label:'2:15 PM'},
  {value:'14:30',label:'2:30 PM'},
  {value:'14:45',label:'2:45 PM'},
  {value:'15:00',label:'3:00 PM'},
  {value:'15:15',label:'3:15 PM'},
  {value:'15:30',label:'3:30 PM'},
  {value:'15:45',label:'3:45 PM'},
  {value:'16:00',label:'4:00 PM'},
  {value:'16:15',label:'4:15 PM'},
  {value:'16:30',label:'4:30 PM'},
  {value:'16:45',label:'4:45 PM'},
  {value:'17:00',label:'5:00 PM'},
  {value:'17:15',label:'5:15 PM'},
  {value:'17:30',label:'5:30 PM'},
  {value:'17:45',label:'5:45 PM'},
  {value:'18:00',label:'6:00 PM'},
  {value:'18:15',label:'6:15 PM'},
  {value:'18:30',label:'6:30 PM'},
  {value:'18:45',label:'6:45 PM'},
  {value:'19:00',label:'7:00 PM'},
  {value:'19:15',label:'7:15 PM'},
  {value:'19:30',label:'7:30 PM'},
  {value:'19:45',label:'7:45 PM'},
  {value:'20:00',label:'8:00 PM'},
  {value:'20:15',label:'8:15 PM'},
  {value:'20:30',label:'8:30 PM'},
  {value:'20:45',label:'8:45 PM'},
  {value:'21:00',label:'9:00 PM'},
  {value:'21:15',label:'9:15 PM'},
  {value:'21:30',label:'9:30 PM'},
  {value:'21:45',label:'9:45 PM'},
  {value:'22:00',label:'10:00 PM'},
  {value:'22:15',label:'10:15 PM'},
  {value:'22:30',label:'10:30 PM'},
  {value:'22:45',label:'10:45 PM'},
  {value:'23:00',label:'11:00 PM'},
  {value:'23:15',label:'11:15 PM'},
  {value:'23:30',label:'11:30 PM'},
  {value:'23:45',label:'11:45 PM'}
];

var PARA={nom:"20CC0E17",dir:"1937404C",hor:"5FD3258A",
          trl:"1C7D20AD",tot:"630A9D8C",ant:"05589192",res:"31D27AD4"};

/* ═══════════════════════════════════════════════════════════════════════
   STORAGE — soporta dos modos:
   · LOCAL  (default): usa localStorage del navegador, solo en este dispositivo.
   · FIREBASE: usa Firebase Realtime Database; el historial es compartido entre
               todos los dispositivos/usuarios que usen la misma URL.

   Para activar Firebase el usuario configura su proyecto en Ajustes.
   La config se guarda en localStorage["casvel_fb_cfg"].
   Los contratos se sincronizan en tiempo real vía listener onValue.

   MODIFIED: Capa de caché reactiva unificada.
   ─────────────────────────────────────────────────────────────────────
   _memCache es ahora la fuente de verdad en AMBOS modos (local y Firebase).
   · Modo local : se carga una sola vez al arrancar (o tras cada mutación)
                  y se mantiene sincronizado sin volver a parsear localStorage.
   · Modo Firebase: igual que antes — el listener onValue lo actualiza.
   En ambos modos, saveContract / deleteContract actualizan _memCache de
   forma inmediata y disparan _listeners, garantizando que cualquier cambio
   (nuevo contrato, edición, borrado) se refleje en la UI sin re-leer storage.
═══════════════════════════════════════════════════════════════════════ */

/* ── Caché interno ─────────────────────────────────────────── */
var _fbApp    = null;  // Firebase App instance
var _fbDb     = null;  // Firebase Database instance
var _fbRef    = null;  // DatabaseRef para /casvel_v1
var _fbMode   = false; // true cuando Firebase está activo
var _memCache = null;  // MODIFIED: caché unificado — válido en local Y Firebase
var _listeners= [];    // callbacks registrados para cambios en tiempo real

/* ── Helpers internos de caché ───────────────────────────────── */
// ADDED: ordena el caché por fEvento desc (criterio consistente en ambos modos)
function _sortCache(arr){
  arr.sort(function(a,b){
    return (b.fEvento||"").localeCompare(a.fEvento||"") ||
           (b.updatedAt||"").localeCompare(a.updatedAt||"");
  });
}

// ADDED: notifica a todos los listeners con una copia inmutable del caché
function _notifyListeners(){
  var snap = _memCache.slice();
  _listeners.forEach(function(fn){ try{ fn(snap); }catch(e){} });
}

// ADDED: inicializa el caché local desde localStorage (solo se llama una vez)
function _initLocalCache(){
  if(_memCache !== null) return; // ya inicializado
  try{ _memCache = JSON.parse(localStorage.getItem("casvel_v1")||"[]"); }
  catch(e){ _memCache = []; }
  _sortCache(_memCache);
}

/* ── Config de Firebase (guardada en localStorage) ───────────── */
function fbGetConfig(){
  try{return JSON.parse(localStorage.getItem("casvel_fb_cfg")||"null");}
  catch(e){return null;}
}
function fbSaveConfig(cfg){
  localStorage.setItem("casvel_fb_cfg", JSON.stringify(cfg));
}
function fbClearConfig(){
  localStorage.removeItem("casvel_fb_cfg");
}

/* ── Inicializar Firebase (llamado al arrancar si hay config) ─── */
function fbInit(cfg, onReady){
  if(typeof firebase !== "undefined"){
    _fbSetup(cfg, onReady); return;
  }
  var scripts=[
    "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js",
    "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"
  ];
  var loaded=0;
  scripts.forEach(function(src){
    var s=document.createElement("script");
    s.src=src;
    s.onload=function(){ loaded++; if(loaded===scripts.length) _fbSetup(cfg,onReady); };
    s.onerror=function(){ if(onReady) onReady(new Error("No se pudo cargar Firebase SDK")); };
    document.head.appendChild(s);
  });
}

function _fbSetup(cfg, onReady){
  try{
    try{ _fbApp=firebase.app("casvel"); }
    catch(e){ _fbApp=firebase.initializeApp(cfg,"casvel"); }
    // ADDED: autenticación anónima requerida por las reglas de seguridad
    // (".read"/".write": "auth != null"). Transparente para el usuario: no
    // pide login, solo exige que la petición pase por el SDK de Firebase Auth.
    firebase.auth(_fbApp).signInAnonymously().then(function(){
      _fbSetupRefs(onReady);
    }).catch(function(err){
      _fbMode=false;
      if(onReady) onReady(err);
    });
  } catch(e){
    _fbMode=false;
    if(onReady) onReady(e);
  }
}

function _fbSetupRefs(onReady){
  try{
    _fbDb  = firebase.database(_fbApp);
    _fbRef = _fbDb.ref("casvel_v1");
    // ADDED: ref para el catálogo en Firebase
    _fbCatRef = _fbDb.ref("casvel_catalog");

    // MODIFIED (perf): antes un solo listener "value" en la raíz de casvel_v1
    // hacía que CUALQUIER escritura a UN contrato, desde CUALQUIER dispositivo,
    // reenviara y re-parseara la colección COMPLETA (cientos de contratos y
    // creciendo). Ahora se usan child_added/child_changed/child_removed para
    // mantener _memCache actualizado de forma incremental — cada evento toca
    // solo el registro que cambió. Firebase repite child_added para todos los
    // registros existentes al conectar (carga inicial); esos eventos, igual
    // que ráfagas de cambios reales, se agrupan con _scheduleNotify() para
    // disparar un solo re-render en vez de uno por registro.
    _memCache = [];
    var _byId = {};
    function _rebuildIndex(){
      _byId = {};
      _memCache.forEach(function(c,i){ _byId[c.id]=i; });
    }
    function _upsert(snap){
      var c = snap.val(); if(!c) return;
      if(!c.id) c.id = snap.key;
      var idx = _byId[c.id];
      if(idx!==undefined) _memCache[idx]=c;
      else { _byId[c.id]=_memCache.length; _memCache.push(c); }
      _scheduleNotify();
    }
    var _notifyTimer=null;
    function _scheduleNotify(){
      if(_notifyTimer) return;
      _notifyTimer=setTimeout(function(){
        _notifyTimer=null;
        _sortCache(_memCache);
        _rebuildIndex(); // _sortCache reordena el arreglo — _byId debe seguirlo
        _notifyListeners();
      },0);
    }
    _fbRef.on("child_added", _upsert);
    _fbRef.on("child_changed", _upsert);
    _fbRef.on("child_removed", function(snap){
      var idx=_byId[snap.key];
      if(idx===undefined) return;
      _memCache.splice(idx,1);
      _rebuildIndex();
      _scheduleNotify();
    });

    // ADDED: listener en tiempo real para el catálogo (tamaño fijo/pequeño —
    // no forma parte del problema de escalado con el historial de contratos,
    // así que se mantiene como un solo listener "value").
    _fbCatRef.on("value", function(snap){
      var val=snap.val();
      _catalogCache = val ? val : JSON.parse(JSON.stringify(DEFAULT_CATALOG));
      _rebuildCatalogVars(_catalogCache);
      _notifyCatListeners();
    });
    _fbMode=true;
    if(onReady) onReady(null);
  } catch(e){
    _fbMode=false;
    if(onReady) onReady(e);
  }
}

/* ── Registrar listener de cambios en tiempo real ────────────── */
function onContractsChange(fn){
  _listeners.push(fn);
  // MODIFIED: también dispara en modo local si el caché ya está listo
  if(_memCache!==null) try{ fn(_memCache.slice()); }catch(e){}
  return function(){ _listeners=_listeners.filter(function(x){return x!==fn;}); };
}

/* ── CRUD ────────────────────────────────────────────────────── */
// MODIFIED: loadContracts siempre sirve desde _memCache (O(1) tras el primer load)
function loadContracts(){
  if(!_fbMode) _initLocalCache();        // garantiza caché inicializado en modo local
  return _memCache !== null ? _memCache.slice() : [];
}

function saveContracts(list){
  if(_fbMode && _fbRef){
    var obj={};
    list.forEach(function(c){ if(c.id) obj[c.id]=c; });
    _fbRef.set(obj).catch(function(e){console.error("Firebase write error",e);});
    return;
  }
  // MODIFIED: actualiza caché local y notifica listeners antes de escribir a storage
  _memCache = list.slice();
  _sortCache(_memCache);
  _notifyListeners();
  localStorage.setItem("casvel_v1",JSON.stringify(_memCache));
}

function saveContract(c){
  if(_fbMode && _fbRef){
    // Firebase: el listener onValue actualizará _memCache y notificará
    _fbRef.child(c.id).set(c).catch(function(e){console.error("Firebase write",e);});
    return;
  }
  // MODIFIED: modo local — mutar caché en memoria, notificar y persistir
  _initLocalCache();
  var idx=_memCache.findIndex(function(x){return x.id===c.id;});
  if(idx>=0){ _memCache[idx]=c; } else { _memCache.unshift(c); }
  _sortCache(_memCache);
  _notifyListeners();                    // ADDED: dispara listeners igual que Firebase
  localStorage.setItem("casvel_v1",JSON.stringify(_memCache));
}

function deleteContract(id){
  if(_fbMode && _fbRef){
    // Firebase: el listener onValue actualizará _memCache y notificará
    _fbRef.child(id).remove().catch(function(e){console.error("Firebase delete",e);});
    return;
  }
  // MODIFIED: modo local — mutar caché, notificar y persistir
  _initLocalCache();
  _memCache = _memCache.filter(function(c){return c.id!==id;});
  _notifyListeners();                    // ADDED: dispara listeners igual que Firebase
  localStorage.setItem("casvel_v1",JSON.stringify(_memCache));
}

function getById(id){
  // MODIFIED: busca en caché, sin re-leer storage
  if(!_fbMode) _initLocalCache();
  return (_memCache||[]).find(function(c){return c.id===id;})||null;
}
function newId(){return "cv_"+Date.now();}
function isFbMode(){return _fbMode;}

// ADDED: resetea el caché al desconectarse de Firebase para que _initLocalCache
// lo recargue limpio desde localStorage. Llamar desde mFbDisconnect antes de renderizar.
function _resetToLocalCache(){
  _fbMode   = false;
  _fbCatRef = null;              // ADDED: limpiar ref de catálogo
  _memCache = null;
  _catalogCache = null;          // ADDED: forzar re-lectura del catálogo local
  _initLocalCache();
  _initLocalCatalog();           // ADDED: recargar catálogo desde localStorage
  _notifyListeners();
  _notifyCatListeners();         // ADDED: notificar vistas del catálogo
}

/* ── Fechas y formato ── */
function todayISO(){return new Date().toISOString().split("T")[0];}
function pad2(n){return n<10?"0"+n:""+n;}
function fmtDate(iso){
  if(!iso||iso.length<10) return "--/---/----";
  var p=iso.split("-");
  var mo=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return pad2(parseInt(p[2]))+"/"+mo[parseInt(p[1])-1]+"/"+p[0];
}
function f2(n){return "$"+(+n).toFixed(2);}
function xe(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
// ADDED (perf): usado para no reconstruir listas completas (historial, clientes...)
// en cada tecla escrita en un buscador — solo tras una pausa breve.
function debounce(fn, wait){
  var t;
  return function(){
    var args=arguments, ctx=this;
    clearTimeout(t);
    t=setTimeout(function(){ fn.apply(ctx,args); }, wait);
  };
}

/* ── Descargas ── */
function dlBlob(blob,name){
  var url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}
function dlDataURL(url,name){
  var a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  document.body.removeChild(a);
}

/* ── ICS ── */
function buildICS(d){
  var sh=d.hEntrega?parseInt(d.hEntrega.split(":")[0]):9;
  var sm=d.hEntrega?parseInt(d.hEntrega.split(":")[1]):0;
  var em=sm+30,eh=sh;if(em>=60){eh++;em-=60;}
  var ds=(d.fEvento||"").replace(/-/g,"");
  var stamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  var il=[];
  d.items.forEach(function(r,i){if(r.qty>0)il.push("  - "+getItemByIndex(i).desc+" x"+r.qty);});
  var parts=[];
  d.items.forEach(function(r,i){if(r&&r.qty>0)parts.push(getItemByIndex(i).abbrev+" x"+r.qty);});
  var mobSummary=parts.length>0?"["+parts.join(", ")+"] ":"";
  var desc=["CASVEL","Contrato: "+fmtDate(d.cDate),"","Cliente: "+d.nombre,
    "Tel: "+d.tel,"Dir: "+d.dir,"Evento: "+fmtDate(d.fEvento),
    "Entrega: "+d.hEntregaL,"Recoleccion: "+d.hRecolL,""].concat(il).concat([
    "","Total: "+f2(d.total),"Anticipo: "+f2(d.anticipo),"Resta: "+f2(d.resta)
  ]).join("\n");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CASVEL//ES",
    "BEGIN:VEVENT","UID:casvel-"+Date.now()+"@casvel","DTSTAMP:"+stamp,
    "DTSTART:"+ds+"T"+pad2(sh)+pad2(sm)+"00",
    "DTEND:"+ds+"T"+pad2(eh)+pad2(em)+"00",
    "SUMMARY:"+mobSummary+"CASVEL - "+d.nombre,
    "LOCATION:"+d.dir,
    "DESCRIPTION:"+desc.replace(/\n/g,"\\n"),
    "END:VEVENT","END:VCALENDAR"].join("\r\n");
}

/* ── DOCX ── */
function repPara(xml,pid,txt){
  var re=new RegExp("(<w:p[^>]*"+pid+"[^>]*>)([\s\S]*?)(</w:p>)");
  return xml.replace(re,function(m,op,inner,cl){
    var pPr=(inner.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[""])[0];
    var rPr=(inner.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)||["<w:rPr><w:lang w:val=\"es-ES\"/></w:rPr>"])[0];
    if(!txt&&txt!=="0") return op+pPr+cl;
    var sp=(txt[0]===" "||txt[txt.length-1]===" ")?" xml:space=\"preserve\"":"";
    return op+pPr+"<w:r>"+rPr+"<w:t"+sp+">"+xe(txt)+"</w:t></w:r>"+cl;
  });
}
async function buildDOCX(d){
  await ensureDocxLoaded(); // ADDED (perf): plantilla .docx cargada bajo demanda, no inline
  var bin=atob(DOCX_B64),bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  var zip=await JSZip.loadAsync(bytes.buffer);
  var xml=await zip.file("word/document.xml").async("string");
  xml=xml.split("____ de __________ del año ________").join(xe(fmtDate(d.cDate)));
  xml=repPara(xml,PARA.nom,"Nombre: "+d.nombre+"     Telefono: "+d.tel);
  xml=repPara(xml,PARA.dir,"Dirección del evento: "+d.dir+"     Fecha del Evento: "+fmtDate(d.fEvento));
  xml=repPara(xml,PARA.hor,"Horario de entrega: "+d.hEntregaL+"     Horario de recolección: "+d.hRecolL);
  // MODIFIED: usa getItemByIndex para compatibilidad con contratos pasados
  (d.items||[]).forEach(function(r,i){
    var it=getItemByIndex(i);
    if(!it.pq) return; // artículo sin bookmark OOXML — omitir
    xml=repPara(xml,it.pq,r&&r.qty>0?String(r.qty):"");
    xml=repPara(xml,it.pa,r&&r.amt>0?f2(r.amt):"$");
  });
  xml=repPara(xml,PARA.trl,d.traslado>0?f2(d.traslado):"$");
  xml=repPara(xml,PARA.tot,f2(d.total));
  xml=repPara(xml,PARA.ant,"Anticipo: "+f2(d.anticipo));
  xml=repPara(xml,PARA.res,"Resta por Pagar: "+f2(d.resta));
  zip.file("word/document.xml",xml);
  return zip.generateAsync({type:"blob",
    mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}

/* ═══════════════════════════════════════════════════════════════════════
   buildA4Node(d)  —  construye el nodo DOM del contrato A4.
   scaleA4ToFit(node) ajusta UN SOLO valor — el font-size base del .a4p —
   y todo el contenido escala en cascada (em units) para llenar 1123px.
   Sin transform, sin recortes, sin iteraciones por sección.
   Devuelve: { wrap, node }
═══════════════════════════════════════════════════════════════════════ */
var A4_CSS = "*{box-sizing:border-box;margin:0;padding:0}\nbody,html{margin:0;padding:0}\n.a4p{width:794px;height:auto;background:#fff;padding:24px 38px 20px;font-family:Arial,sans-serif;font-size:10pt;display:block}\n.chdr{display:flex;align-items:flex-start;gap:10px;margin-bottom:0.3em}\n.clogo{width:70px;flex-shrink:0}\n.chdrr{flex:1}\n.ctitle{font-size:1.25em;font-weight:bold;color:#2563a8;line-height:1.2;margin-bottom:0.2em}\n.cdate{font-size:0.85em;text-align:right;margin-top:0.2em}\n.ccontact{color:#2563a8;font-size:0.85em;margin:0.2em 0 0.5em}\n.csh1{color:#2563a8;font-weight:bold;font-size:0.9em;text-transform:uppercase;border-bottom:1.5px solid #2563a8;padding-bottom:0.1em;margin:0.5em 0 0.3em}\n.csh2{color:#2563a8;font-weight:bold;font-size:0.95em;margin:0.5em 0 0.3em}\n.cdt{width:100%;border-collapse:collapse;margin-bottom:0.4em}\n.cdt td{padding:0.2em 0;font-size:0.85em;vertical-align:bottom}\n.cfl{display:flex;align-items:flex-end;gap:0.3em;padding-right:0.6em}\n.clbl{white-space:nowrap;font-size:1em;font-family:Arial}\n.cval{flex:1;border:none;border-bottom:1px solid #444;font-family:Arial;font-size:1em;color:#000;padding:0 0.2em 0.1em;min-width:20px}\n.cmob{width:100%;border-collapse:collapse;font-size:0.8em;table-layout:fixed}\n.cmob thead tr{background:#2563a8;color:#fff}\n.cmob thead th{padding:0.3em 0.5em;font-weight:bold;text-align:center;border:1px solid #2563a8;font-size:0.95em}\n.cmob thead th.thl{text-align:left}\n.cmob tbody tr.odd{background:#dce6f1}\n.cmob tbody tr.even{background:#fff}\n.cmob tbody td{padding:0.25em 0.5em;border:1px solid #b8cce4;vertical-align:middle}\n.cmob tbody td.tdesc{font-weight:bold}\n.cmob tbody td.tnum{text-align:center}\n.cmob tfoot td{border:1px solid #b8cce4;padding:0.25em 0.5em}\n.cmob tfoot tr.fwht td{background:#fff}\n.cmob tfoot tr.falt td{background:#dce6f1}\n.cmob tfoot tr.fbld td{background:#dce6f1;font-weight:bold}\n.rlbl{text-align:right;font-weight:bold}\n.ccl,.ccu{margin:0.3em 0 0.5em}\n.ccl ol,.ccu ol{padding-left:1.6em}\n.ccl li,.ccu li{margin-bottom:0.1em;line-height:1.3;text-align:justify;font-size:0.75em}\n.csig{width:100%;border-collapse:collapse;margin-top:1.2em}\n.csigl{border-bottom:1px solid #000;height:2em}\n.csigt{text-align:center;font-size:0.8em;padding-top:0.2em}\n.cfoot{text-align:right;font-size:0.8em;color:#555;margin-top:0.5em}";


var A4_W = 794;   /* ancho A4 a 96 dpi */
var A4_H = 1123;  /* alto  A4 a 96 dpi */

function buildA4Node(d){
  var logo="data:image/jpeg;base64,"+LOGO_B64;

  // MODIFIED: usa getItemByIndex para leer contratos con catálogo anterior o ampliado
  var irows=ITEMS.map(function(it,i){
    var r=d.items[i];
    var cls=i%2===0?"odd":"even";
    var hasQty=r&&r.qty>0;
    var price=hasQty?r.price:it.price;
    return '<tr class="'+cls+'">'
      +'<td class="tdesc">'+it.desc+'</td>'
      +'<td class="tnum">'+(hasQty?r.qty:'')+'</td>'
      +'<td class="tnum">$'+price.toFixed(2)+'</td>'
      +'<td class="tnum">'+(hasQty?f2(r.amt):'')+'</td></tr>';
  }).join("");

  var html=
    '<div class="a4p">'

    +'<div class="chdr">'
      +'<img class="clogo" src="'+logo+'" crossorigin="anonymous">'
      +'<div class="chdrr">'
        +'<div class="ctitle">CONTRATO DE ALQUILER DE MOBILIARIO PARA EVENTOS</div>'
        +'<div class="cdate">Chihuahua, Chihuahua. a '+fmtDate(d.cDate)+'</div>'
      +'</div>'
    +'</div>'
    +'<div class="ccontact">Contacto: 614 126 6784</div>'

    +'<div class="csh1">DATOS DEL ARRENDATARIO</div>'
    +'<table class="cdt"><colgroup><col style="width:63%"><col style="width:37%"></colgroup>'
      +'<tr>'
        +'<td><div class="cfl"><span class="clbl">Nombre:</span><span class="cval">'+xe(d.nombre)+'</span></div></td>'
        +'<td><div class="cfl"><span class="clbl">Telefono:</span><span class="cval">'+xe(d.tel)+'</span></div></td>'
      +'</tr><tr>'
        +'<td><div class="cfl"><span class="clbl">Dirección del evento:</span><span class="cval">'+xe(d.dir)+'</span></div></td>'
        +'<td><div class="cfl"><span class="clbl">Fecha del Evento:</span><span class="cval">'+fmtDate(d.fEvento)+'</span></div></td>'
      +'</tr><tr>'
        +'<td><div class="cfl"><span class="clbl">Horario de entrega:</span><span class="cval">'+xe(d.hEntregaL)+'</span></div></td>'
        +'<td><div class="cfl"><span class="clbl">Horario de recolección:</span><span class="cval">'+xe(d.hRecolL)+'</span></div></td>'
      +'</tr>'
    +'</table>'

    +'<div class="csh2">Mobiliario a arrendar:</div>'
    +'<table class="cmob">'
      +'<thead><tr>'
        +'<th class="thl" style="width:37%">Descripción</th>'
        +'<th style="width:19%">Cantidad</th>'
        +'<th style="width:22%">Precio Unitario</th>'
        +'<th style="width:22%">Importe</th>'
      +'</tr></thead>'
      +'<tbody>'+irows+'</tbody>'
      +'<tfoot>'
        +'<tr class="fwht"><td colspan="2" style="border:1px solid #b8cce4"></td>'
          +'<td class="rlbl">Traslado:</td>'
          +'<td>'+f2(d.traslado)+'</td></tr>'
        +'<tr class="falt"><td colspan="2" style="border:1px solid #b8cce4"></td>'
          +'<td class="rlbl">Precio Total:</td>'
          +'<td>'+f2(d.total)+'</td></tr>'
        +'<tr class="fbld">'
          +'<td>Anticipo: '+f2(d.anticipo)+'</td>'
          +'<td colspan="3">Resta por Pagar: '+f2(d.resta)+'</td>'
        +'</tr>'
      +'</tfoot>'
    +'</table>'

    +'<div class="csh1" style="margin-top:0.6em">CLAUSULAS PARA ALQUILER:</div>'
    +'<div class="ccl"><ol>'
      +'<li>El mobiliario se alquila por día, se entrega el día del evento y se retira el mismo día o al día siguiente a más tardar las 12:00 pm.</li>'
      +'<li>El costo del alquiler no incluye Traslado.</li>'
      +'<li>El pago debe de hacerse al momento de la entrega del mobiliario.</li>'
      +'<li>El mobiliario solo debe ser trasladado por el arrendador y no debe ser trasladado a otro sitio ya que puede sufrir daños con costo adicional.</li>'
      +'<li>El mobiliario debe entregarse en las mismas condiciones físicas recibidas, sin piezas faltantes ni quebraduras o quemaduras, ya que esto correrá por cuenta del arrendatario.</li>'
      +'<li>En caso de daño al brinca brinca, el cliente deberá pagar el importe acordado.</li>'
      +'<li><strong>EVENTOS CASVEL NO</strong> se hace responsable de algún accidente o incidente dentro o fuera del inflable.</li>'
      +'<li>En caso de suspensión del evento por parte del cliente no hay devolución del anticipo.</li>'
      +'<li>Cada contrato requiere un anticipo del <strong>25%</strong>.</li>'
      +'<li>En caso de posponer el evento, el cliente deberá elegir otra fecha disponible y avisar a &quot;EVENTOS CASVEL&quot; al menos 7 días antes.</li>'
      +'<li>Al firmar el presente contrato se dan por aceptadas todas las condiciones antes mencionadas.</li>'
    +'</ol></div>'
    +'<div class="csh2">Condiciones de uso por razones de higiene, seguridad y deterioro del inflable.</div>'
    +'<div class="ccu"><ol>'
      +'<li>No usar dentro del juego: confeti, serpentinas, papel de china, espuma, luces de bengala, restos de piñata, alimentos y/o bebidas.</li>'
      +'<li>No usar zapatos dentro del inflable.</li>'
      +'<li>No se permite fumar o colocar inflables cerca de fogatas o parrillas calientes.</li>'
    +'</ol></div>'

    +'<table class="csig"><tr>'
      +'<td style="width:46%"><div class="csigl"></div></td>'
      +'<td style="width:8%"></td>'
      +'<td style="width:46%"><div class="csigl"></div></td>'
    +'</tr><tr>'
      +'<td class="csigt">NOMBRE Y FIRMA ARRENDATARIO</td>'
      +'<td></td>'
      +'<td class="csigt">NOMBRE Y FIRMA ARRENDADOR</td>'
    +'</tr></table>'
    +'<div class="cfoot">@EventosCasVel, 2026</div>'
  +'</div>';

  var wrap=document.createElement("div");
  wrap.innerHTML="<style>"+A4_CSS+"</style>"+html;
  var node=wrap.querySelector(".a4p");
  return {wrap:wrap, node:node};
}

/* ── scaleA4ToFit(node) ───────────────────────────────────────────────
   Ajusta el font-size base del .a4p para que el contenido llene
   exactamente A4_H (1123px) de alto.

   Todos los tamaños de fuente y espaciados del CSS están en em,
   relativos al font-size del .a4p. Cambiar ese único valor escala
   proporcionalmente TODO: títulos, tabla, cláusulas, firmas.

   Algoritmo (sin transform, sin recortes):
   1. Medir altura natural con font-size base (10pt).
   2. Calcular nuevo font-size = 10pt × (A4_H / naturalHeight).
   3. Aplicar y refinar en ≤6 pasos hasta converger a ±1px.
   4. Ajustar margin-top de .csig para absorber el residuo de redondeo
      y garantizar que las firmas queden exactamente al fondo.
   5. Fijar height:A4_H en el nodo para captura exacta con html2canvas.
   ─────────────────────────────────────────────────────────────────── */
function scaleA4ToFit(node){
  var BASE_PT  = 10;      /* font-size base del .a4p en pt */
  var MIN_PT   = 6.5;     /* mínimo absoluto */
  var MAX_PT   = 13;      /* máximo absoluto */
  var TOLERANCE = 1;      /* ±1px */

  node.style.height    = "auto";
  node.style.minHeight = "0";
  node.style.overflow  = "visible";
  node.style.transform = "";

  /* ── 1. Medir con fuente base ── */
  node.style.fontSize = BASE_PT + "pt";
  var naturalH = node.scrollHeight;
  if(naturalH <= 0) return;

  /* ── 2. Estimación inicial proporcional ── */
  var currentPt = BASE_PT * (A4_H / naturalH);
  currentPt = Math.max(MIN_PT, Math.min(MAX_PT, currentPt));

  /* ── 3. Refinamiento ── */
  for(var i = 0; i < 6; i++){
    node.style.fontSize = currentPt + "pt";
    var h = node.scrollHeight;
    var diff = A4_H - h;
    if(Math.abs(diff) <= TOLERANCE) break;
    /* Corrección proporcional: si estamos a diff px del target,
       ajustar la fuente en la misma proporción */
    currentPt = currentPt * (A4_H / h);
    currentPt = Math.max(MIN_PT, Math.min(MAX_PT, currentPt));
  }

  /* ── 4. Absorber residuo en margin-top de .csig ── */
  var finalH = node.scrollHeight;
  var residual = A4_H - finalH;
  var sig = node.querySelector(".csig");
  if(sig && residual > 0){
    var curMt = parseFloat(getComputedStyle(sig).marginTop) || 0;
    sig.style.marginTop = (curMt + residual) + "px";
  }

  /* ── 5. Fijar dimensiones exactas para captura ── */
  node.style.height    = A4_H + "px";
  node.style.minHeight = A4_H + "px";
  node.style.overflow  = "hidden";
}

/* ── captureA4(d, fmt, onDone) — PNG/JPG directo ── */
function captureA4(d, fmt, onDone){
  // ADDED (perf): buildA4Node necesita LOGO_B64, que ahora se carga bajo demanda
  ensureLogoLoaded().then(function(){ _captureA4Impl(d, fmt, onDone); })
    .catch(function(e){ onDone(e, null); });
}
function _captureA4Impl(d, fmt, onDone){
  var r=buildA4Node(d);
  r.wrap.style.cssText="position:fixed;left:-9999px;top:0;width:"+A4_W+"px;pointer-events:none;z-index:-999";
  document.body.appendChild(r.wrap);

  function doCapture(){
    scaleA4ToFit(r.node);
    setTimeout(function(){
      html2canvas(r.node,{
        scale:2, useCORS:true, allowTaint:true,
        backgroundColor:"#ffffff", logging:false,
        width:A4_W, height:A4_H, windowWidth:A4_W
      }).then(function(canvas){
        document.body.removeChild(r.wrap);
        var mime=fmt==="jpg"?"image/jpeg":"image/png";
        onDone(null, canvas.toDataURL(mime, fmt==="jpg"?0.92:1));
      }).catch(function(e){
        document.body.removeChild(r.wrap);
        onDone(e, null);
      });
    }, 80);
  }

  var img=r.node.querySelector("img.clogo");
  if(img && !img.complete){
    img.onload=doCapture; img.onerror=doCapture;
    setTimeout(doCapture, 600);
  } else {
    setTimeout(doCapture, 80);
  }
}

/* ── savePDF(d, filename) — guarda PDF directamente (sin diálogo de impresión) ──
   Usa html2canvas para renderizar el A4 exacto, luego jsPDF para empaquetarlo.
   jsPDF se carga del CDN la primera vez que se necesita. */
function savePDF(d, filename){
  // ADDED (perf): buildA4Node necesita LOGO_B64, que ahora se carga bajo demanda
  return ensureLogoLoaded().then(function(){
  return new Promise(function(resolve, reject){
    function doSave(){
      var r=buildA4Node(d);
      r.wrap.style.cssText="position:fixed;left:-9999px;top:0;width:"+A4_W+"px;pointer-events:none;z-index:-999";
      document.body.appendChild(r.wrap);

      function doRender(){
        scaleA4ToFit(r.node);
        setTimeout(function(){
          html2canvas(r.node,{
            scale:2, useCORS:true, allowTaint:true,
            backgroundColor:"#ffffff", logging:false,
            width:A4_W, height:A4_H, windowWidth:A4_W
          }).then(function(canvas){
            document.body.removeChild(r.wrap);
            var pdf=new window.jspdf.jsPDF({
              orientation:"portrait", unit:"mm", format:"a4"
            });
            var imgData=canvas.toDataURL("image/jpeg",0.92);
            pdf.addImage(imgData,"JPEG",0,0,210,297,undefined,"FAST");
            pdf.save(filename||"CASVEL_contrato.pdf");
            resolve();
          }).catch(function(e){
            document.body.removeChild(r.wrap);
            reject(e);
          });
        }, 80);
      }

      var img=r.node.querySelector("img.clogo");
      if(img && !img.complete){
        img.onload=doRender; img.onerror=doRender;
        setTimeout(doRender, 600);
      } else {
        setTimeout(doRender, 80);
      }
    }

    if(window.jspdf){
      doSave();
    } else {
      var s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload=function(){ doSave(); };
      s.onerror=function(){ reject(new Error("No se pudo cargar jsPDF")); };
      document.head.appendChild(s);
    }
  });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   Inventario diario, validación y status
   MODIFIED: DAILY_INVENTORY, ITEM_RESOURCES, RESOURCE_NAMES ya no son
   constantes — son variables populadas dinámicamente por _rebuildCatalogVars()
   cada vez que el catálogo se carga o modifica.
═══════════════════════════════════════════════════════════════════════ */

/* ── Status efectivo de un contrato (no muta el objeto) ── */
function resolveStatus(c){
  var s=c.status||'abierto';
  if(s==='cancelado') return 'cancelado';
  if(s==='cerrado')   return 'cerrado';
  if(c.fEvento){
    var ev=new Date(c.fEvento+'T00:00:00');
    var hoy=new Date(todayISO()+'T00:00:00');
    if((hoy-ev)/86400000>5) return 'cerrado';
  }
  return 'abierto';
}

/* ── Clientes: normalización de teléfono y agrupación ─────────
   ADDED: no persiste nada — se recalcula siempre a partir de
   loadContracts(), igual que Reportes/Entregas. normPhone() quita todo
   lo que no sea dígito y devuelve los últimos 10 (así "+52 614-123-4567"
   y "6141234567" agrupan como el mismo cliente). Sin teléfono válido
   (<10 dígitos), se agrupa por nombre normalizado como respaldo. */
function normPhone(tel){
  var digits=(tel||'').replace(/\D/g,'');
  return digits.length>=10 ? digits.slice(-10) : digits;
}
function normName(nombre){
  return (nombre||'').trim().toLowerCase().replace(/\s+/g,' ');
}
function computeClients(){
  var byKey={};
  loadContracts().forEach(function(c){
    var np=normPhone(c.tel);
    var key = np.length===10 ? 'tel:'+np : 'name:'+normName(c.nombre);
    if(!byKey[key]) byKey[key]={key:key, nombre:c.nombre||'Sin nombre', tel:c.tel||'', contracts:[]};
    byKey[key].contracts.push(c);
  });
  var clients=Object.keys(byKey).map(function(k){ return byKey[k]; });
  clients.forEach(function(cl){
    cl.contracts.sort(function(a,b){
      return (b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||'');
    });
    var latest=cl.contracts[0];
    if(latest){ cl.nombre=latest.nombre||cl.nombre; cl.tel=latest.tel||cl.tel; }
    cl.total=cl.contracts.length;
  });
  clients.sort(function(a,b){
    var da=(a.contracts[0]&&(a.contracts[0].updatedAt||a.contracts[0].createdAt))||'';
    var db=(b.contracts[0]&&(b.contracts[0].updatedAt||b.contracts[0].createdAt))||'';
    return db.localeCompare(da);
  });
  return clients;
}

/* ── Verificar conflictos de inventario ──────────────────────
   items      : [{qty,price,amt}×13]  — ítems del nuevo/editado contrato
   fEvento    : 'YYYY-MM-DD'
   excludeId  : id a ignorar al editar
   Retorna array de {key,name,used,max} con recursos excedidos.        */
function checkInventory(items,fEvento,excludeId){
  if(!fEvento) return [];
  var contracts=loadContracts().filter(function(c){
    return c.fEvento===fEvento&&c.id!==excludeId&&resolveStatus(c)!=='cancelado';
  });
  var usage={};
  contracts.forEach(function(c){
    (c.items||[]).forEach(function(r,i){
      if(!r||!(r.qty>0)) return;
      ITEM_RESOURCES[i].forEach(function(res){
        usage[res[0]]=(usage[res[0]]||0)+r.qty*res[1];
      });
    });
  });
  (items||[]).forEach(function(r,i){
    if(!r||!(r.qty>0)) return;
    ITEM_RESOURCES[i].forEach(function(res){
      usage[res[0]]=(usage[res[0]]||0)+r.qty*res[1];
    });
  });
  var conflicts=[];
  Object.keys(usage).forEach(function(key){
    var max=DAILY_INVENTORY[key];
    if(max!==undefined&&usage[key]>max)
      conflicts.push({key:key,name:RESOURCE_NAMES[key]||key,used:usage[key],max:max});
  });
  return conflicts;
}

/* ── Badge HTML de status (tablas y tarjetas) ── */
function statusBadgeHTML(c){
  var s=resolveStatus(c);
  var styles={
    abierto: 'background:#dcfce7;color:#15803d',
    cerrado: 'background:#f1f5f9;color:#475569',
    cancelado:'background:#fee2e2;color:#b91c1c'
  };
  var labels={abierto:'Abierto',cerrado:'Cerrado',cancelado:'Cancelado'};
  return '<span class="status-badge" style="'+styles[s]+'">'+labels[s]+'</span>';
}

/* ── Resumen compacto de ítems (para fichas de reporte) ── */
function itemsSummary(items){
  return (items||[]).map(function(r,i){
    if(!r||!r.qty||r.qty<=0) return '';
    // MODIFIED: usa getItemByIndex para compatibilidad con contratos pasados
    return r.qty+'\u00d7 '+getItemByIndex(i).abbrev;
  }).filter(Boolean).join(' \u00b7 ');
}

// ADDED: inicializa catálogo al arrancar — al final del archivo para garantizar que
// todas las funciones (fbGetConfig, etc.) ya estén declaradas antes de ejecutar.
_initLocalCatalog();

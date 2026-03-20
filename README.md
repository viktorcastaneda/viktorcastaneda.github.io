# CASVEL — Gestor de Contratos para Eventos

Sistema web de gestión de contratos de renta de mobiliario para eventos y fiestas. Funciona completamente en el navegador, sin servidor ni instalación, con sincronización opcional a la nube mediante Firebase Realtime Database.

---

## Capturas de pantalla

| Móvil — Inicio | Móvil — Wizard | Reportes |
|:-:|:-:|:-:|
| Home con estadísticas y contratos recientes | Wizard de 5 pasos para crear contratos | 4 vistas: Año, Mes, Futuros, Entregas |

---

## Características principales

### Gestión de contratos
- Crear, editar y eliminar contratos de renta de mobiliario
- Campos: cliente, teléfono, dirección del evento, fechas, horarios de entrega y recolección, artículos, traslado, anticipo y totales
- **Campo de ubicación** — acepta links de Google Maps, Waze o coordenadas GPS
- **Campo de notas** — observaciones internas (no aparecen al imprimir)
- **Status del contrato** — Abierto, Cerrado o Cancelado; se cierra automáticamente si el evento tiene más de 5 días de haber pasado

### Control de inventario
- Validación en tiempo real al crear o editar un contrato
- Detecta conflictos de inventario con otros contratos del mismo día
- Los "juegos compuestos" (Tiffany, Colors, Metálicas) descuentan correctamente cada recurso individual
- Modal de advertencia que bloquea avanzar hasta corregir el exceso
- Panel de inventario disponible con semáforo (verde / amarillo / agotado) por fecha de evento

### Vistas y reportes
- **Dashboard** con estadísticas generales y contratos recientes
- **Historial** con búsqueda por nombre, teléfono, dirección o fecha — ordenado de evento más reciente a más antiguo
- **Por Año** — ingresos mensuales con gráfica de barras y desglose
- **Por Mes** — filtro por año y mes con métricas y lista de contratos
- **Futuros** — contratos pendientes con countdown de días, desglose por rango y por mes
- **Entregas por día** — selector de fecha con lista de contratos a entregar, horarios y artículos

### Exportación
- **Word (.docx)** — genera el contrato usando una plantilla personalizada
- **PDF** — captura exacta del contrato en formato A4 sin diálogo de impresión
- **PNG / JPG** — imagen del contrato A4 a doble resolución (2×)
- **Calendario (.ics)** — agrega el evento al calendario del dispositivo

### Comunicación rápida
- Teléfonos en cada ficha son links directos a **WhatsApp** (`https://wa.me/`)
- Botón de **ubicación** para abrir el evento en Maps o Waze
- **Bottom sheet de detalle** en cada ficha con todos los datos, artículos, financiero y acciones rápidas

### Sincronización en la nube
- Almacenamiento local por defecto (`localStorage`)
- Sincronización opcional con **Firebase Realtime Database** en tiempo real
- Comparte el historial entre múltiples dispositivos con la misma configuración
- Configuración desde la app, sin tocar código

---

## Archivos del proyecto

```
├── index.html            # Versión escritorio — sidebar, dashboard, historial, editor A4
├── mobile.html           # Versión móvil — wizard 5 pasos, home, historial
├── reporte-mobile.html   # Reportes móviles — 4 pestañas de análisis
├── Contrato-CASVEL.html  # Formulario standalone para impresión directa
└── shared.js             # Lógica compartida: catálogo, storage, exportación, inventario
```

### `shared.js` — módulo central

Contiene todo lo que comparten las páginas:

| Función | Descripción |
|---|---|
| `loadContracts()` | Lee contratos de localStorage o Firebase |
| `saveContract(c)` | Guarda/actualiza un contrato de forma atómica |
| `deleteContract(id)` | Elimina un contrato |
| `resolveStatus(c)` | Devuelve el status efectivo (auto-cierra si evento > 5 días) |
| `checkInventory(items, fEvento, excludeId)` | Detecta conflictos de inventario |
| `statusBadgeHTML(c)` | Genera el badge HTML coloreado de status |
| `itemsSummary(items)` | Resumen compacto de artículos (`2× Sillas met · 1× Mesa 1.80`) |
| `buildDOCX(d)` | Genera el archivo Word usando la plantilla base64 |
| `savePDF(d, filename)` | Genera y descarga el PDF directamente |
| `captureA4(d, fmt, onDone)` | Captura el contrato A4 como imagen |
| `buildICS(d)` | Genera el evento de calendario `.ics` |
| `fbInit(cfg, onReady)` | Inicializa Firebase dinámicamente |

---

## Catálogo de artículos

| # | Artículo | Precio unitario |
|---|---|---|
| 0 | Mantel rectangular color | $40 |
| 1 | Mantel con camino, color | $65 |
| 2 | Sillas negras metálicas | $15 |
| 3 | Mesa rectangular 1.80 mts | $60 |
| 4 | Mesa rectangular infantil 1.20 mts | $50 |
| 5 | Juego de Mesa y 8 Sillas Tiffany infantil | $180 |
| 6 | Juego de Mesa y 8 Sillas Colors infantil | $180 |
| 7 | Juego de Mesa y 8 Sillas metálicas | $130 |
| 8 | Brinca Brinca para bebés | $350 |
| 9 | Brinca Brinca Castillo Colors 3×4 mts | $450 |
| 10 | Brinca Brinca Castillo Caramelo 4×4 mts | $500 |
| 11 | Brinca Brinca Resbaladilla Colors 4×5 mts | $550 |
| 12 | Área Infantil | $1,200 |

### Inventario diario disponible

| Recurso | Cantidad |
|---|---|
| Manteles rectangulares | 10 |
| Manteles con camino | 10 |
| Sillas negras metálicas | 72 |
| Mesas 1.80 mts | 10 |
| Mesas infantiles 1.20 mts | 10 |
| Sillas Tiffany infantil | 48 |
| Sillas Colors infantil | 56 |
| Brinca Brinca bebés | 1 |
| Brinca Brinca Castillo Colors | 1 |
| Brinca Brinca Caramelo | 1 |
| Brinca Brinca Resbaladilla | 1 |
| Área Infantil | 1 |

> **Juegos compuestos:** el Juego Tiffany descuenta 1 mesa infantil + 8 sillas Tiffany; el Juego Colors descuenta 1 mesa infantil + 8 sillas Colors; el Juego Metálicas descuenta 1 mesa 1.80 + 8 sillas negras.

---

## Modelo de datos

Cada contrato se almacena como un objeto JSON con la siguiente estructura:

```json
{
  "id": "cv_1234567890",
  "cDate": "2026-03-15",
  "nombre": "Juan Pérez",
  "tel": "614 123 4567",
  "dir": "Calle Ejemplo 123, Col. Centro",
  "fEvento": "2026-04-20",
  "hEntrega": "09:00",
  "hEntregaL": "9:00 AM",
  "hRecol": "21:00",
  "hRecolL": "9:00 PM",
  "traslado": 300,
  "anticipo": 500,
  "total": 2000,
  "resta": 1500,
  "items": [
    { "qty": 0, "price": 40, "amt": 0 },
    { "qty": 5, "price": 65, "amt": 325 }
  ],
  "status": "abierto",
  "ubicacion": "https://maps.google.com/?q=...",
  "notas": "Cliente prefiere entrega por la mañana",
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z"
}
```

### Claves de `localStorage`

| Clave | Contenido |
|---|---|
| `casvel_v1` | Array JSON de todos los contratos (modo local) |
| `casvel_fb_cfg` | Configuración de Firebase (`apiKey`, `databaseURL`, `projectId`) |

---

## Configuración inicial (deploy)

### 1. Variables que deben llenarse en `shared.js`

Estas tres variables están vacías intencionalmente en el repositorio y deben configurarse antes de usar la app:

```js
var LOGO_B64 = ""; // Base64 del logo JPEG (para el A4 y la app)
var DOCX_B64 = ""; // Base64 de la plantilla Word (.docx)
var A4_CSS   = ""; // CSS del contrato A4 renderizado
```

Para obtener el base64 de un archivo:
```bash
# En terminal
base64 -i logo.jpg | tr -d '\n'
base64 -i plantilla.docx | tr -d '\n'
```

### 2. Favicon e iconos

Colocar en la raíz del proyecto:
- `eventos_casvel_favicon.ico`
- `apple-touch-icon.png` (180×180 px)

### 3. Estructura de la plantilla Word (`DOCX_B64`)

La plantilla `.docx` debe contener párrafos marcados con los siguientes IDs de bookmark (definidos en `PARA` dentro de `shared.js`):

| Variable | Bookmark ID | Contenido que se inyecta |
|---|---|---|
| `PARA.nom` | `20CC0E17` | Nombre y teléfono del cliente |
| `PARA.dir` | `1937404C` | Dirección y fecha del evento |
| `PARA.hor` | `5FD3258A` | Horarios de entrega y recolección |
| `PARA.trl` | `1C7D20AD` | Costo de traslado |
| `PARA.tot` | `630A9D8C` | Total |
| `PARA.ant` | `05589192` | Anticipo |
| `PARA.res` | `31D27AD4` | Resta por pagar |

Cada artículo del catálogo también tiene dos IDs: `pq` (cantidad) y `pa` (importe), definidos en el array `ITEMS`.

---

## Activar Firebase (sincronización en la nube)

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. En **Realtime Database** → **Crear base de datos** → elige **Modo de prueba**
4. Copia la URL de la base de datos (ej: `https://mi-proyecto-default-rtdb.firebaseio.com`)
5. En **Configuración del proyecto → General**, copia el `apiKey` y el `projectId`
6. Abre la app, ve a **Sincronización** y pega los tres valores

Los contratos se sincronizan en tiempo real en todos los dispositivos conectados al mismo proyecto.

---

## Dependencias externas (CDN)

No requiere instalación de paquetes. Las dependencias se cargan desde CDN:

| Librería | Versión | Uso |
|---|---|---|
| [JSZip](https://stuk.github.io/jszip/) | 3.10.1 | Generación de archivos `.docx` |
| [html2canvas](https://html2canvas.hertzen.com/) | 1.4.1 | Captura del A4 como imagen |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | Generación de PDF (carga lazy) |
| [Firebase SDK compat](https://firebase.google.com/) | 9.22.2 | Sincronización en la nube (carga lazy) |
| [Google Fonts — DM Sans](https://fonts.google.com/specimen/DM+Sans) | — | Tipografía principal |
| [Google Fonts — Playfair Display](https://fonts.google.com/specimen/Playfair+Display) | — | Tipografía de títulos (escritorio) |

---

## Flujo de datos

```
Usuario llena formulario
        │
        ▼
collectDesk() / mCollect()   ←── campos del DOM
        │
        ▼
saveContract(obj)
        │
        ├── Modo local  →  localStorage["casvel_v1"]
        │
        └── Modo Firebase  →  Firebase RTDB child(id).set()
                                      │
                                      ▼
                              listener onValue
                                      │
                                      ▼
                              _memCache actualizado
                                      │
                                      ▼
                         onContractsChange() → re-render vistas
```

---

## Compatibilidad

| Plataforma | Soporte |
|---|---|
| iOS Safari (iPhone/iPad) | ✅ Completo, safe-area aware |
| Android Chrome | ✅ Completo |
| Chrome / Edge Desktop | ✅ Completo |
| Firefox Desktop | ✅ Funcional |
| Safari Desktop | ✅ Funcional |

La app detecta automáticamente si el visitante usa un dispositivo móvil y redirige entre `index.html` (escritorio) y `mobile.html` (móvil). Se puede forzar la versión deseada con `?d=1` (escritorio) o `?m=1` (móvil).

---

## Estructura de rutas

```
/
├── index.html              → Escritorio (auto-redirect a mobile si móvil)
├── mobile.html             → Móvil (auto-redirect a index si escritorio)
├── reporte-mobile.html     → Reportes (sin redirect, funciona en ambos)
├── Contrato-CASVEL.html    → Formulario standalone
└── shared.js               → Lógica compartida
```

---

## Licencia

Proyecto privado — EVENTOS CASVEL © 2026. Todos los derechos reservados.

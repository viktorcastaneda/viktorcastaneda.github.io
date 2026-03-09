# CASVEL — Gestor de Contratos de Renta de Mobiliario

Sistema web para generar, guardar y exportar contratos de alquiler de mobiliario para eventos. Funciona directamente desde el navegador, sin servidor ni instalación. Se puede hospedar gratis en GitHub Pages.

---

## Archivos del proyecto

```
casvel/
├── index.html      # Versión escritorio (35 KB)
├── mobile.html     # Versión móvil — wizard de 5 pasos (40 KB)
└── shared.js       # Datos, lógica, renderizador A4 y storage (622 KB)
```

> **Los tres archivos deben estar en la misma carpeta.** `shared.js` contiene el logo y la plantilla Word embebidos en base64 — no se requieren archivos adicionales.

---

## Despliegue en GitHub Pages

1. Crear un repositorio en GitHub (puede ser privado).
2. Subir los tres archivos (`index.html`, `mobile.html`, `shared.js`) a la raíz del repositorio.
3. Ir a **Settings → Pages → Build and deployment**.
4. Seleccionar **Deploy from a branch** → rama `main` → carpeta `/ (root)`.
5. Guardar. En 1–2 minutos la app estará disponible en:

```
https://<usuario>.github.io/<repositorio>/
```

La versión de escritorio se sirve en `index.html` y la móvil en `mobile.html`. La redirección automática entre versiones ocurre según el user-agent y el ancho de pantalla (< 768 px → móvil).

Para forzar una versión específica:
- `?d=1` al final de la URL → fuerza escritorio aunque sea móvil
- `?m=1` al final de la URL → fuerza móvil aunque sea escritorio

---

## Versión escritorio (`index.html`)

Interfaz de tres vistas con barra lateral de navegación.

### Dashboard

Muestra cuatro tarjetas de estadísticas en tiempo real:
- Contratos totales
- Contratos del mes actual
- Total acumulado de todos los contratos
- Ingresos del mes actual

Debajo se listan los 5 contratos más recientes con acceso directo a editar, exportar y eliminar.

### Historial

Tabla completa de contratos con buscador en tiempo real que filtra por nombre, teléfono, dirección y fecha. Cada fila tiene botones para editar, exportar y eliminar.

### Editor de contratos

Formulario con vista previa del contrato en formato A4 editable directamente en pantalla. Campos disponibles:

| Campo | Descripción |
|---|---|
| Fecha de contrato | Fecha en que se firma el contrato |
| Nombre | Nombre del arrendatario |
| Teléfono | Teléfono de contacto |
| Dirección del evento | Lugar donde se realizará el evento |
| Fecha del evento | Fecha del evento |
| Horario de entrega | Hora de entrega del mobiliario |
| Horario de recolección | Hora de recolección |
| Cantidad por artículo | Unidades de cada artículo del catálogo |
| Precio unitario por artículo | Editable por si hay precio especial |
| Traslado | Costo de traslado (opcional) |
| Anticipo | Se calcula automáticamente al 25%; editable manualmente |

La barra de herramientas del editor incluye:
- **Limpiar** — restablece el formulario en blanco
- **Guardar** — guarda o actualiza el contrato en el historial
- **Exportar** — abre el modal de exportación
- **Calendario** — descarga evento `.ics` para importar a Google Calendar, Apple Calendar u Outlook

---

## Versión móvil (`mobile.html`)

Wizard de 5 pasos optimizado para pantallas táctiles. Navegación inferior fija con acceso a Inicio, Historial y Nuevo Contrato.

| Paso | Contenido |
|---|---|
| 1 · Cliente | Nombre, teléfono, dirección |
| 2 · Fechas | Fecha contrato, fecha evento, horario de entrega y recolección |
| 3 · Mobiliario | Lista completa del catálogo con controles +/− de cantidad y precio editable |
| 4 · Totales | Subtotal, traslado, precio total, anticipo (auto 25%), resta por pagar |
| 5 · Resumen | Vista completa del contrato con acceso al panel de exportación |

El botón **Guardar** en la barra superior guarda el contrato en cualquier paso. Los contratos guardados aparecen en Inicio (últimos 3) y en Historial (todos).

---

## Exportación de contratos

Todos los formatos exportan exactamente el mismo contrato A4 de **794 × 1123 px**, llenando la hoja completa sin espacio vacío. El layout usa flexbox para distribuir el espacio vertical proporcionalmente.

El contrato exportado incluye:
- Encabezado con logo, título y fecha del contrato
- Datos del arrendatario
- Tabla de mobiliario con los **13 artículos del catálogo completo**: los artículos seleccionados muestran cantidad, precio unitario e importe; los no seleccionados muestran solo el precio unitario de referencia
- Totales: traslado, precio total, anticipo, resta por pagar
- Cláusulas de alquiler (11 puntos)
- Condiciones de uso del inflable (3 puntos)
- Espacio para firma de arrendatario y arrendador

### Formatos disponibles

| Formato | Descripción | Librería |
|---|---|---|
| **Word (.docx)** | Rellena la plantilla original del contrato con los datos del formulario | JSZip 3.10.1 |
| **PDF** | Descarga directa del archivo `.pdf`, sin diálogo de impresión del navegador | html2canvas 1.4.1 + jsPDF 2.5.1 |
| **PNG** | Imagen de alta resolución (escala ×2, ~1588 × 2246 px) | html2canvas 1.4.1 |
| **JPG** | Igual que PNG con compresión JPEG al 92% | html2canvas 1.4.1 |
| **Calendario (.ics)** | Evento importable a cualquier app de calendario | Nativo |

#### Título del evento de calendario

El archivo `.ics` genera un título descriptivo con el siguiente formato:

```
[Mantel rect x2, BB Castillo Col x1] CASVEL - Nombre Cliente
```

Los nombres abreviados usados en el título son:

| Artículo | Abreviación |
|---|---|
| Mantel rectangular color | Mantel rect |
| Mantel con camino | Mantel camino |
| Sillas negras metálicas | Sillas met |
| Mesa rectangular 1.80 mts | Mesa 1.80 |
| Mesa rectangular infantil 1.20 mts | Mesa inf 1.20 |
| Juego Tiffany infantil | Tiffany inf |
| Juego Colors infantil | Colors inf |
| Juego mesas metálicas | Mesas met |
| Brinca Brinca bebés | BB bebés |
| BB Castillo Colors | BB Castillo Col |
| BB Castillo Caramelo | BB Castillo Car |
| BB Resbaladilla Colors | BB Resbaladilla |
| Área Infantil | Área Inf |

---

## Catálogo de artículos

Precios base editables por contrato. Definidos en `shared.js` en el array `ITEMS`.

| # | Artículo | Precio base |
|---|---|---|
| 1 | Mantel rectangular color | $40 |
| 2 | Mantel con camino, color | $65 |
| 3 | Sillas negras metálicas | $15 |
| 4 | Mesa rectangular 1.80 mts | $60 |
| 5 | Mesa rectangular infantil 1.20 mts | $50 |
| 6 | Juego de Mesa y 8 Sillas Tiffany infantil | $180 |
| 7 | Juego de Mesa y 8 Sillas Colors infantil | $180 |
| 8 | Juego de Mesa y 8 Sillas metálicas | $130 |
| 9 | Brinca Brinca para bebés | $350 |
| 10 | Brinca Brinca Castillo Colors de 3×4 mts | $450 |
| 11 | Brinca Brinca Castillo Caramelo de 4×4 mts | $500 |
| 12 | Brinca Brinca Resbaladilla Colors 4×5 mts | $550 |
| 13 | Área Infantil | $1,200 |

Para modificar precios de forma permanente, editar el array `ITEMS` al inicio de `shared.js`.

---

## Historial compartido con Firebase (opcional)

Por defecto el historial se guarda en `localStorage` del navegador — solo es visible en ese dispositivo. Para compartirlo entre múltiples dispositivos o usuarios se puede conectar **Firebase Realtime Database** (plan gratuito Spark).

Una vez conectado, cualquier contrato guardado desde cualquier dispositivo aparece en tiempo real en todos los demás.

### Crear el proyecto Firebase (una sola vez, ~5 minutos)

1. Ir a [console.firebase.google.com](https://console.firebase.google.com) e iniciar sesión con una cuenta de Google.
2. Hacer clic en **Agregar proyecto**, darle un nombre (ej: `casvel-contratos`) y continuar.
3. En el menú lateral seleccionar **Compilación → Realtime Database**.
4. Hacer clic en **Crear base de datos**.
5. Seleccionar la ubicación más cercana (ej: `us-central1`).
6. En el paso de reglas de seguridad, seleccionar **Comenzar en modo de prueba** y confirmar.

> **Nota de seguridad:** el modo de prueba permite leer y escribir sin autenticación. Es adecuado para uso interno entre un equipo de confianza. Si se necesita restringir el acceso, se pueden configurar reglas de Firebase Authentication.

7. Copiar la URL de la base de datos — tiene el formato:
   ```
   https://casvel-contratos-default-rtdb.firebaseio.com
   ```
8. Ir a **Configuración del proyecto** (ícono de engranaje junto a "Información general del proyecto").
9. En la pestaña **General**, copiar:
   - `apiKey`
   - `projectId`

### Conectar la app a Firebase

**En escritorio:** hacer clic en el botón **⬡ Solo local** en la esquina inferior izquierda de la barra lateral, o ir a **☁️ Sincronización** en el menú de Configuración.

**En móvil:** hacer clic en el indicador **⬡ Local** en la cabecera de la pantalla de Inicio.

En el formulario que aparece, ingresar:

| Campo | Ejemplo |
|---|---|
| API Key | `AIzaSyD...` |
| Database URL | `https://casvel-contratos-default-rtdb.firebaseio.com` |
| Project ID | `casvel-contratos` |

Presionar **Conectar**. El indicador cambiará a **● Firebase activo** (verde) cuando la conexión sea exitosa. La configuración se guarda en `localStorage` del dispositivo, por lo que solo hay que ingresarla una vez por dispositivo.

Para volver al modo local, abrir el mismo panel y presionar **Desconectar**.

### Claves de almacenamiento

| Clave | Destino | Contenido |
|---|---|---|
| `casvel_v1` | `localStorage` o Firebase RTDB | Array de contratos |
| `casvel_fb_cfg` | `localStorage` | Configuración de Firebase (API key, URL, project ID) |

---

## Librerías externas

Todas se cargan desde CDN, no hay dependencias npm ni proceso de build.

| Librería | Versión | CDN | Cuándo se carga |
|---|---|---|---|
| JSZip | 3.10.1 | cdnjs.cloudflare.com | Al inicio (en el `<head>`) |
| html2canvas | 1.4.1 | cdnjs.cloudflare.com | Al inicio (en el `<head>`) |
| jsPDF | 2.5.1 | cdnjs.cloudflare.com | Solo al exportar PDF (lazy) |
| Firebase App compat | 9.22.2 | gstatic.com | Solo al conectar Firebase (lazy) |
| Firebase Database compat | 9.22.2 | gstatic.com | Solo al conectar Firebase (lazy) |
| DM Sans | — | Google Fonts | Al inicio |
| Playfair Display | — | Google Fonts | Al inicio (solo en escritorio) |

---

## Estructura de `shared.js`

`shared.js` es la única librería del proyecto. Contiene todos los datos y la lógica compartida entre las dos interfaces.

### Datos

| Variable | Tipo | Descripción |
|---|---|---|
| `LOGO_B64` | string | Logo CASVEL en base64 (JPEG, ~281 KB) |
| `DOCX_B64` | string | Plantilla Word en base64 (ZIP/DOCX, ~331 KB) |
| `ITEMS` | array[13] | Catálogo con `desc`, `price`, `pq` (Word qty paraId), `pa` (Word amt paraId) |
| `ITEM_ABBREV` | array[13] | Nombres abreviados para el título del evento ICS |
| `TIME_OPTIONS` | array[73] | Opciones de horario de 6:00 AM a 11:45 PM en intervalos de 15 min |
| `PARA` | object | IDs de párrafo del DOCX para reemplazo de texto |
| `A4_CSS` | string | Estilos CSS del contrato A4 (794×1123 px, layout flex) |

### Funciones de storage

| Función | Descripción |
|---|---|
| `loadContracts()` | Devuelve array de contratos desde Firebase o localStorage |
| `saveContracts(list)` | Sobreescribe lista completa (no recomendado con Firebase) |
| `saveContract(c)` | Guarda o actualiza un contrato individual de forma atómica |
| `deleteContract(id)` | Elimina un contrato por ID |
| `getById(id)` | Devuelve un contrato por ID o `null` |
| `newId()` | Genera ID único (`cv_<timestamp>`) |
| `onContractsChange(fn)` | Registra callback que se ejecuta cuando cambia el historial; devuelve función para desuscribirse |
| `isFbMode()` | `true` si Firebase está activo |
| `fbInit(cfg, onReady)` | Inicializa Firebase con la config dada; carga el SDK si es necesario |
| `fbGetConfig()` | Lee la config de Firebase de localStorage |
| `fbSaveConfig(cfg)` | Guarda la config de Firebase en localStorage |
| `fbClearConfig()` | Elimina la config de Firebase |

### Funciones de exportación

| Función | Descripción |
|---|---|
| `buildA4Node(d)` | Construye el nodo DOM del contrato A4 (794×1123 px, flex). Devuelve `{wrap, node}` |
| `captureA4(d, fmt, cb)` | Renderiza el A4 con html2canvas y devuelve dataURL de PNG o JPG vía `cb(err, dataURL)` |
| `savePDF(d, filename)` | Genera y descarga directamente el PDF usando html2canvas + jsPDF. Devuelve Promise |
| `buildDOCX(d)` | Rellena la plantilla Word con los datos del contrato. Devuelve Promise\<Blob\> |
| `buildICS(d)` | Genera el texto del archivo `.ics` para agregar el evento al calendario |

### Funciones de utilidad

| Función | Descripción |
|---|---|
| `todayISO()` | Fecha de hoy en formato `YYYY-MM-DD` |
| `fmtDate(iso)` | Convierte `YYYY-MM-DD` a `DD/mes/YYYY` en español |
| `f2(n)` | Formatea número como `$X.XX` |
| `xe(s)` | Escapa caracteres HTML (`&`, `<`, `>`) |
| `dlBlob(blob, name)` | Descarga un Blob como archivo |
| `dlDataURL(url, name)` | Descarga un dataURL como archivo |
| `pad2(n)` | Agrega cero inicial si el número es menor a 10 |
| `repPara(xml, pid, txt)` | Reemplaza el contenido de un párrafo en el XML del DOCX por su `paraId` |

---

## Estructura de un contrato (objeto JavaScript)

```js
{
  id:         "cv_1741234567890",   // ID único generado con newId()
  createdAt:  "2026-03-09T18:00:00.000Z",
  updatedAt:  "2026-03-09T18:05:00.000Z",
  cDate:      "2026-03-09",         // Fecha del contrato (YYYY-MM-DD)
  nombre:     "María González",
  tel:        "614 123 4567",
  dir:        "Calle Roble 123, Chihuahua",
  fEvento:    "2026-03-15",         // Fecha del evento
  hEntrega:   "10:00",              // Valor del select (HH:MM)
  hEntregaL:  "10:00 AM",          // Label del select (para exportar)
  hRecol:     "20:00",
  hRecolL:    "8:00 PM",
  traslado:   300,
  anticipo:   787.50,
  total:      3150,
  resta:      2362.50,
  items: [
    { qty: 2, price: 40,  amt: 80   },   // índice 0 → Mantel rectangular
    { qty: 0, price: 65,  amt: 0    },   // índice 1 → Mantel con camino
    // ... 13 elementos en total, uno por cada artículo del catálogo
    { qty: 1, price: 450, amt: 450  },   // índice 9 → BB Castillo Colors
    // ...
  ]
}
```

---

## Modificar el catálogo de artículos

Editar el array `ITEMS` al inicio de `shared.js`. Cada elemento tiene cuatro propiedades:

```js
{ desc: "Nombre del artículo", price: 100, pq: "XXXXXXXX", pa: "YYYYYYYY" }
```

- `desc` — nombre que aparece en el contrato y en la interfaz
- `price` — precio base en pesos (editable por contrato en el formulario)
- `pq` — `paraId` del párrafo de cantidad en el archivo Word original (no modificar)
- `pa` — `paraId` del párrafo de importe en el archivo Word original (no modificar)

> Si se agrega o elimina un artículo también hay que actualizar el array `ITEM_ABBREV` con la abreviación correspondiente para el título del evento ICS.

---

## Consideraciones de uso

**Almacenamiento local:** el historial en `localStorage` permanece en el dispositivo aunque se cierre el navegador, pero se borra si el usuario limpia los datos del sitio desde la configuración del navegador. Se recomienda activar Firebase para mayor seguridad.

**Exportación PDF en iOS:** Safari permite descargar el PDF directamente. Si el navegador del dispositivo no soporta la descarga directa de archivos, el PDF se abrirá en una pestaña nueva desde donde se puede guardar manualmente.

**Conexión a internet:** la app requiere conexión solo para cargar las fuentes de Google Fonts y los CDN de JSZip y html2canvas en la primera visita. Después de que el navegador las cachea, la app funciona sin conexión excepto para la sincronización con Firebase.

**Tamaño de shared.js:** el archivo pesa ~622 KB porque contiene el logo y la plantilla Word en base64. Este peso se transfiere una sola vez; el navegador lo cachea en visitas posteriores.

---

## Historial de versiones

| Versión | Cambios principales |
|---|---|
| v1–v3 | Versiones iniciales con arquitectura de archivo único |
| v4 | Reescritura completa. Arquitectura de 3 archivos (`shared.js`, `index.html`, `mobile.html`). Corrección de error crítico: `app.js` compartido causaba crash en móvil al referenciar elementos DOM de escritorio |
| v5 | Exportación unificada: `buildA4Node`, `captureA4` y `printA4` en `shared.js`. PNG/JPG/PDF idénticos en ambas versiones |
| v5.1 | Tabla de mobiliario muestra el catálogo completo en exportaciones. Precio unitario siempre visible. Título del evento ICS incluye resumen del mobiliario rentado |
| v6 | Storage compartido con Firebase Realtime Database. Nuevas funciones: `saveContract`, `deleteContract`, `onContractsChange`. UI de configuración Firebase en escritorio (modal) y móvil (bottom sheet) |
| v7 | Layout A4 completo: `height:1123px` con `flex-direction:column` y tabla expandible (`flex:1`). PDF descarga directa usando jsPDF sin diálogo de impresión del navegador |

---

*EVENTOS CASVEL © 2026 — Chihuahua, Chihuahua*

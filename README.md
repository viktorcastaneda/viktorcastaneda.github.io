# CASVEL – Gestor de Contratos de Alquiler

Webapp para gestionar contratos de alquiler de mobiliario para eventos. Funciona 100% en el navegador — sin servidor, sin base de datos externa.

## Características

- ✏️ Formulario de contrato en formato A4
- 💾 Historial de contratos guardado en el navegador (localStorage)
- 🔍 Búsqueda en tiempo real en el historial
- 📊 Dashboard con estadísticas
- ⬇️ Exportar en 4 formatos: **Word (.docx)**, **PDF**, **PNG**, **JPG**
- 📅 Exportar evento al calendario (.ics)
- 📅 Fechas en formato `dd/mmm/yyyy` en todos los formatos de exportación

## Archivos

```
casvel-app/
├── index.html   ← Interfaz completa de la webapp
└── app.js       ← Toda la lógica, datos y assets (logo + plantilla .docx)
```

## Despliegue en GitHub Pages

1. Crea un repositorio en GitHub (puede ser público o privado con Pages habilitado)
2. Sube los dos archivos: `index.html` y `app.js`
3. Ve a **Settings → Pages → Source → Deploy from a branch → main / root**
4. En unos minutos tu app estará en: `https://TU_USUARIO.github.io/TU_REPO/`

## Uso local

Simplemente abre `index.html` en cualquier navegador moderno.  
No requiere servidor web ni conexión a internet (después de la primera carga de fuentes).

## Notas técnicas

- Los datos se guardan en `localStorage` del navegador — son privados y locales al dispositivo
- El logo y la plantilla `.docx` están embebidos en `app.js` como base64
- Librerías usadas (CDN): JSZip 3.10.1, html2canvas 1.4.1, Google Fonts (DM Sans + Playfair Display)

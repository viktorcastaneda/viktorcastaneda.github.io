# CASVEL – Gestor de Contratos de Alquiler

Webapp para gestionar contratos de alquiler de mobiliario para eventos. Funciona 100% en el navegador — sin servidor, sin base de datos externa. **Completamente adaptada para iPhone y teléfonos móviles.**

## Archivos

```
casvel-app/
├── index.html    ← Desktop: sidebar + formulario A4
├── mobile.html   ← Móvil: wizard paso a paso para iPhone/Android
├── app.js        ← Lógica compartida + logo + plantilla .docx
└── README.md
```

## Despliegue en GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los 3 archivos: `index.html`, `mobile.html` y `app.js`
3. **Settings → Pages → Source → Deploy from a branch → main / root**
4. Tu app: `https://TU_USUARIO.github.io/TU_REPO/`

El dispositivo detecta automáticamente si es móvil o escritorio y redirige.

## Características

- ✏️ Formulario A4 para desktop / Wizard 5 pasos para móvil
- 💾 Historial compartido entre ambas versiones (localStorage)
- ⬇️ Exportar: Word (.docx), PDF, PNG, JPG
- 📅 Exportar al calendario (.ics), fechas en dd/mmm/yyyy

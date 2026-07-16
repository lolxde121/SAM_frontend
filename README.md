# SAM - Smart Apiary Monitoring (Frontend para Vercel)

Esta carpeta contiene una copia limpia y optimizada del frontend de **SAM**, lista para ser desplegada en **Vercel** de forma independiente del backend de Java.

## Contenido de esta carpeta

* `index.html`: La pantalla principal de inicio de sesión de SAM.
* `frontend/`: Todo el código de las interfaces de administración, apicultor, estilos CSS, scripts JS y archivos multimedia.
* `vercel.json`: Archivo de configuración de redireccionamiento de Vercel (Proxies/Rewrites).

---

## Cómo desplegar en Vercel

### Opción 1: Usando la CLI de Vercel (Rápido)

1. Abre tu terminal y navega hasta esta carpeta:
   ```bash
   cd /home/edgar/Descargas/SAM-smart-apiary-monitoring-/sam-frontend-vercel
   ```
2. Instala e inicia sesión en la CLI de Vercel si aún no lo has hecho:
   ```bash
   npm install -g vercel
   vercel login
   ```
3. Ejecuta el comando de despliegue:
   ```bash
   vercel
   ```
4. Sigue las instrucciones interactivas en pantalla. Selecciona desplegar la carpeta actual (`sam-frontend-vercel`).

### Opción 2: Conectar un repositorio de GitHub

1. Sube únicamente el contenido de esta carpeta (`sam-frontend-vercel`) a un nuevo repositorio en tu cuenta de GitHub.
2. Ve a tu panel de Vercel, haz clic en **"Add New"** > **"Project"** y selecciona tu repositorio.
3. Vercel detectará que es un sitio web estático (HTML/JS) y lo desplegará de inmediato.

---

## Configurar el Backend de Producción

Actualmente, las llamadas del frontend utilizan rutas relativas (ej. `/api/auth/login`). Para que Vercel redirija estas peticiones a tu backend real en producción (en lugar de `localhost`), edita el archivo [vercel.json](file:///home/edgar/Descargas/SAM-smart-apiary-monitoring-/sam-frontend-vercel/vercel.json):

Reemplaza `"http://localhost:7070"` con la URL donde tengas desplegado tu servidor de Java (ej. Render, Railway, AWS, VPS):

```json
{
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-backend-produccion.com/api/:path*"
    },
    {
      "source": "/alertas/:path*",
      "destination": "https://tu-backend-produccion.com/alertas/:path*"
    },
    ...
  ]
}
```

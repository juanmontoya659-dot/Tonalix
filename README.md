# Tonalix — Detección y cambio de tonalidad de audio

Aplicación web para **detectar la tonalidad musical de una canción, transponerla por semitonos, escuchar el audio original y el procesado, y descargar el resultado**.

Desarrollada con **React + TypeScript**, **NestJS** y un **motor de procesamiento de audio en Python/FastAPI**.

> **Estado del proyecto:** en desarrollo y pruebas de despliegue. La detección de tonalidad es una estimación y puede diferir de la tonalidad real, especialmente en grabaciones complejas.

## Funcionalidades

- Carga de archivos MP3, WAV, FLAC, M4A y MP4 (hasta **100 MB** en la configuración actual).
- Extracción del audio de archivos MP4 antes del análisis y procesamiento.
- Estimación de la tonalidad y el modo musical (mayor o menor).
- Transposición de **−6 a +6 semitonos**, manteniendo aproximadamente la duración original.
- Reproducción del audio original y del audio procesado desde el navegador.
- Descarga del resultado en formato MP3.
- Interfaz oscura y adaptable a computadores, tabletas y móviles.

## Tecnologías utilizadas

| Capa | Tecnologías |
| --- | --- |
| Frontend | React, TypeScript, Vite, CSS |
| API principal | NestJS, Node.js, Multer |
| Motor de audio | Python, FastAPI, librosa, NumPy, SoundFile |
| Conversión de archivos | FFmpeg mediante `imageio-ffmpeg` |
| Contenedores y despliegue | Docker, Docker Compose, Nginx, Render |

## Arquitectura

```text
Navegador
   |
   v
React / Vite (Nginx en Docker local; sitio estático en Render)
   |
   v
API NestJS :3000
   |
   v
Motor FastAPI :8000
   |-- Detección de tonalidad
   |-- Extracción de audio MP4
   |-- Transposición por semitonos
   `-- Codificación a MP3
```

El navegador se comunica con NestJS para cargar archivos y solicitar cambios de tonalidad. NestJS envía las tareas de procesamiento al servicio especializado de Python.

## Estructura del proyecto

```text
Tonalix/
├── frontend/          # Interfaz React + TypeScript
├── backend/           # API NestJS y archivos cargados
├── audio-engine/      # FastAPI, detección y transposición
├── docker-compose.yml
└── README.md
```

## Ejecución con Docker Compose

**Requisitos:** Docker Engine o Docker Desktop con Docker Compose.

Desde la raíz del repositorio, ejecuta:

```bash
docker compose up --build -d
```

Direcciones locales previstas en la configuración actual de Compose:

| Servicio | Dirección |
| --- | --- |
| Aplicación web | http://localhost:5173 |
| API NestJS | http://localhost:3000 |
| FastAPI | Red interna de Docker (`http://audio-engine:8000`) |

Para detener los servicios:

```bash
docker compose down
```

Para consultar los registros:

```bash
docker compose logs -f
```

> En la configuración orientada a producción, el puerto de FastAPI no se publica. Para acceder a Swagger durante el desarrollo, expón temporalmente `8000:8000` en el servicio `audio-engine` y abre `http://localhost:8000/docs`.

## Ejecución local sin Docker

Necesitas Node.js, Python y las dependencias del proyecto.

### 1. Motor de audio (Python)

Desde `audio-engine/`, en PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 2. Backend (NestJS)

En otra terminal, desde `backend/`, configura `AUDIO_ENGINE_URL=http://127.0.0.1:8000` y `FRONTEND_URL=http://localhost:5173` en el entorno de ejecución:

```bash
npm install
npm run start:dev
```

### 3. Frontend (React)

En otra terminal, desde `frontend/`, configura `VITE_BACKEND_URL=http://localhost:3000` antes de iniciar Vite:

```bash
npm install
npm run dev
```

Para desarrollo local, configura la URL del motor de audio en NestJS como `http://127.0.0.1:8000`. Dentro de Docker debe ser `http://audio-engine:8000`, mediante la variable `AUDIO_ENGINE_URL`.

## Variables de entorno

Los valores son ejemplos para los nombres de servicio y URLs indicados; ajusta las direcciones si Render asigna otras. Las variables `VITE_` son públicas y Vite las incorpora al **compilar** el frontend: nunca guardes claves privadas en ellas.

| Servicio | Variable | Docker Compose local | Render |
| --- | --- | --- | --- |
| Frontend | `VITE_BACKEND_URL` | `http://localhost:3000` | `https://tonalix-backend.onrender.com` |
| Backend | `FRONTEND_URL` | `http://localhost:5173` | `https://tonalix.onrender.com` |
| Backend | `AUDIO_ENGINE_URL` | `http://audio-engine:8000` | `https://tonalix-audio-engine.onrender.com` |
| Backend | `PORT` | `3000` | `3000` (o el puerto que se configure) |
| Audio-engine | `PORT` | `8000` | `8000` (debe coincidir con Uvicorn) |
| Audio-engine | `PYTHONUNBUFFERED` | `1` (opcional) | `1` (recomendado) |

En Docker local, `VITE_BACKEND_URL` debe enviarse durante la etapa de compilación del Dockerfile mediante `build.args` y `ARG`; un `environment` agregado al contenedor Nginx después de construir no cambia el JavaScript compilado. Las variables del backend pueden pasarse con `env_file: ./backend/.env` o con `environment` en Compose. El archivo `.env` no debe incorporarse a la imagen ni al repositorio.

## Despliegue en Render

La aplicación utiliza una configuración diferente de la ejecución local con Docker Compose:

| Servicio Render | Tipo | Configuración principal |
| --- | --- | --- |
| **Tonalix** | Static Site | Directorio raíz `frontend`, comando `npm ci && npm run build`, publicación `dist` |
| **Tonalix-backend** | Web Service con Docker | Directorio raíz `backend`, Dockerfile propio y variables para CORS y audio-engine |
| **Tonalix-audio-engine** | Web Service con Docker | Directorio raíz `audio-engine`, Dockerfile propio, FastAPI en `0.0.0.0:8000` |

1. Desplegar el **audio-engine** y verificar su endpoint `/health`.
2. Desplegar el **backend** configurando `AUDIO_ENGINE_URL` con la URL HTTPS del motor de audio y `FRONTEND_URL` con la dirección del sitio.
3. Desplegar el **frontend** como sitio estático con `VITE_BACKEND_URL` apuntando a la URL pública de NestJS.
4. En el Static Site, agregar una regla **Rewrite** de `/*` a `/index.html` para soportar las rutas de React Router al actualizar la página.
5. Probar la carga y el procesamiento de un archivo corto y revisar los logs de ambos servicios web.

**URL del frontend:** https://tonalix.onrender.com

> **Estado del despliegue:** la publicación del frontend y del backend se ha realizado; el motor de audio ha presentado fallos/reinicios durante el análisis en el plan gratuito. Por ello, el funcionamiento de principio a fin en Render está en validación y no debe considerarse garantizado. El análisis con librosa puede exceder los recursos disponibles para archivos largos.

> **Persistencia:** el almacenamiento local de los Web Services de Render puede perder archivos durante reinicios, suspensiones o nuevos despliegues. Los volúmenes de Docker Compose sirven para persistencia **local**, no se transfieren a Render. Para conservar audios en producción conviene usar almacenamiento externo.

## Despliegue con Docker Compose para la asignatura

El repositorio conserva los Dockerfile y `docker-compose.yml` para reproducir el proyecto localmente y demostrar los conceptos solicitados en Sistemas Operativos: creación de imágenes, ejecución de contenedores, puertos publicados, red interna, variables de entorno y volúmenes persistentes. El despliegue mediante Static Site y dos Web Services de Render **no reemplaza** la demostración de Docker Compose local.

## Endpoints de la API

### NestJS (`http://localhost:3000`)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/audio/upload` | Carga un audio y devuelve su análisis tonal |
| `POST` | `/audio/:storedFilename/transpose` | Genera una versión con la tonalidad modificada |

Para cargar un archivo, envía `multipart/form-data` con el campo `file`.

Ejemplo de solicitud de transposición:

```http
POST /audio/archivo-guardado.mp3/transpose
Content-Type: application/json

{
  "originalFilename": "cancion.mp3",
  "semitones": 2
}
```

### FastAPI (`http://audio-engine:8000` dentro de Docker)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Verifica el estado del servicio |
| `POST` | `/audio/analyze` | Analiza un archivo cargado |
| `POST` | `/audio/transpose` | Transpone un archivo (`file` y `semitones` en el formulario) |
| `GET` | `/audio/processed/{filename}` | Sirve un audio procesado |

## ¿Cómo funciona?

1. El usuario carga un archivo desde la interfaz de React.
2. NestJS lo almacena y solicita a FastAPI una estimación de su tonalidad.
3. El usuario selecciona cuántos semitonos desea subir o bajar.
4. FastAPI aplica el cambio de tono y exporta el resultado como MP3.
5. La pantalla de resultados muestra la tonalidad original y la tonalidad calculada, permite escuchar ambas versiones y ofrece la descarga del audio procesado.

## Consideraciones y limitaciones

- **La detección de tonalidad no es infalible.** El valor de correlación obtenido no representa un porcentaje de certeza calibrado.
- El cambio de tonalidad puede introducir artefactos, especialmente en voces, mezclas densas o desplazamientos grandes.
- Los archivos se almacenan actualmente de forma local (`uploads`, `temp` y `processed`). Para un servicio público hacen falta políticas de limpieza, límites de almacenamiento, autenticación o protección frente a abuso, límites de solicitudes y validación del contenido real mediante FFmpeg, sin confiar únicamente en la extensión.
- La entrega de los audios procesados debe utilizar una URL pública HTTPS válida. Si se sirve a través de NestJS, verifica que la descarga y reproducción funcionen en producción; una dirección `localhost` devuelta al navegador no funcionará desde equipos externos.
- El procesamiento de archivos grandes puede consumir bastante CPU y memoria. Una cola de trabajos en segundo plano es una mejora prevista.
- Utiliza únicamente archivos de audio que tengas permiso para procesar.

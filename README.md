# JazzOne Music Pipeline

> **Frontend**: Next.js (Vercel) · **Backend**: FastAPI + yt-dlp (NAS Synology)

## Arquitectura

```
┌──────────────────────────────────────────────┐
│            Vercel (Next.js)                   │
│  pipeline.jazzone.click (frontend SPA)        │
│  → consumo de API del backend existente       │
└──────────────────┬───────────────────────────┘
                   │ HTTPS
┌──────────────────▼───────────────────────────┐
│        NAS Synology DS920+ (Docker)           │
│  ┌────────────────────────────────────────┐   │
│  │  yt-pipeline (FastAPI 3.11)            │   │
│  │  → yt-dlp + ffmpeg + detección artista │   │
│  │  → 18 endpoints REST                   │   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │  Navidrome (servidor música)           │   │
│  │  → navidrome.jazzone.click             │   │
│  └────────────────────────────────────────┘   │
│  Cloudflare tunnel expone ambos               │
└───────────────────────────────────────────────┘
```

## Frontend (este repo)

- **Next.js 16** + TypeScript + Tailwind CSS
- SPA con 5 vistas: Biblioteca, Descargar, Importar, Fuentes, Gestionar
- Consume la API del backend en `https://pipeline.jazzone.click/api/...`
- Desplegado en Vercel

### Estructura

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark, JetBrains Mono, Material Symbols)
│   ├── page.tsx            # SPA principal con view switching
│   └── globals.css         # Estilos globales + glassmorphism
├── components/
│   ├── Layout/             # TopBar, BottomNav, SearchOverlay, ViewContainer
│   ├── Library/            # AlbumCard, AlbumModal, LibraryFilters, LibraryView
│   ├── Download/           # DownloadView, PlaylistModal
│   ├── Import/             # ImportView
│   ├── Sources/            # SourcesView
│   ├── Manage/             # ManageView
│   ├── Toast.tsx           # Notificaciones toast
│   ├── MiniPlayer.tsx      # Reproductor de audio
│   └── LogViewer.tsx       # Visor de logs del pipeline
└── lib/
    ├── types.ts             # Tipos TypeScript
    └── api.ts               # API client (todos los endpoints)
```

## Backend (referencia en `/backend/`)

El backend corre en el NAS Synology y NO se modifica. Está incluido como referencia.

### Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/library` | Listar álbumes |
| GET | `/api/library/{name}/tracks` | Tracks de un álbum |
| DELETE | `/api/library/delete-album` | Borrar álbum |
| GET | `/api/library/download-all` | Descargar ZIP |
| GET | `/api/cover/{name}` | Portada del álbum |
| POST | `/api/download` | Descargar de YouTube |
| POST | `/api/playlist/preview` | Previsualizar playlist |
| GET | `/api/status/{job_id}` | Estado de descarga |
| GET | `/api/jobs` | Listar procesos |
| POST | `/api/jobs/clear` | Limpiar procesos |
| POST | `/api/cleanup-stale` | Limpiar álbumes fantasma |
| POST | `/api/rescan` | Rescanear Navidrome |
| GET | `/api/logs` | Logs del pipeline |
| POST | `/api/import/upload` | Subir archivos |
| GET | `/api/import/browse` | Explorar carpetas |

## Desarrollo local

```bash
# Instalar
npm install

# Desarrollar (apunta a pipeline.jazzone.click por defecto)
npm run dev

# Build
npm run build
```

Variables de entorno:
- `NEXT_PUBLIC_API_URL` — URL base de la API (default: `https://pipeline.jazzone.click`)

## Despliegue

El frontend se despliega automáticamente en Vercel desde `main`.

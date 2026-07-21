"use client";

import type { ViewType } from "@/lib/types";

interface SourcesViewProps {
  onSwitchView: (view: ViewType) => void;
}

interface SourceCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

export default function SourcesView({ onSwitchView }: SourcesViewProps) {
  const sourceCards: SourceCard[] = [
    {
      id: "youtube",
      icon: "smart_display",
      title: "YouTube / YouTube Music",
      description:
        "Descarga desde cualquier enlace de YouTube o YouTube Music. Soporta listas de reproducción, álbumes completos y videos individuales.",
      action: () => onSwitchView("download"),
      color: "text-red-400 bg-red-600/10",
    },
    {
      id: "soundcloud",
      icon: "audiotrack",
      title: "SoundCloud",
      description:
        "Importa pistas y playlists desde SoundCloud. Incluye metadatos y artwork cuando están disponibles.",
      action: () => onSwitchView("download"),
      color: "text-orange-400 bg-orange-600/10",
    },
    {
      id: "bandcamp",
      icon: "music_note",
      title: "Bandcamp",
      description:
        "Descarga música comprada en Bandcamp. Soporta álbumes completos con todas las pistas y artwork.",
      action: () => onSwitchView("download"),
      color: "text-cyan-400 bg-cyan-600/10",
    },
    {
      id: "direct-url",
      icon: "link",
      title: "URL Directa",
      description:
        "Descarga desde URLs directas de archivos de audio. Compatible con MP3, FLAC, M4A, OGG y más.",
      action: () => onSwitchView("download"),
      color: "text-indigo-400 bg-indigo-600/10",
    },
    {
      id: "upload",
      icon: "upload_file",
      title: "Subir Archivos",
      description:
        "Importa música directamente desde tu Mac. Arrastra archivos o carpetas completas con estructura de álbumes.",
      action: () => onSwitchView("import"),
      color: "text-emerald-400 bg-emerald-600/10",
    },
    {
      id: "nas",
      icon: "folder",
      title: "NAS / Synology",
      description:
        "Explora archivos de música desde tu NAS Synology o servidor de red local. Selecciona carpetas para importar.",
      action: () => onSwitchView("import"),
      color: "text-violet-400 bg-violet-600/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-zinc-900/60 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-600/20">
          <span className="material-symbols-outlined text-3xl text-amber-400">
            source
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Fuentes de Música</h2>
        <p className="max-w-md text-sm text-zinc-400">
          Elige cómo quieres importar música a tu biblioteca. Soporte para
          múltiples fuentes y formatos.
        </p>
      </div>

      {/* Source Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sourceCards.map((card) => (
          <button
            key={card.id}
            onClick={card.action}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-left backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-zinc-900/50"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {card.icon}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-indigo-300">
                {card.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {card.description}
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors group-hover:text-indigo-400">
              <span>Ir a {card.id === "upload" || card.id === "nas" ? "Import" : "Download"}</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Informational Footer */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-base text-zinc-500">
            lightbulb
          </span>
          <div className="text-xs text-zinc-500 leading-relaxed">
            <p className="font-medium text-zinc-400 mb-1">¿No encuentras tu fuente?</p>
            <p>
              La opción <strong className="text-zinc-300">Subir Archivos</strong> te permite
              importar música desde cualquier ubicación de tu Mac. También
              puedes explorar carpetas de red si tu NAS está montado en el
              sistema de archivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

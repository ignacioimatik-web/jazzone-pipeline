"use client";

import type { ViewType } from "@/lib/types";

interface SourcesViewProps {
  onSwitchView: (view: ViewType) => void;
}

export default function SourcesView({ onSwitchView }: SourcesViewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined text-6xl text-[#ebb2ff] mb-4" style={{ fontSize: "64px" }}>explore</span>
        <h2 className="text-[40px] font-bold text-[#e5e2e1] mb-2 leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Fuentes de Audio
        </h2>
        <p className="text-[14px] text-[#d4c0d7]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Elige de dónde quieres añadir música
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-red-400" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>YouTube</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Videos, listas y mixes. Con selección previa de tracks y detección automática de artista.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('https://youtube.com','_blank')} className="flex-1 px-3 py-2 rounded-lg bg-[#bc13fe]/20 text-[#bc13fe] text-[12px] font-bold uppercase tracking-wider hover:bg-[#bc13fe]/30 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Abrir YouTube</button>
            <button onClick={() => onSwitchView("download")} className="flex-1 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] text-[12px] hover:text-[#ebb2ff] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Descargar</button>
          </div>
        </div>

        {/* SoundCloud */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-orange-400" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>audiotrack</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SoundCloud</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Enlaces a tracks y sets. Se pegan en Descargar, el pipeline extrae el audio.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('https://soundcloud.com','_blank')} className="flex-1 px-3 py-2 rounded-lg bg-orange-400/10 text-orange-400 text-[12px] font-bold uppercase tracking-wider hover:bg-orange-400/20 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Abrir SoundCloud</button>
            <button onClick={() => onSwitchView("download")} className="flex-1 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] text-[12px] hover:text-[#ebb2ff] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Descargar</button>
          </div>
        </div>

        {/* Bandcamp */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-green-400" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>music_note</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Bandcamp</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Álbumes y tracks individuales. Pega el enlace en Descargar.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('https://bandcamp.com','_blank')} className="flex-1 px-3 py-2 rounded-lg bg-green-400/10 text-green-400 text-[12px] font-bold uppercase tracking-wider hover:bg-green-400/20 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Abrir Bandcamp</button>
            <button onClick={() => onSwitchView("download")} className="flex-1 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] text-[12px] hover:text-[#ebb2ff] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Descargar</button>
          </div>
        </div>

        {/* URL Directa */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-blue-400" style={{ fontSize: "40px" }}>link</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>URL Directa</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Enlace directo a MP3, M4A, FLAC. Pégalo en Descargar para importarlo.</p>
            </div>
          </div>
          <button onClick={() => onSwitchView("download")} className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] text-[12px] hover:text-[#ebb2ff] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Descargar</button>
        </div>

        {/* Subir archivos */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-[#00f1fe]" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Subir archivos</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Arrastra carpetas o archivos de música desde tu Mac. Se importan automáticamente a Navidrome.</p>
            </div>
          </div>
          <button onClick={() => onSwitchView("import")} className="w-full px-3 py-2 rounded-lg bg-[#00f1fe]/10 text-[#00f1fe] text-[12px] font-bold uppercase tracking-wider hover:bg-[#00f1fe]/20 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Importar</button>
        </div>

        {/* NAS / Synology */}
        <div className="glass-card p-5 rounded-2xl transition-all cursor-default">
          <div className="flex items-start gap-4 mb-3">
            <span className="material-symbols-outlined text-4xl text-[#c6c6c7]" style={{ fontSize: "40px" }}>folder</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-semibold text-[#e5e2e1]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>NAS / Synology</h3>
              <p className="text-[14px] text-[#d4c0d7] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Explora las carpetas del NAS, discos USB y externos. Importa música directamente desde el servidor.</p>
            </div>
          </div>
          <button onClick={() => onSwitchView("import")} className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] text-[12px] hover:text-[#ebb2ff] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>Ir a Importar</button>
        </div>
      </div>

      {/* Tip footer */}
      <div className="glass-card p-5 rounded-2xl mt-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#bc13fe]">lightbulb</span>
          <p className="text-[14px] text-[#d4c0d7]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Todos los enlaces se pegan en la pestaña <strong>Descargar</strong>. El pipeline soporta yt-dlp, lo que permite extraer audio de cientos de sitios web.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import type { ViewType } from "@/lib/types";
import { startDownload } from "@/lib/api";

interface DownloadViewProps {
  onSwitchView: (view: ViewType) => void;
  onOpenLogs: () => void;
  showToast?: (msg: string) => void;
}

export default function DownloadView({
  onSwitchView,
  onOpenLogs,
}: DownloadViewProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const result = await startDownload(url.trim(), []);
      alert(`Job iniciado: ${result.job_id}`);
      setUrl("");
    } catch (e: unknown) {
      alert(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="download-hero-icon mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: "72px", background: "linear-gradient(135deg,#bc13fe,#00f1fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            download
          </span>
        </div>
        <h2 className="text-[40px] font-bold text-[#e5e2e1] mb-2 leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Descargar Música
        </h2>
        <p className="text-[14px] text-[#d4c0d7]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Pega un enlace de YouTube — video individual o lista de reproducción
        </p>
      </div>

      {/* URL Input Card */}
      <div className="glass-card p-6 md:p-8 rounded-2xl mb-6">
        <div className="relative w-full mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d4c0d7]">link</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#bc13fe] focus:border-[#bc13fe] transition-all outline-none text-[14px] text-[#e5e2e1] placeholder:text-[#d4c0d7]/50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            autoComplete="off"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={!url.trim() || loading}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#bc13fe] to-purple-700 text-white font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-3 hover:opacity-90 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", boxShadow: "0 0 20px -5px rgba(188,19,254,0.4)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>download</span>
          {loading ? "Procesando..." : "Descargar y Segmentar"}
        </button>
        <p className="text-[10px] text-[#d4c0d7]/50 text-center mt-3">
          Los tracks de listas se agrupan en un solo álbum · Las playlists muestran selección previa
        </p>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-5 rounded-2xl mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-sm text-[#d4c0d7]">build</span>
          <span className="text-[12px] font-bold text-[#d4c0d7] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            Acciones rápidas
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => {}}
            className="tool-btn justify-center"
          >
            <span className="material-symbols-outlined text-[#bc13fe]">cleaning_services</span>
            <span>Limpiar Fantasmas</span>
          </button>
          <button
            onClick={() => {}}
            className="tool-btn justify-center"
          >
            <span className="material-symbols-outlined text-[#00f1fe]">refresh</span>
            <span>Rescan Navidrome</span>
          </button>
          <button
            onClick={onOpenLogs}
            className="tool-btn justify-center"
          >
            <span className="material-symbols-outlined text-yellow-400">bug_report</span>
            <span>Ver Logs</span>
          </button>
          <button
            onClick={() => onSwitchView("manage")}
            className="tool-btn justify-center danger"
          >
            <span className="material-symbols-outlined text-red-400">delete</span>
            <span>Borrar Álbumes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ViewType, LibraryAlbum, SystemInfo, LogsResponse } from "@/lib/types";
import {
  getLibrary,
  getSystemInfo,
  deleteAlbum,
  cleanupStaleAlbums,
  rescanNavidrome,
  getLogs,
} from "@/lib/api";

interface ManageViewProps {
  onSwitchView: (view: ViewType) => void;
  showToast: (msg: string) => void;
}

export default function ManageView({
  onSwitchView: _onSwitchView,
  showToast,
}: ManageViewProps) {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(
    null
  );
  const [deletingAlbum, setDeletingAlbum] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [lib, sys] = await Promise.all([
          getLibrary(),
          getSystemInfo(),
        ]);
        setAlbums(lib.albums || []);
        setSystemInfo(sys);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredAlbums = albums.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCleanup = useCallback(async () => {
    setMaintenanceLoading("cleanup");
    try {
      const result = await cleanupStaleAlbums();
      showToast(
        `🧹 Cleanup: ${result.status}${result.detail ? " — " + result.detail : ""}`
      );
    } catch (err: unknown) {
      showToast(
        `❌ Cleanup failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setMaintenanceLoading(null);
    }
  }, [showToast]);

  const handleRescan = useCallback(async () => {
    setMaintenanceLoading("rescan");
    try {
      const result = await rescanNavidrome();
      showToast(`🔄 Rescan: ${result.status}`);
    } catch (err: unknown) {
      showToast(
        `❌ Rescan failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setMaintenanceLoading(null);
    }
  }, [showToast]);

  const handleViewLogs = useCallback(async () => {
    setMaintenanceLoading("logs");
    try {
      const logsData = await getLogs(100);
      setLogs(logsData);
      setShowLogs(true);
    } catch (err: unknown) {
      showToast(
        `❌ Failed to load logs: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setMaintenanceLoading(null);
    }
  }, [showToast]);

  const handleDeleteAlbum = useCallback(
    async (albumName: string) => {
      if (
        !window.confirm(
          `¿Estás seguro de que quieres borrar "${albumName}"?\nEsta acción no se puede deshacer.`
        )
      ) {
        return;
      }
      setDeletingAlbum(albumName);
      try {
        await deleteAlbum(albumName);
        setAlbums((prev) => prev.filter((a) => a.name !== albumName));
        showToast(`🗑️ "${albumName}" deleted`);
      } catch (err: unknown) {
        showToast(
          `❌ Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setDeletingAlbum(null);
      }
    },
    [showToast]
  );

  // Status color helper
  const navidromeColor = {
    connected: "text-emerald-400",
    disconnected: "text-zinc-500",
    error: "text-red-400",
  } as const;

  const navidromeDot = {
    connected: "bg-emerald-500",
    disconnected: "bg-zinc-500",
    error: "bg-red-500",
  } as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-indigo-400">
            progress_activity
          </span>
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <span className="material-symbols-outlined text-4xl text-red-400">
          error
        </span>
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-zinc-900/60 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-600/20">
          <span className="material-symbols-outlined text-3xl text-zinc-400">
            manage_search
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Manage</h2>
        <p className="max-w-md text-sm text-zinc-400">
          Administra tu biblioteca musical. Limpia álbumes huérfanos, rescannea
          Navidrome, revisa logs y borra álbumes.
        </p>
      </div>

      {/* System Info */}
      {systemInfo && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-5 py-4 backdrop-blur-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <span className="material-symbols-outlined text-base">
              monitoring
            </span>
            Sistema
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Versión
              </p>
              <p className="text-sm font-semibold text-white">
                {systemInfo.version}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Álbumes
              </p>
              <p className="text-sm font-semibold text-white">
                {systemInfo.totalAlbums}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Tracks
              </p>
              <p className="text-sm font-semibold text-white">
                {systemInfo.totalTracks}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Active Jobs
              </p>
              <p className="text-sm font-semibold text-white">
                {systemInfo.activeJobs}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${navidromeDot[systemInfo.navidromeStatus]}`}
            />
            <span className={navidromeColor[systemInfo.navidromeStatus]}>
              Navidrome: {systemInfo.navidromeStatus}
            </span>
          </div>
        </div>
      )}

      {/* Maintenance */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-5 py-4 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <span className="material-symbols-outlined text-base">
            build
          </span>
          Mantenimiento
        </h3>
        <div className="flex flex-col gap-3">
          {/* Cleanup */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Limpiar Fantasmas</p>
              <p className="text-xs text-zinc-500">
                Elimina álbumes huérfanos del servidor que ya no tienen
                archivos de música.
              </p>
            </div>
            <button
              onClick={handleCleanup}
              disabled={maintenanceLoading === "cleanup"}
              className="ml-3 shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {maintenanceLoading === "cleanup" ? (
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
              ) : (
                "Ejecutar"
              )}
            </button>
          </div>

          {/* Rescan */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Rescan Navidrome</p>
              <p className="text-xs text-zinc-500">
                Refresca la biblioteca de Navidrome para reflejar cambios
                recientes en el sistema de archivos.
              </p>
            </div>
            <button
              onClick={handleRescan}
              disabled={maintenanceLoading === "rescan"}
              className="ml-3 shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {maintenanceLoading === "rescan" ? (
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
              ) : (
                "Ejecutar"
              )}
            </button>
          </div>

          {/* Logs */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Ver Logs</p>
              <p className="text-xs text-zinc-500">
                Revisa los logs del servidor para diagnosticar problemas.
                Muestra las últimas 100 líneas.
              </p>
            </div>
            <button
              onClick={handleViewLogs}
              disabled={maintenanceLoading === "logs"}
              className="ml-3 shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {maintenanceLoading === "logs" ? (
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
              ) : (
                "Ver"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Viewer */}
      {showLogs && logs && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-5 py-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
              <span className="material-symbols-outlined text-base">
                description
              </span>
              Logs ({logs.total_lines} líneas, mostrando {logs.returned})
            </h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cerrar
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-black/50 p-3 font-mono text-xs leading-relaxed text-zinc-400">
            {logs.logs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))}
          </pre>
        </div>
      )}

      {/* Delete Albums */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-5 py-4 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <span className="material-symbols-outlined text-base">
            delete_sweep
          </span>
          Borrar Álbumes
        </h3>

        {/* Search */}
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition-colors focus-within:border-red-500/50">
          <span className="material-symbols-outlined text-sm text-zinc-500">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar álbum para borrar..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-zinc-300"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Album List */}
        {filteredAlbums.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-600">
            {searchQuery
              ? `No albums match "${searchQuery}"`
              : "No albums in library"}
          </div>
        ) : (
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {filteredAlbums.map((album) => (
              <div
                key={album.name}
                className="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-3 py-2 transition-colors hover:border-red-900/30 hover:bg-red-950/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{album.name}</p>
                  <p className="text-xs text-zinc-500">
                    {album.track_count} track{album.track_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAlbum(album.name)}
                  disabled={deletingAlbum === album.name}
                  className="ml-2 shrink-0 rounded-lg bg-red-900/30 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-800/40 hover:text-red-300 disabled:opacity-50"
                >
                  {deletingAlbum === album.name ? (
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>
                  ) : (
                    "Borrar"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

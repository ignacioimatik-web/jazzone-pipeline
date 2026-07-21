"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ViewType, Job, PlaylistPreview } from "@/lib/types";
import {
  previewPlaylist,
  startDownload,
  getJobs,
  clearJobs,
  cleanupStaleAlbums,
  rescanNavidrome,
  getLogs,
} from "@/lib/api";
import PlaylistModal from "./PlaylistModal";

interface DownloadViewProps {
  onSwitchView: (view: ViewType) => void;
  onOpenLogs: () => void;
  showToast?: (msg: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const statusIcon: Record<Job["status"], string> = {
  queued: "🔄",
  downloading: "🔄",
  processing: "🔄",
  completed: "✅",
  error: "❌",
};

const statusLabel: Record<Job["status"], string> = {
  queued: "Queued",
  downloading: "Downloading",
  processing: "Processing",
  completed: "Completed",
  error: "Error",
};

export default function DownloadView({
  onSwitchView,
  onOpenLogs,
}: DownloadViewProps) {
  const [url, setUrl] = useState("");
  const [playlistPreview, setPlaylistPreview] =
    useState<PlaylistPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    jobId: string;
    message: string;
    progress: number;
  } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Poll jobs every 1.5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getJobs();
        setJobs(res.jobs || []);
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, []);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleDownload = useCallback(
    async (selectedIds?: string[]) => {
      if (!url.trim()) return;
      setError(null);
      setLoading(true);

      try {
        const ac = new AbortController();
        abortRef.current = ac;

        const preview = await previewPlaylist(url.trim(), ac.signal);
        const ids = selectedIds ?? preview.entries.map((e) => e.id);

        if (preview.entries.length > 1 && !selectedIds) {
          // Show the modal
          setPlaylistPreview(preview);
          setShowPreview(true);
          setLoading(false);
          return;
        }

        // Download directly
        const result = await startDownload(url.trim(), ids);
        setProgress({
          jobId: result.job_id,
          message: "Download started…",
          progress: 0,
        });
        setUrl("");
        setPlaylistPreview(null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Request timed out. The URL may be invalid or unreachable.");
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to start download"
          );
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [url]
  );

  const handleConfirmPlaylist = useCallback(
    async (_url: string, selectedIds: string[]) => {
      setShowPreview(false);
      setLoading(true);
      setError(null);

      try {
        const result = await startDownload(url.trim(), selectedIds);
        setProgress({
          jobId: result.job_id,
          message: "Download started…",
          progress: 0,
        });
        setUrl("");
        setPlaylistPreview(null);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to start download"
        );
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  const handleClearJobs = async () => {
    try {
      await clearJobs();
      setJobs([]);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-zinc-900/60 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/20">
          <span className="material-symbols-outlined text-3xl text-indigo-400">
            download
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Descargar Música</h2>
        <p className="max-w-md text-sm text-zinc-400">
          Pega un enlace de YouTube, SoundCloud, Bandcamp o una URL directa para
          descargar y segmentar automáticamente.
        </p>
      </div>

      {/* URL Input */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 backdrop-blur-sm transition-colors focus-within:border-indigo-500/50">
          <span className="material-symbols-outlined text-zinc-500">link</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) handleDownload();
            }}
            placeholder="https://music.youtube.com/…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
          {url && (
            <button
              onClick={() => setUrl("")}
              className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
              aria-label="Clear URL"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <button
          onClick={() => handleDownload()}
          disabled={!url.trim() || loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
              Previewing…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">
                file_download
              </span>
              Descargar y Segmentar
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-red-400">
            error
          </span>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto shrink-0 text-red-400 hover:text-red-200"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-indigo-400">
              progress_activity
            </span>
            <span className="text-sm text-zinc-300">{progress.message}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(progress.progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">Job ID: {progress.jobId}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={async () => {
              try {
                const r = await cleanupStaleAlbums();
                alert(`Cleanup: ${r.status}${r.detail ? " - " + r.detail : ""}`);
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Cleanup failed");
              }
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">cleaning</span>
            Limpiar Fantasmas
          </button>
          <button
            onClick={async () => {
              try {
                const r = await rescanNavidrome();
                alert(`Rescan: ${r.status}`);
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Rescan failed");
              }
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">
              sync
            </span>
            Rescan Navidrome
          </button>
          <button
            onClick={onOpenLogs}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">
              description
            </span>
            Logs
          </button>
          <button
            onClick={() => onSwitchView("manage")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">
              delete_sweep
            </span>
            Borrar Álbumes
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Jobs
          </h3>
          {jobs.length > 0 && (
            <button
              onClick={handleClearJobs}
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-8 text-center text-sm text-zinc-600">
            No jobs yet. Paste a URL above to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 backdrop-blur-sm"
              >
                <span className="text-lg">{statusIcon[job.status]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {job.message || job.url}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {statusLabel[job.status]}
                    {job.status === "completed" && job.tracks
                      ? ` · ${job.tracks.length} track${job.tracks.length !== 1 ? "s" : ""}`
                      : ""}
                    {job.error ? ` · ${job.error}` : ""}
                  </p>
                  {/* Mini progress bar for active jobs */}
                  {(job.status === "downloading" ||
                    job.status === "processing") && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.min(job.progress, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Preview Modal */}
      {showPreview && playlistPreview && (
        <PlaylistModal
          data={playlistPreview}
          onClose={() => {
            setShowPreview(false);
            setPlaylistPreview(null);
          }}
          onConfirm={handleConfirmPlaylist}
        />
      )}
    </div>
  );
}

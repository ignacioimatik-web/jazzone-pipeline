"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import type { ViewType, UploadResponse } from "@/lib/types";
import { uploadFiles } from "@/lib/api";

const ACCEPTED_FORMATS = ".mp3,.m4a,.flac,.ogg,.wav,.wma,.aac,.opus";
const FORMAT_LABELS = ["mp3", "m4a", "flac", "ogg", "wav", "wma", "aac", "opus"];
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

interface ImportViewProps {
  onSwitchView: (view: ViewType) => void;
  showToast?: (msg: string) => void;
}

export default function ImportView({ onSwitchView, showToast }: ImportViewProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    setResult(null);
    setError(null);
    const valid = Array.from(fileList).filter((f) =>
      FORMAT_LABELS.some((ext) => f.name.toLowerCase().endsWith(`.${ext}`))
    );
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  }, []);

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const ac = new AbortController();
    abortRef.current = ac;
    const timeoutId = setTimeout(() => ac.abort(), UPLOAD_TIMEOUT_MS);

    // Animate progress since fetch doesn't give real %
    const prog = setInterval(() => setProgress((p) => Math.min(p + 0.08, 0.9)), 400);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await uploadFiles(formData, ac.signal);
      clearInterval(prog);
      clearTimeout(timeoutId);
      setProgress(1);
      setResult(res);
      showToast?.(`✅ ${res.tracks} tracks imported (${res.album_count} albums)`);
      setFiles([]);
    } catch (err: unknown) {
      clearInterval(prog);
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Upload timed out after 5 minutes.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  }, [files, showToast]);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-zinc-900/60 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20">
          <span className="material-symbols-outlined text-3xl text-emerald-400">
            upload_file
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Importar Música</h2>
        <p className="max-w-md text-sm text-zinc-400">
          Arrastra archivos de música o selecciona una carpeta para importar
          desde tu Mac. Formatos: MP3, M4A, FLAC, OGG, WAV, WMA, AAC, OPUS.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
          dragging
            ? "border-emerald-500/70 bg-emerald-500/10"
            : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/40"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-4xl text-emerald-400">
              progress_activity
            </span>
            <p className="text-sm text-zinc-300">Subiendo archivos...</p>
            <div className="h-2 w-64 max-w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10">
              <span className="material-symbols-outlined text-4xl text-emerald-400">
                cloud_upload
              </span>
            </div>
            <div>
              <p className="text-base font-medium text-zinc-200">
                Arrastra archivos aquí
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                o haz clic para seleccionar archivos o carpetas
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_FORMATS}
              onChange={handleInputChange}
              className="hidden"
            />
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-500">
              MP3 · M4A · FLAC · OGG · WAV · WMA · AAC · OPUS
            </span>
          </div>
        )}
      </div>

      {/* Selected Files Chips */}
      {files.length > 0 && !uploading && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            {files.length} archivo{files.length !== 1 ? "s" : ""} seleccionado{files.length !== 1 ? "s" : ""}
          </h3>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <span
                key={f.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
              >
                {f.name}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  className="text-zinc-500 hover:text-white"
                  aria-label={`Remove ${f.name}`}
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Subir {files.length} archivo{files.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-red-400">error</span>
          <p className="flex-1 text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-200" aria-label="Dismiss">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <h3 className="font-semibold text-emerald-300">Importación Completa</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-xs text-zinc-500">Tracks</p>
              <p className="text-lg font-bold text-white">{result.tracks}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-xs text-zinc-500">Álbumes</p>
              <p className="text-lg font-bold text-white">{result.album_count}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-xs text-zinc-500">Rescan</p>
              <p className="text-lg font-bold text-white">{result.rescan ? "Sí" : "No"}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <p className="text-xs text-zinc-500">Errors</p>
              <p className="text-lg font-bold text-white">{result.errors?.length || 0}</p>
            </div>
          </div>
          {result.albums && result.albums.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-zinc-500">Álbumes importados:</p>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {result.albums.map((a) => (
                  <span key={a} className="rounded-md bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-300">{a}</span>
                ))}
              </div>
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-red-400">Errors:</p>
              <ul className="max-h-24 space-y-0.5 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-300">{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => { setResult(null); setError(null); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              Importar más
            </button>
            <button onClick={() => onSwitchView("library")} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
              Ir a Biblioteca
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <span className="material-symbols-outlined text-base">info</span>
          Tips
        </h3>
        <ul className="space-y-1 text-xs text-zinc-500">
          <li>• Usa una carpeta con estructura de álbumes para mejores resultados.</li>
          <li>• Archivos soportados: {FORMAT_LABELS.map((f) => f.toUpperCase()).join(", ")}.</li>
          <li>• La importación se procesa en el servidor y se rescanea automáticamente.</li>
          <li>• Timeout de 5 minutos para archivos grandes.</li>
        </ul>
      </div>
    </div>
  );
}

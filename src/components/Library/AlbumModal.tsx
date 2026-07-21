"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAlbumTracks, getCoverUrl, getTrackUrl, deleteAlbum } from "@/lib/api";
import type { AlbumTracksResponse } from "@/lib/types";

interface AlbumModalProps {
  albumName: string | null;
  onClose: () => void;
  onPlay: (album: string, track: string) => void;
  onDownload: (album: string, track: string) => void;
  onDelete: (album: string) => void;
  onDownloadZip: (album: string) => void;
}

export default function AlbumModal({
  albumName,
  onClose,
  onPlay,
  onDownload,
  onDelete,
  onDownloadZip,
}: AlbumModalProps) {
  const [data, setData] = useState<AlbumTracksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = data === null && error === null;

  useEffect(() => {
    if (!albumName) return;
    let cancelled = false;
    getAlbumTracks(albumName)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load tracks");
          setData(null);
        }
      });
    return () => { cancelled = true; };
  }, [albumName]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (albumName) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [albumName, onClose]);

  if (!albumName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0A0A] sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-5 py-4">
          <h2 className="truncate text-lg font-semibold text-[#e5e2e1]">
            {albumName}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#d4c0d7] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#bc13fe] border-t-transparent" />
              <p className="text-sm text-[#d4c0d7]">Loading tracks...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16">
              <span className="mb-2 text-3xl">⚠️</span>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Album Info */}
              <div className="mb-5 flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={getCoverUrl(albumName)}
                    alt={albumName}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      el.parentElement!.classList.add(
                        "flex",
                        "items-center",
                        "justify-center",
                        "bg-zinc-800/50",
                        "text-3xl"
                      );
                      el.parentElement!.textContent = "🎵";
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-[#d4c0d7]">
                    {data.tracks.length}{" "}
                    {data.tracks.length === 1 ? "track" : "tracks"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-5 flex gap-2">
                <button
                  onClick={() => onDownloadZip(albumName)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-medium text-[#e5e2e1] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Download ZIP
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteAlbum(albumName);
                      onDelete(albumName);
                      onClose();
                    } catch {
                      // parent handles error feedback
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete
                </button>
              </div>

              {/* Track List */}
              <div className="space-y-1">
                {data.tracks.map((track, i) => (
                  <div
                    key={track}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <span className="w-6 text-right text-xs font-medium text-[#d4c0d7]">
                      {i + 1}
                    </span>
                    <span
                      className="flex-1 truncate text-sm text-[#e5e2e1]"
                      title={track}
                    >
                      {track}
                    </span>
                    <button
                      onClick={() => onPlay(albumName, track)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#d4c0d7] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#bc13fe]"
                      title="Play track"
                    >
                      <span className="material-symbols-outlined text-lg">
                        play_arrow
                      </span>
                    </button>
                    <a
                      href={getTrackUrl(albumName, track)}
                      download
                      onClick={(e) => {
                        e.preventDefault();
                        onDownload(albumName, track);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#d4c0d7] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#bc13fe]"
                      title="Download track"
                    >
                      <span className="material-symbols-outlined text-lg">
                        download
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlaylistPreview, PlaylistEntry } from "@/lib/types";

interface PlaylistModalProps {
  data: PlaylistPreview | null;
  onClose: () => void;
  onConfirm: (url: string, selectedIds: string[]) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaylistModal({
  data,
  onClose,
  onConfirm,
}: PlaylistModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(data ? data.entries.map((e) => e.id) : [])
  );

  // Reset selection when data changes
  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(new Set(data.entries.map((e) => e.id)));
    }
  }, [data]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const allSelected = data
    ? data.entries.length > 0 && selectedIds.size === data.entries.length
    : false;

  const toggleAll = useCallback(() => {
    if (!data) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.entries.map((e) => e.id)));
    }
  }, [data, allSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/80 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-white">
              {data.playlist_title}
            </h2>
            <p className="text-sm text-zinc-400">
              {data.total_videos} video{data.total_videos !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Select all bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/50 px-5 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/40"
            />
            {allSelected ? "Deselect all" : "Select all"}
          </label>
          <span className="text-xs text-zinc-500">
            {selectedIds.size} of {data.entries.length} selected
          </span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {data.entries.map((entry: PlaylistEntry) => (
            <label
              key={entry.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-800/60"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(entry.id)}
                onChange={() => toggleOne(entry.id)}
                className="h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/40"
              />
              {/* Thumbnail */}
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {entry.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.thumbnail}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600">
                    <span className="material-symbols-outlined text-xl">
                      music_note
                    </span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {entry.title}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {entry.channel}
                </p>
              </div>
              {/* Duration */}
              <span className="shrink-0 text-xs text-zinc-500">
                {formatDuration(entry.duration)}
              </span>
            </label>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // We need a url — the modal doesn't store it,
              // so we pass it from the parent via data or a closure.
              // The parent should have set up onConfirm with the URL bound.
              // We just send the selected IDs.
              // Since the parent has the URL, we use onConfirm with '' and IDs.
              onConfirm("", Array.from(selectedIds));
            }}
            disabled={selectedIds.size === 0}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ViewType } from "@/lib/types";

interface TopBarProps {
  currentView: ViewType;
  onSwitchView: (view: ViewType) => void;
  onRescan: () => void;
  onOpenLogs: () => void;
  onToggleSearch: () => void;
}

const viewLabels: Record<ViewType, string> = {
  library: "Library",
  download: "Download",
  import: "Import",
  sources: "Sources",
  manage: "Manage",
};

export default function TopBar({
  currentView,
  onSwitchView,
  onRescan,
  onOpenLogs,
  onToggleSearch,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-[#0A0A0A] px-4">
      {/* Left: Logo + Title */}
      <button
        onClick={() => onSwitchView("library")}
        className="flex items-center gap-2 text-white"
      >
        <span className="material-symbols-outlined text-2xl text-indigo-400">
          library_music
        </span>
        <h1 className="text-lg font-semibold tracking-tight">JazzOne</h1>
      </button>

      {/* Center: Current view label */}
      <span className="hidden text-sm font-medium text-zinc-400 sm:block">
        {viewLabels[currentView]}
      </span>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenLogs}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="View logs"
        >
          <span className="material-symbols-outlined text-xl">terminal</span>
        </button>
        <button
          onClick={onRescan}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Rescan library"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>
        <button
          onClick={onToggleSearch}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Toggle search"
        >
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
      </div>
    </header>
  );
}

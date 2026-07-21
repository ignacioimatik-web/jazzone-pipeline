"use client";

import type { ViewType } from "@/lib/types";

interface TopBarProps {
  currentView: ViewType;
  onSwitchView: (view: ViewType) => void;
  onRescan: () => void;
  onOpenLogs: () => void;
  onToggleSearch: () => void;
}

export default function TopBar({
  currentView: _currentView,
  onSwitchView,
  onRescan,
  onOpenLogs,
  onToggleSearch,
}: TopBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.12)] flex items-center justify-between px-4 md:px-12 h-16">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onSwitchView("library")}
          className="active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[#ebb2ff]">menu</span>
        </button>
        <h1
          onClick={() => onSwitchView("library")}
          className="text-[32px] font-black text-[#ebb2ff] cursor-pointer drop-shadow-[0_0_10px_rgba(188,19,254,0.6)] leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}
        >
          JazzOne
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onRescan}
          className="active:scale-95 transition-transform text-[#d4c0d7] hover:text-[#ebb2ff]"
          title="Rescan Navidrome"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
        <button
          onClick={onOpenLogs}
          className="active:scale-95 transition-transform text-[#d4c0d7] hover:text-[#ff4d4d]/80"
          title="Ver logs"
        >
          <span className="material-symbols-outlined">bug_report</span>
        </button>
        <button
          onClick={onToggleSearch}
          className="active:scale-95 transition-transform text-[#d4c0d7] hover:text-[#ebb2ff]"
          title="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </header>
  );
}

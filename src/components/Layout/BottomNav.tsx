"use client";

import type { ViewType } from "@/lib/types";

interface BottomNavProps {
  currentView: ViewType;
  onSwitchView: (view: ViewType) => void;
}

interface NavItem {
  view: ViewType;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { view: "library", label: "Biblioteca", icon: "library_music" },
  { view: "download", label: "Descargar", icon: "download" },
  { view: "sources", label: "Fuentes", icon: "explore" },
  { view: "import", label: "Importar", icon: "folder_open" },
  { view: "manage", label: "Gestionar", icon: "build" },
];

export default function BottomNav({ currentView, onSwitchView }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-[rgba(255,255,255,0.05)] backdrop-blur-2xl border-t border-[rgba(255,255,255,0.12)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-4">
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => onSwitchView(item.view)}
            className={`flex flex-col items-center justify-center active:scale-90 duration-200 ${
              isActive
                ? "text-[#ebb2ff] drop-shadow-[0_0_8px_rgba(188,19,254,0.8)]"
                : "text-[#d4c0d7] opacity-60 hover:opacity-100 transition-opacity"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span
              className="text-[12px] font-bold mt-1 uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

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
  { view: "library", label: "Library", icon: "album" },
  { view: "download", label: "Download", icon: "download" },
  { view: "import", label: "Import", icon: "upload_file" },
  { view: "sources", label: "Sources", icon: "source" },
  { view: "manage", label: "Manage", icon: "settings" },
];

export default function BottomNav({
  currentView,
  onSwitchView,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-[#0A0A0A]">
      <ul className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <li key={item.view}>
              <button
                onClick={() => onSwitchView(item.view)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isActive ? "fill-1" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

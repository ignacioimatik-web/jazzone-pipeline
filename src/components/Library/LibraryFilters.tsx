"use client";

import type { LibraryFilter } from "@/lib/types";

interface LibraryFiltersProps {
  currentFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
}

const filters: { value: LibraryFilter; label: string }[] = [
  { value: "all", label: "All Music" },
  { value: "acid-jazz", label: "Acid Jazz" },
  { value: "concerts", label: "Concerts" },
  { value: "instrumental", label: "Instrumental" },
];

export default function LibraryFilters({ currentFilter, onFilterChange }: LibraryFiltersProps) {
  return (
    <div className="flex gap-4 overflow-x-auto w-full no-scrollbar" role="group" aria-label="Library filters">
      {filters.map((f) => {
        const isActive = currentFilter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-5 py-2 rounded-full font-bold text-[12px] uppercase tracking-wider whitespace-nowrap transition-all ${
              isActive
                ? "bg-[#bc13fe] text-white shadow-[0_0_12px_-2px_rgba(188,19,254,0.4)]"
                : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[#d4c0d7] hover:bg-[rgba(255,255,255,0.07)]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

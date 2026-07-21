"use client";

import type { LibraryFilter } from "@/lib/types";

interface LibraryFiltersProps {
  currentFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
}

const filters: { key: LibraryFilter; label: string }[] = [
  { key: "all", label: "All Music" },
  { key: "acid-jazz", label: "Acid Jazz" },
  { key: "concerts", label: "Concerts" },
  { key: "instrumental", label: "Instrumental" },
];

export default function LibraryFilters({
  currentFilter,
  onFilterChange,
}: LibraryFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {filters.map(({ key, label }) => {
        const isActive = currentFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#bc13fe] text-white shadow-[0_0_12px_-2px_rgba(188,19,254,0.4)]"
                : "border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#d4c0d7] hover:border-[rgba(255,255,255,0.15)] hover:text-[#e5e2e1]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

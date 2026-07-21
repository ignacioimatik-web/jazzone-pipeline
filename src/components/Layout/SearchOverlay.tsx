"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SearchOverlayProps {
  visible: boolean;
  onSearch: (query: string) => void;
  onClose: () => void;
}

export default function SearchOverlay({
  visible,
  onSearch,
  onClose,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query to parent on every change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      onSearch(val);
    },
    [onSearch]
  );

  // Reset query on close
  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  // Focus the input when the overlay opens
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]/95 backdrop-blur-sm">
      {/* Header with input */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <span className="material-symbols-outlined text-zinc-400">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search albums, tracks, artists…"
          className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-600"
        />
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Close search"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Results area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        {query.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Type to search your music library…
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

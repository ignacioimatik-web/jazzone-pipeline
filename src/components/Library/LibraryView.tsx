"use client";

import { useState, useEffect, useMemo } from "react";
import type { LibraryAlbum, LibraryFilter, ViewType } from "@/lib/types";
import { getLibrary } from "@/lib/api";
import AlbumCard from "./AlbumCard";
import LibraryFilters from "./LibraryFilters";

interface LibraryViewProps {
  onPlay: (album: string, track: string) => void;
  onOpenAlbum: (name: string) => void;
  onStatsChange?: (stats: { total: number; tracks: number }) => void;
  searchQuery?: string;
  showToast?: (msg: string, duration?: number) => void;
  onSwitchView?: (view: ViewType) => void;
}

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  subtitle?: string;
}

export default function LibraryView({
  onPlay: _onPlay,
  onOpenAlbum,
  onStatsChange,
}: LibraryViewProps) {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch albums on mount
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const result = await getLibrary();
        if (!cancelled) {
          setAlbums(result.albums || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load library");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  // Notify parent of stats
  const totalTracks = useMemo(
    () => albums.reduce((sum, a) => sum + a.track_count, 0),
    [albums]
  );
  useEffect(() => {
    onStatsChange?.({ total: albums.length, tracks: totalTracks });
  }, [albums.length, totalTracks, onStatsChange]);

  // Filter + search
  const filteredAlbums = useMemo(() => {
    let result = albums;

    // Apply category filter
    if (filter !== "all") {
      const query = filter.replace(/-/g, " ").toLowerCase();
      result = result.filter((album) =>
        album.name.toLowerCase().includes(query)
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((album) =>
        album.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [albums, filter, searchQuery]);

  // Stats cards data
  const statsCards: StatCard[] = [
    {
      label: "Total Collection",
      value: albums.length,
      icon: "album",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Total Tracks",
      value: totalTracks,
      icon: "music_note",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "System",
      value: "JazzOne",
      icon: "settings",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      subtitle: `v${albums.length > 0 ? "1.0" : "—"}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} p-3 backdrop-blur-sm`}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className={`material-symbols-outlined text-lg ${card.color}`}>
                {card.icon}
              </span>
              <span className="text-xs font-medium text-[#d4c0d7]">
                {card.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="mt-0.5 text-[10px] text-[#d4c0d7]/60">
                {card.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#d4c0d7]">
          search
        </span>
        <input
          type="text"
          placeholder="Search albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] py-2.5 pl-10 pr-4 text-sm text-[#e5e2e1] placeholder-[#d4c0d7]/50 outline-none backdrop-blur-sm transition-colors focus:border-[#bc13fe]/40 focus:bg-[rgba(255,255,255,0.05)]"
        />
      </div>

      {/* Filters */}
      <LibraryFilters currentFilter={filter} onFilterChange={setFilter} />

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#bc13fe] border-t-transparent" />
          <p className="text-sm text-[#d4c0d7]">Loading library...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20">
          <span className="mb-2 text-3xl">⚠️</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <span className="mb-2 text-4xl">🎵</span>
          <p className="text-sm text-[#d4c0d7]">
            {searchQuery || filter !== "all"
              ? "No albums match your search"
              : "No albums in your library yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album.name}
              album={album}
              onClick={onOpenAlbum}
            />
          ))}
        </div>
      )}
    </div>
  );
}

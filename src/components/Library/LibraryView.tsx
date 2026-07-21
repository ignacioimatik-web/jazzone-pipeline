"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { LibraryAlbum, LibraryFilter, ViewType } from "@/lib/types";
import { getLibrary } from "@/lib/api";
import { getDownloadAllUrl } from "@/lib/api";
import AlbumCard from "./AlbumCard";
import AlbumModal from "./AlbumModal";
import LibraryFilters from "./LibraryFilters";

interface LibraryViewProps {
  onPlay: (album: string, track: string) => void;
  onOpenAlbum?: (name: string) => void;
  onStatsChange?: (stats: { total: number; tracks: number }) => void;
  searchQuery?: string;
  showToast?: (msg: string, duration?: number) => void;
  onSwitchView?: (view: ViewType) => void;
}

export default function LibraryView({
  onPlay,
  onOpenAlbum: _onOpenAlbum,
  onStatsChange,
  searchQuery = "",
  showToast,
}: LibraryViewProps) {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Sync external search query
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Fetch albums on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchAlbums() {
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
    fetchAlbums();
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
    if (filter !== "all") {
      const q = filter.replace(/-/g, " ").toLowerCase();
      result = result.filter((album) =>
        album.name.toLowerCase().includes(q)
      );
    }
    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      result = result.filter((album) =>
        album.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [albums, filter, localSearch]);

  const handleAlbumClick = useCallback((name: string) => {
    setSelectedAlbum(name);
  }, []);

  const handleDownload = useCallback((_album: string, _track: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    const a = document.createElement("a");
    a.href = `${API}/api/library/${encodeURIComponent(_album)}/${encodeURIComponent(_track)}`;
    a.download = _track;
    a.click();
    showToast?.("⬇️ Descargando...");
  }, [showToast]);

  const handleDownloadZip = useCallback((album: string) => {
    const a = document.createElement("a");
    a.href = getDownloadAllUrl(album);
    a.download = `${album}.zip`;
    a.click();
    showToast?.("✅ Descargando ZIP...");
  }, [showToast]);

  const handleDelete = useCallback(async (album: string) => {
    try {
      const { deleteAlbum } = await import("@/lib/api");
      await deleteAlbum(album);
      setAlbums((prev) => prev.filter((a) => a.name !== album));
      showToast?.(`🗑️ "${album}" eliminado`);
    } catch {
      showToast?.("❌ Error al borrar");
    }
  }, [showToast]);

  return (
    <div>
      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card rounded-xl p-6 flex flex-col justify-center border-l-4 border-l-[#ebb2ff]">
          <span className="text-[12px] font-bold text-[#ebb2ff] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            Total Collection
          </span>
          <span className="text-[32px] font-bold text-[#e5e2e1] leading-tight">{albums.length}</span>
          <p className="text-[14px] text-[#d4c0d7] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Albums in library</p>
        </div>
        <div className="glass-card rounded-xl p-6 flex flex-col justify-center border-l-4 border-l-[#00f1fe]">
          <span className="text-[12px] font-bold text-[#00f1fe] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            Total Tracks
          </span>
          <span className="text-[32px] font-bold text-[#e5e2e1] leading-tight">{totalTracks}</span>
          <p className="text-[14px] text-[#d4c0d7] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Tracks indexed</p>
        </div>
        <div className="glass-card rounded-xl p-6 flex flex-col justify-center border-l-4 border-l-[#c6c6c7]">
          <span className="text-[12px] font-bold text-[#c6c6c7] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            System
          </span>
          <span className="text-[32px] font-bold text-[#e5e2e1] leading-tight">v1.0</span>
          <p className="text-[14px] text-[#d4c0d7] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>pipeline.jazzone.click</p>
        </div>
      </section>

      {/* Search + Filters Header */}
      <section className="mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h2 className="text-[40px] font-bold text-[#e5e2e1] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Biblioteca
          </h2>
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d4c0d7] text-sm">search</span>
            <input
              type="search"
              placeholder="Search your library..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-[#ebb2ff] focus:border-[#bc13fe] transition-all outline-none text-[14px] text-[#e5e2e1] placeholder:text-[#d4c0d7]/50"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              autoComplete="off"
            />
          </div>
        </div>
        <LibraryFilters currentFilter={filter} onFilterChange={setFilter} />
      </section>

      {/* Albums Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-[#d4c0d7]">Loading library...</p>
        </div>
      ) : error ? (
        <div className="col-span-full text-center py-16">
          <span className="text-3xl">⚠️</span>
          <p className="mt-2 text-red-400">{error}</p>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="col-span-full text-center py-16 text-[#d4c0d7]">
          <span className="material-symbols-outlined text-6xl opacity-30">library_music</span>
          <p className="mt-4">{localSearch || filter !== "all" ? "No albums match your search" : "Your library is empty"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album.name}
              album={album}
              onClick={handleAlbumClick}
            />
          ))}
        </div>
      )}

      {/* Album Modal */}
      <AlbumModal
        albumName={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
        onPlay={onPlay}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onDownloadZip={handleDownloadZip}
      />
    </div>
  );
}

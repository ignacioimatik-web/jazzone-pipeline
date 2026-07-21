"use client";

import { useState } from "react";
import Image from "next/image";
import type { LibraryAlbum } from "@/lib/types";
import { getCoverUrl } from "@/lib/api";

interface AlbumCardProps {
  album: LibraryAlbum;
  onClick: (name: string) => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(album.name)}
      className="group relative w-full overflow-hidden rounded-xl bg-[rgba(255,255,255,0.03)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] p-3 text-left transition-all duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(188,19,254,0.4)] hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(188,19,254,0.3)]"
    >
      {/* Cover Image */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-[#222] text-5xl">
            🎵
          </div>
        ) : (
          <Image
            src={getCoverUrl(album.name)}
            alt={album.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImgError(true)}
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="bg-[#bc13fe] text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="px-1">
        <h3 className="text-[18px] font-semibold truncate text-[#e5e2e1] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {album.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[12px] font-bold text-[#d4c0d7] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            {album.track_count} Tracks
          </span>
          <span className="material-symbols-outlined text-[#00dbe7] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
      </div>
    </button>
  );
}

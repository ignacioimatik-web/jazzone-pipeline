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
      className="group relative w-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#bc13fe]/40 hover:shadow-[0_0_30px_-5px_rgba(188,19,254,0.3)]"
    >
      {/* Cover Image */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800/50 text-5xl">
            🎵
          </div>
        ) : (
          <Image
            src={getCoverUrl(album.name)}
            alt={album.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImgError(true)}
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="material-symbols-outlined text-3xl text-white">
              play_arrow
            </span>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="space-y-1 px-0.5">
        <h3 className="truncate text-sm font-semibold text-[#e5e2e1]">
          {album.name}
        </h3>
        <p className="text-xs text-[#d4c0d7]">
          {album.track_count} {album.track_count === 1 ? "track" : "tracks"}
        </p>
      </div>
    </button>
  );
}

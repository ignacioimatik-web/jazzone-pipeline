"use client";

import { useEffect, useRef, useState } from "react";

interface MiniPlayerProps {
  trackName: string;
  albumName: string;
  audioSrc: string;
  onClose: () => void;
}

export default function MiniPlayer({
  trackName,
  albumName,
  audioSrc,
  onClose,
}: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", () => setPlaying(false));
    audio.play().then(() => setPlaying(true)).catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      {/* Progress bar */}
      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        {/* Thumbnail placeholder */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-800 text-zinc-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M3.75 3A.75.75 0 003 3.75v12.5c0 .414.336.75.75.75h12.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75H3.75zM16 16H4V4h12v12z" />
          </svg>
        </div>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">
            {trackName}
          </p>
          <p className="truncate text-xs text-zinc-400">{albumName}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 005.75 3zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close player"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

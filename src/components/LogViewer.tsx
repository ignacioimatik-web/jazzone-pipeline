"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getLogs } from "@/lib/api";

interface LogViewerProps {
  visible: boolean;
  onClose: () => void;
  /** Number of log lines to fetch (default: 200) */
  lines?: number;
  /** Auto-refresh interval in ms (default: 10000). Set to 0 to disable. */
  refreshInterval?: number;
}

export default function LogViewer({
  visible,
  onClose,
  lines = 200,
  refreshInterval = 10000,
}: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  // Initial fetch
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const doFetch = async () => {
      try {
        setError(null);
        const data = await getLogs(lines);
        if (!cancelled) {
          setLogs(data.logs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch logs");
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [lines, visible]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !visible) return;

    const interval = setInterval(async () => {
      try {
        setError(null);
        const data = await getLogs(lines);
        setLogs(data.logs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [lines, refreshInterval, visible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getLogs(lines);
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [lines]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <h3 className="text-sm font-semibold text-zinc-300">Server Logs</h3>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs text-zinc-500">Loading&hellip;</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.758-3.138.75.75 0 00-1.495-.623z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M3.58 9.282a7 7 0 0011.354-4.163.75.75 0 00-1.463-.18 5.5 5.5 0 01-9.015 2.648l.312.311h-2.43a.75.75 0 000 1.5h4.242a.75.75 0 00.75-.75V4.607a.75.75 0 00-1.5 0v2.43l-.31-.31a7 7 0 00-1.94 2.555.75.75 0 001.495.623z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-96 overflow-y-auto overscroll-contain p-3 font-mono text-xs leading-relaxed"
        >
          {error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : logs.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-500">No logs available.</p>
            </div>
          ) : (
            <pre className="m-0 whitespace-pre-wrap break-all text-zinc-300">
              {logs.map((line, i) => (
                <span key={i} className="block">
                  <span className="mr-2 select-none text-zinc-600">
                    {String(i + 1).padStart(4, " ")}
                  </span>
                  {line || <span className="text-zinc-600">&nbsp;</span>}
                </span>
              ))}
            </pre>
          )}

          {/* Loading skeleton */}
          {loading && logs.length === 0 && (
            <div className="space-y-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 w-full animate-pulse rounded bg-zinc-800"
                  style={{ opacity: 1 - i * 0.06 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer status */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-1.5">
          <span className="text-xs text-zinc-600">
            {logs.length} line{logs.length !== 1 ? "s" : ""}
            {refreshInterval > 0 && (
              <>
                {" \u00b7 "}Auto-refresh every{" "}
                {(refreshInterval / 1000).toFixed(0)}s
              </>
            )}
          </span>
          <span className="text-xs text-zinc-600">
            {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}

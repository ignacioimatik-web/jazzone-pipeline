const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const NAVIDROME_URL = "https://navidrome.jazzone.click";

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ============ Library ============

import type {
  HealthResponse,
  LibraryResponse,
  AlbumTracksResponse,
  LogsResponse,
  PlaylistPreview,
  DownloadResponse,
  JobsResponse,
  JobStatusResponse,
  CleanupResponse,
  RescanResponse,
  UploadResponse,
  SystemInfo,
} from "./types";

export async function getHealth(): Promise<HealthResponse> {
  return fetchApi("/api/health");
}

export async function getLibrary(): Promise<LibraryResponse> {
  return fetchApi("/api/library");
}

export async function getAlbumTracks(albumName: string): Promise<AlbumTracksResponse> {
  return fetchApi(`/api/library/${encodeURIComponent(albumName)}/tracks`);
}

export async function deleteAlbum(albumName: string): Promise<void> {
  await fetchApi(`/api/library/delete-album?album_name=${encodeURIComponent(albumName)}`, {
    method: "DELETE",
  });
}

export function getDownloadAllUrl(albumName: string): string {
  return `${API_BASE}/api/library/download-all?album_name=${encodeURIComponent(albumName)}`;
}

export function getTrackUrl(albumName: string, trackName: string): string {
  return `${API_BASE}/api/library/${encodeURIComponent(albumName)}/${encodeURIComponent(trackName)}`;
}

export function getCoverUrl(albumName: string): string {
  return `${API_BASE}/api/cover/${encodeURIComponent(albumName)}`;
}

// ============ Download / Playlist ============

export async function previewPlaylist(url: string, signal?: AbortSignal): Promise<PlaylistPreview> {
  return fetchApi("/api/playlist/preview", {
    method: "POST",
    body: JSON.stringify({ url }),
    signal,
  });
}

export async function startDownload(
  url: string,
  selectedVideos: string[] = []
): Promise<DownloadResponse> {
  return fetchApi("/api/download", {
    method: "POST",
    body: JSON.stringify({ url, selected_videos: selectedVideos }),
  });
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return fetchApi(`/api/status/${jobId}`);
}

export async function getJobs(): Promise<JobsResponse> {
  return fetchApi("/api/jobs");
}

export async function clearJobs(): Promise<void> {
  await fetchApi("/api/jobs/clear", { method: "POST" });
}

// ============ Management ============

export async function cleanupStaleAlbums(): Promise<CleanupResponse> {
  return fetchApi("/api/cleanup-stale", { method: "POST" });
}

export async function rescanNavidrome(): Promise<RescanResponse> {
  return fetchApi("/api/rescan", { method: "POST" });
}

export async function getLogs(lines: number = 200): Promise<LogsResponse> {
  return fetchApi(`/api/logs?lines=${lines}`);
}

// ============ Import / Upload ============

export async function uploadFiles(formData: FormData, signal?: AbortSignal): Promise<UploadResponse> {
  const url = `${API_BASE}/api/import/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    signal,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function browseFolder(folderPath: string) {
  return fetchApi(`/api/import/browse?path=${encodeURIComponent(folderPath)}`);
}

// ============ System Info Aggregator ============

export async function getSystemInfo(): Promise<SystemInfo> {
  const [lib, health, jobs] = await Promise.all([
    getLibrary().catch(() => ({ albums: [] })),
    getHealth().catch(() => ({ status: "error", version: "?" })),
    getJobs().catch(() => ({ jobs: [] })),
  ]);

  // Check Navidrome connectivity
  let navidromeStatus: SystemInfo["navidromeStatus"] = "disconnected";
  try {
    const navRes = await fetch(
      `${NAVIDROME_URL}/rest/ping?u=admin&p=jistev2024!&v=1.16.0&c=cli`
    );
    const text = await navRes.text();
    navidromeStatus = text.includes('status="ok"') ? "connected" : "error";
  } catch {
    navidromeStatus = "disconnected";
  }

  const activeJobs = (jobs.jobs || []).filter(
    (j) => j.status !== "completed" && j.status !== "error"
  ).length;

  return {
    version: health.version,
    totalAlbums: lib.albums?.length || 0,
    totalTracks: lib.albums?.reduce((s, a) => s + a.track_count, 0) || 0,
    navidromeStatus,
    activeJobs,
  };
}

// ============ API Response Types ============

export interface HealthResponse {
  status: string;
  version: string;
}

export interface LibraryAlbum {
  name: string;
  path: string;
  track_count: number;
  cover: string;
}

export interface LibraryResponse {
  albums: LibraryAlbum[];
}

export interface AlbumTracksResponse {
  album: string;
  tracks: string[];
}

export interface LogsResponse {
  file: string;
  total_lines: number;
  returned: number;
  logs: string[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
}

export interface PlaylistPreview {
  playlist_title: string;
  total_videos: number;
  entries: PlaylistEntry[];
}

export interface DownloadResponse {
  job_id: string;
  status: string;
}

export interface JobTrack {
  num: number;
  name: string;
}

export interface Job {
  id: string;
  url: string;
  status: "queued" | "downloading" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  error?: string;
  tracks?: JobTrack[];
  created_at: string;
}

export interface JobsResponse {
  jobs: Job[];
}

export interface JobStatusResponse {
  id: string;
  status: string;
  progress: number;
  message: string;
  tracks?: JobTrack[];
  error?: string;
}

export interface CleanupResponse {
  status: string;
  detail?: string;
  ta?: number;
  tm?: number;
}

export interface RescanResponse {
  status: string;
}

export interface UploadResponse {
  status: string;
  tracks: number;
  album_count: number;
  albums?: string[];
  errors?: string[];
  rescan?: boolean;
}

export interface ImportBrowseResponse {
  path: string;
  folders: string[];
  files: string[];
}

export interface SystemInfo {
  version: string;
  totalAlbums: number;
  totalTracks: number;
  navidromeStatus: "connected" | "disconnected" | "error";
  activeJobs: number;
}

// ============ Component Types ============

export type ViewType = "library" | "download" | "import" | "sources" | "manage";

export type LibraryFilter = "all" | "acid-jazz" | "concerts" | "instrumental";

export interface ToastState {
  message: string;
  visible: boolean;
  duration: number;
}

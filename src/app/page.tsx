"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ViewType } from "@/lib/types";
import TopBar from "@/components/Layout/TopBar";
import BottomNav from "@/components/Layout/BottomNav";
import SearchOverlay from "@/components/Layout/SearchOverlay";
import ViewContainer from "@/components/Layout/ViewContainer";
import Toast from "@/components/Toast";
import MiniPlayer from "@/components/MiniPlayer";
import LogViewer from "@/components/LogViewer";
import LibraryView from "@/components/Library/LibraryView";
import DownloadView from "@/components/Download/DownloadView";
import ImportView from "@/components/Import/ImportView";
import SourcesView from "@/components/Sources/SourcesView";
import ManageView from "@/components/Manage/ManageView";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>("library");
  const [searchVisible, setSearchVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const [playerTrack, setPlayerTrack] = useState("");
  const [playerAlbum, setPlayerAlbum] = useState("");
  const [playerSrc, setPlayerSrc] = useState("");
  const [playerVisible, setPlayerVisible] = useState(false);

  const [logViewerVisible, setLogViewerVisible] = useState(false);

  const showToast = useCallback(
    (msg: string, duration = 3000) => {
      setToastMsg(msg);
      setToastVisible(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastVisible(false), duration);
    },
    []
  );

  const handleSwitchView = useCallback((view: ViewType) => {
    setCurrentView(view);
    setSearchVisible(false);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setSearchVisible((v) => !v);
  }, []);

  const handlePlay = useCallback(
    (album: string, track: string) => {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      const src = `${API}/api/library/${encodeURIComponent(album)}/${encodeURIComponent(track)}`;
      setPlayerTrack(track.replace(".m4a", ""));
      setPlayerAlbum(album);
      setPlayerSrc(src);
      setPlayerVisible(true);
    },
    []
  );

  const handleClosePlayer = useCallback(() => {
    setPlayerVisible(false);
    setPlayerSrc("");
  }, []);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <>
      {/* Top Bar */}
      <TopBar
        currentView={currentView}
        onSwitchView={handleSwitchView}
        onRescan={() => showToast("🔄 Rescan iniciado...")}
        onOpenLogs={() => setLogViewerVisible(true)}
        onToggleSearch={handleToggleSearch}
      />

      {/* Search Overlay */}
      <SearchOverlay
        visible={searchVisible}
        onSearch={() => {}}
        onClose={() => setSearchVisible(false)}
      />

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 md:px-12 max-w-[1440px] mx-auto">
        <ViewContainer activeView={currentView}>
          <LibraryView
            onPlay={handlePlay}
            showToast={showToast}
          />
          <DownloadView
            onSwitchView={handleSwitchView}
            onOpenLogs={() => setLogViewerVisible(true)}
            showToast={showToast}
          />
          <ImportView
            onSwitchView={handleSwitchView}
            showToast={showToast}
          />
          <SourcesView onSwitchView={handleSwitchView} />
          <ManageView
            onSwitchView={handleSwitchView}
            showToast={showToast}
          />
        </ViewContainer>
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} onSwitchView={handleSwitchView} />

      {/* Mini Player */}
      {playerVisible && (
        <MiniPlayer
          trackName={playerTrack}
          albumName={playerAlbum}
          audioSrc={playerSrc}
          onClose={handleClosePlayer}
        />
      )}

      {/* Toast */}
      <Toast message={toastMsg} visible={toastVisible} />

      {/* Log Viewer */}
      <LogViewer
        visible={logViewerVisible}
        onClose={() => setLogViewerVisible(false)}
      />
    </>
  );
}

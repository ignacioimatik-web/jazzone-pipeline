/*
  JazzOne · Full Pipeline Logic v1.2
  Playlist preview + selection + download + management
*/
const API = window.location.origin;
let currentView = 'library';
let libraryCache = null;
let currentSort = 'latest'; // 'latest' = newest first, 'default' = original order
let pollingJobs = {};
let currentLibraryQuery = '';
let currentLibraryFilter = 'all';
const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function encodeSegment(value) {
  return encodeURIComponent(String(value ?? '')).replace(/'/g, '%27');
}

// ============ VIEW SYSTEM ============
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.top-nav-btn').forEach(t => t.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => { if (t.dataset.view === view) t.classList.add('active'); });
  document.querySelectorAll('.top-nav-btn').forEach(t => {
    if (t.dataset.view === view) {
      t.classList.add('active', 'bg-primary-container', 'text-on-primary-container');
      t.classList.remove('bg-surface-glass', 'border-border-glass', 'text-on-surface-variant');
    } else {
      t.classList.remove('active', 'bg-primary-container', 'text-on-primary-container');
      t.classList.add('bg-surface-glass', 'border-border-glass', 'text-on-surface-variant');
    }
  });
  if (view === 'library') { loadLibrary(); updateStats(); }
  if (view === 'manage') loadManageView();
  if (view === 'download') { loadJobs(); }
}

function showToast(msg, duration = 3000) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('show'), duration);
}

// ============ LIBRARY ============
async function loadLibrary() {
  const grid = $('libraryGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/api/library`);
    const data = await res.json();
    libraryCache = data.albums;
    renderLibrary(data.albums);
  } catch(e) {
    grid.innerHTML = `<div class="col-span-full text-center py-16"><p>Error loading library</p></div>`;
  }
}

function renderLibrary(albums) {
  const grid = $('libraryGrid');
  if (!grid) return;
  if (!albums || albums.length === 0) {
    grid.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center py-20"><svg class="w-12 h-12 text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg><p class="text-sm text-white/30">Your library is empty</p></div>';
    return;
  }

  // Sort: latest added first (reverse order = most recent albums at end of array = newest first when reversed)
  const sorted = [...albums];
  if (currentSort === 'latest') {
    sorted.reverse();
  }

  grid.innerHTML = sorted.map(a => {
    const encodedName = encodeSegment(a.name);
    const displayName = escapeHtml(a.name);
    return '<div class="group relative w-full overflow-hidden rounded-xl bg-[rgba(255,255,255,0.03)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] p-3 text-left transition-all duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(168,85,247,0.4)] hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.3)] cursor-pointer" onclick="openAlbum(\'' + encodedName + '\')">' +
      '<div class="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">' +
        '<img class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" src="' + (a.cover || '') + '" alt="' + displayName + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.className+=\' flex items-center justify-center bg-[#222] text-5xl\';this.parentElement.textContent=\'🎵\'">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">' +
          '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">' +
            '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="px-1">' +
        '<h3 class="text-sm font-semibold truncate text-white/80 leading-tight">' + displayName + '</h3>' +
        '<div class="flex items-center justify-between mt-1">' +
          '<span class="text-[10px] font-semibold text-white/40 uppercase tracking-wider">' + a.track_count + ' Tracks</span>' +
          '<svg class="w-3.5 h-3.5 text-emerald-400/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function filterLibrary(query) {
  currentLibraryQuery = query || '';
  if (!libraryCache) return;
  const q = currentLibraryQuery.trim().toLowerCase();
  const filtered = libraryCache.filter(album => {
    const name = album.name.toLowerCase();
    return (!q || name.includes(q)) && matchesLibraryFilter(album, currentLibraryFilter);
  });
  renderLibrary(filtered);
}

function matchesLibraryFilter(album, filter) {
  if (filter === 'all') return true;
  const name = String(album?.name || '').toLowerCase();
  if (filter === 'acid-jazz') return /acid|jazz|funk|soul/.test(name);
  if (filter === 'concerts') return /live|concert|festival|tour|session|koko|cercle/.test(name);
  if (filter === 'instrumental') return /instrumental|piano|guitar|solo|ambient|classical/.test(name);
  if (filter === 'podcast') return /radio drama|audiobook|read along|homil[aí]|story|talk|speech|interview|podcast|star.?wars.*(radio|drama|audio|book)|narra|history|documentary|meditaci[oó]n|sermon|lecture/.test(name);
  return true;
}

function setLibraryFilter(filter, button) {
  currentLibraryFilter = filter;
  document.querySelectorAll('.library-filter').forEach(item => {
    const active = item === button;
    if (active) {
      item.className = item.className.replace(/bg-white\/5|border-white\/10|text-white\/40/g, '');
      item.classList.add('bg-purple-500/20', 'text-purple-300', 'border-purple-500/20');
    } else {
      item.classList.remove('bg-purple-500/20', 'text-purple-300', 'border-purple-500/20');
      item.classList.add('bg-white/5', 'text-white/40', 'border-white/10');
    }
  });
  filterLibrary(currentLibraryQuery);
}

async function playFirstTrack() {
  const album = libraryCache?.[0];
  if (!album) { showToast('Your library is empty'); return; }
  try {
    const res = await fetch(`${API}/api/library/${encodeSegment(album.name)}/tracks`);
    const data = await res.json();
    if (data.tracks?.length) playTrack(encodeSegment(album.name), encodeSegment(data.tracks[0]));
    else showToast('No tracks available');
  } catch(e) { showToast('Connection error'); }
}

// ============ ALBUM MODAL ============
async function openAlbum(encodedName) {
  const name = decodeURIComponent(encodedName);
  const modal = $('albumModal');
  if (!modal) return;
  const detail = $('albumDetail');
  if (!detail) return;
  const album = libraryCache?.find(a => a.name === name);
  if (!album) { showToast('Album not found'); return; }
  detail.innerHTML = `
    <div class="text-center mb-6">
      <img src="${album.cover || ''}" alt="${name}" class="w-40 h-40 rounded-xl object-cover mx-auto mb-4 shadow-lg"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23222%22 width=%22200%22 height=%22200%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-size=%2260%22>🎵</text></svg>'">
      <h2 class="font-headline-lg text-headline-lg text-on-surface font-black">${escapeHtml(name)}</h2>
      <p class="font-label-caps text-label-caps text-on-surface-variant uppercase mt-2">${album.track_count} Tracks</p>
      <div class="flex gap-3 justify-center mt-4">
        <button class="px-5 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-caps text-label-caps flex items-center gap-2" onclick="downloadAllAlbum('${encodeSegment(name)}')">
          <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">download</span> Download ZIP
        </button>
        <button class="px-5 py-3 rounded-xl bg-surface-glass border border-border-glass text-on-surface-variant font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-variant" onclick="deleteAlbumFromDetail('${encodeSegment(name)}')">
          <span class="material-symbols-outlined" style="font-size:18px">delete</span> Delete
        </button>
      </div>
    </div>
    <div class="space-y-1" id="modalTrackList">
      <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
    </div>`;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  try {
    const res = await fetch(`${API}/api/library/` + encodeURIComponent(name) + '/tracks');
    const data = await res.json();
    const list = $('modalTrackList');
    if (list && data.tracks) {
      list.innerHTML = data.tracks.map((t,i) => `
        <div class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-glass transition-colors">
          <span class="font-label-caps text-label-caps text-on-surface-variant w-6 text-center">${i+1}</span>
          <span class="flex-1 font-body-sm text-body-sm text-on-surface truncate">${escapeHtml(t.replace('.m4a',''))}</span>
          <button class="text-on-surface-variant hover:text-primary transition-colors" onclick="playTrack('${encodeSegment(name)}','${encodeSegment(t)}')">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;font-size:20px">play_arrow</span>
          </button>
          <button class="text-on-surface-variant hover:text-primary transition-colors" onclick="downloadTrack('${encodeSegment(name)}','${encodeSegment(t)}')">
            <span class="material-symbols-outlined" style="font-size:18px">download</span>
          </button>
        </div>`).join('');
    }
  } catch(e) {}
}

function playTrack(album, track) {
  const player = $('audioPlayer');
  if (!player) return;
  player.src = `${API}/api/library/${album}/${track}`;
  player.play().catch(() => {});
  $('miniPlayer').style.display = 'flex';
  $('playerTrackName').textContent = decodeURIComponent(track).replace('.m4a','');
  $('playerAlbumName').textContent = decodeURIComponent(album);
}

function downloadTrack(album, track) {
  const a = document.createElement('a');
  a.href = `${API}/api/library/${album}/${track}`;
  a.download = decodeURIComponent(track);
  a.click();
}

function downloadAllAlbum(encodedName) {
  const name = decodeURIComponent(encodedName);
  const a = document.createElement('a');
  a.href = `${API}/api/library/download-all?album_name=${encodeURIComponent(name)}`;
  a.download = `${name}.zip`;
  a.click();
  showToast('✅ Downloading ZIP...');
}

// ============ DELETE ALBUM ============
async function deleteAlbumFromDetail(encodedName) {
  if (!confirm('Delete this album?')) return;
  const name = decodeURIComponent(encodedName);
  try {
    const res = await fetch(`${API}/api/library/delete-album?album_name=${encodeURIComponent(name)}`, { method:'DELETE' });
    if (res.ok) {
      showToast('🗑️ Album deleted');
      document.getElementById('albumModal')?.classList.add('hidden');
      document.getElementById('albumModal')?.classList.remove('flex');
      loadLibrary(); updateStats();
      setTimeout(() => rescanNavidrome(), 1000);
    }
  } catch(e) { showToast('Connection error'); }
}

// ============ NAVIGATION / RESCAN ============
async function rescanNavidrome() {
  try {
    const res = await fetch(`${API}/api/rescan`, { method: 'POST' });
    const data = await res.json();
    showToast(data.status === 'scanning' ? '🔄 Rescanning Navidrome...' : 'Error');
  } catch(e) { showToast('Connection error'); }
}

// ============ LOG VIEWER ============
async function openLogs() {
  const modal = document.getElementById('logModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  await refreshLogs();
}

async function refreshLogs() {
  const content = document.getElementById('logContent');
  content.innerHTML = '<div class="spinner mx-auto my-8"></div>';
  try {
    const res = await fetch(`${API}/api/logs?lines=200`);
    const data = await res.json();
    if (data.error) { content.textContent = 'Error: ' + data.error; return; }
    if (!data.logs || data.logs.length === 0) { content.textContent = '(no hay logs aún)'; return; }
    content.innerHTML = data.logs.map(line => {
      line = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (line.includes('ERROR')) return `<span class="text-red-400">${line}</span>`;
      if (line.includes('WARNING')) return `<span class="text-yellow-400">${line}</span>`;
      if (line.includes('INFO')) return `<span class="text-green-400/70">${line}</span>`;
      return line;
    }).join('');
    content.scrollTop = content.scrollHeight;
  } catch(e) { content.textContent = 'Error: ' + e.message; }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#logModal') && !e.target.closest('.modal-content')) {
    document.getElementById('logModal')?.classList.add('hidden');
    document.getElementById('logModal')?.classList.remove('flex');
  }
});
document.querySelectorAll('#logModal .modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('logModal')?.classList.add('hidden');
    document.getElementById('logModal')?.classList.remove('flex');
  });
});

async function cleanupStale() {
  const btn = document.querySelector('[onclick*="cleanupStale"]');
  if (btn) btn.style.opacity = '0.5';
  showToast('🧹 Limpiando fantasmas...', 10000);
  try {
    const res = await fetch(`${API}/api/cleanup-stale`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'ok') {
      const msg = data.ta !== undefined ? `🧹 Limpiado: ${data.ta} álbumes, ${data.tm} pistas` : '🧹 Fantasmas eliminados';
      showToast(msg, 4000);
      // Esperar a que termine el rescan y avisar
      setTimeout(async () => {
        try {
          for (let i=0; i<10; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const sr = await fetch(`${API}/api/rescan`, { method: 'POST' });
            const sd = await sr.json();
            if (sd.status === 'scanning') continue;
            break;
          }
          showToast('✅ Rescan completo. Recarga Navidrome si lo tienes abierto', 6000);
        } catch(e) {}
      }, 3000);
      setTimeout(() => { loadLibrary(); updateStats(); }, 1500);
    } else { showToast('❌ Error: ' + (data.detail || 'desconocido')); }
  } catch(e) { showToast('❌ Error de conexión'); }
  if (btn) btn.style.opacity = '1';
}

// ============ IMPORT / UPLOAD ============
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

async function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const zone = document.getElementById('dropZone');
  zone.classList.remove('border-primary', 'bg-surface-glass');
  const items = event.dataTransfer?.items;
  if (!items || items.length === 0) { showToast('⚠️ Arrastra una carpeta de música desde el Finder'); return; }
  showToast('📂 Leyendo carpeta...');
  const files = await getFilesFromDataTransfer(items);
  if (files.length === 0) { showToast('⚠️ No se encontraron archivos de audio'); return; }
  await uploadFiles(files);
}

async function getFilesFromDataTransfer(items) {
  const audioExts = ['.mp3', '.m4a', '.flac', '.ogg', '.wav', '.wma', '.aac', '.opus'];
  const allFiles = [];
  const queue = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) queue.push(entry);
  }
  while (queue.length > 0) {
    const entry = queue.shift();
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve));
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (audioExts.includes(ext)) allFiles.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let subEntries = await new Promise(resolve => reader.readEntries(resolve));
      while (subEntries.length > 0) { queue.push(...subEntries); subEntries = await new Promise(resolve => reader.readEntries(resolve)); }
    }
  }
  return allFiles;
}

async function handleFileSelect(event) {
  const files = event.target?.files;
  if (!files || files.length === 0) return;
  showToast(`📂 ${files.length} archivos seleccionados`);
  await uploadFiles(files);
}

async function uploadFiles(fileList) {
  const formData = new FormData();
  let totalSize = 0;
  for (const file of fileList) { formData.append('files', file); totalSize += file.size; }
  const zone = document.getElementById('dropZone');
  const content = document.getElementById('dropZoneContent');
  const progress = document.getElementById('uploadProgress');
  const fill = document.getElementById('uploadProgressFill');
  const msg = document.getElementById('uploadProgressMsg');
  const status = document.getElementById('uploadStatus');
  const fileListEl = document.getElementById('uploadFileList');
  const results = document.getElementById('uploadResults');
  results?.classList.add('hidden');
  content.classList.add('hidden');
  progress.classList.remove('hidden');
  fill.style.width = '0%';
  const fileCount = fileList.length;
  const mb = (totalSize / 1024 / 1024).toFixed(1);
  status.textContent = `Subiendo ${fileCount} archivos (${mb} MB)...`;
  msg.textContent = 'Conectando...';
  fileListEl.innerHTML = '';
  let shown = 0;
  for (const f of fileList) {
    if (shown++ > 15) { fileListEl.innerHTML += '<span class="track-chip">+ más...</span>'; break; }
    fileListEl.innerHTML += `<span class="track-chip">${f.name}</span>`;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);
    const res = await fetch(`${API}/api/import/upload`, { method: 'POST', body: formData, signal: controller.signal });
    clearTimeout(timeout);
    fill.style.width = '100%';
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      msg.textContent = '❌ ' + (err.detail || `Error HTTP ${res.status}`);
      status.textContent = 'Error';
      setTimeout(() => { content.classList.remove('hidden'); progress.classList.add('hidden'); }, 4000);
      return;
    }
    const data = await res.json();
    if (data.status === 'ok') {
      msg.textContent = `✅ ${data.tracks} pistas importadas en ${data.album_count} álbumes`;
      status.textContent = 'Completado';
      if (data.errors?.length) { const errDiv = document.getElementById('resultErrors'); if (errDiv) errDiv.innerHTML = '⚠️ ' + data.errors.join('<br>'); }
      results?.classList.remove('hidden');
      document.getElementById('resultTitle').textContent = `✅ ${data.tracks} pistas importadas`;
      document.getElementById('resultDetail').textContent = `${data.album_count} álbumes · ${data.albums?.join(', ') || ''}`;
      if (data.rescan) showToast('🔄 Reescaneando Navidrome...', 4000);
      setTimeout(() => { loadLibrary(); updateStats(); }, 2000);
    } else {
      msg.textContent = '❌ Error durante la importación';
      status.textContent = 'Error';
    }
  } catch(e) {
    if (e.name === 'AbortError') msg.textContent = '❌ Tiempo de espera agotado (5min). Prueba con menos archivos.';
    else msg.textContent = '❌ Error: ' + (e.message || '');
    status.textContent = 'Error';
  }
  setTimeout(() => { content.classList.remove('hidden'); progress.classList.add('hidden'); fileListEl.innerHTML = ''; fill.style.width = '0%'; }, 8000);
}

// ============ PLAYLIST SELECTION MODAL ============
let playlistPreviewData = null;

function showPlaylistModal(data) {
  const modal = document.getElementById('playlistModal') || createPlaylistModal();
  playlistPreviewData = data;
  const body = modal.querySelector('.playlist-modal-body');
  const titleEl = modal.querySelector('.playlist-modal-title');
  
  const safeTitle = escapeHtml(data.playlist_title || 'Playlist');
  titleEl.innerHTML = `📋 ${safeTitle} <span class="text-on-surface-variant text-sm font-normal">(${data.total_videos} videos)</span>`;
  
  body.innerHTML = data.entries.map((v, i) => {
    const dur = v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '?:??';
    const thumb = v.thumbnail || '';
    const checked = 'checked';
    return `
      <label class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors border-b border-border-glass/30">
        <input type="checkbox" class="video-checkbox w-4 h-4 accent-primary-container cursor-pointer" data-video-id="${v.id}" ${checked}>
        ${thumb ? `<img src="${thumb}" class="w-10 h-7 rounded object-cover flex-shrink-0" loading="lazy" onerror="this.style.display='none'">` : `<div class="w-10 h-7 rounded bg-surface-container flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-sm">music_note</span></div>`}
        <span class="flex-1 text-body-sm truncate">${escapeHtml(v.title)}</span>
        <span class="text-xs text-on-surface-variant flex-shrink-0 w-12 text-right">${dur}</span>
        <span class="text-[10px] text-on-surface-variant flex-shrink-0 max-w-[120px] truncate hidden md:block">${escapeHtml(v.channel)}</span>
      </label>`;
  }).join('');
  
  // Update count
  updatePlaylistCount(data.entries.length);
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function createPlaylistModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 hidden items-end justify-center';
  overlay.id = 'playlistModal';
  overlay.innerHTML = `
    <div class="modal-content w-full max-h-[85vh] bg-surface border border-border-glass rounded-t-2xl overflow-y-auto px-margin-mobile md:px-margin-desktop py-6 pb-12">
      <div class="flex justify-between items-center mb-4 sticky top-0 bg-surface z-10 pb-3">
        <h2 class="playlist-modal-title font-headline-lg text-headline-lg text-primary"></h2>
        <button class="modal-close w-9 h-9 flex items-center justify-center rounded-full bg-surface-glass border border-border-glass text-on-surface-variant hover:text-primary transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="flex items-center gap-4 mb-4 text-body-sm text-on-surface-variant">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="playlistSelectAll" checked onchange="toggleAllVideos(this.checked)">
          <span>Select all</span>
        </label>
        <span id="playlistSelectedCount">0 selected</span>
      </div>
      <div class="playlist-modal-body space-y-0"></div>
      <div class="mt-6 flex gap-3 sticky bottom-0 bg-surface pt-4 pb-2">
        <button class="flex-1 px-5 py-3 rounded-xl bg-surface-glass border border-border-glass text-on-surface-variant font-label-caps text-label-caps" onclick="closePlaylistModal()">Cancel</button>
        <button class="flex-1 px-5 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-caps text-label-caps flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" onclick="confirmPlaylistDownload()">
          <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">download</span>
          <span id="playlistDownloadBtnText">Download Selected</span>
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePlaylistModal();
  });
  overlay.querySelector('.modal-close').addEventListener('click', closePlaylistModal);
  
  // Listen for checkbox changes
  overlay.addEventListener('change', (e) => {
    if (e.target.classList.contains('video-checkbox')) {
      updatePlaylistCount();
    }
  });
  
  return overlay;
}

function updatePlaylistCount(total) {
  const checkboxes = document.querySelectorAll('.video-checkbox');
  const checked = document.querySelectorAll('.video-checkbox:checked');
  const countEl = document.getElementById('playlistSelectedCount');
  const btnText = document.getElementById('playlistDownloadBtnText');
  const totalVideos = total !== undefined ? total : checkboxes.length;
  if (countEl) countEl.textContent = `${checked.length} of ${totalVideos} selected`;
  if (btnText) btnText.textContent = `Download (${checked.length})`;
  
  const selectAll = document.getElementById('playlistSelectAll');
  if (selectAll) selectAll.checked = checked.length === totalVideos;
}

function toggleAllVideos(checked) {
  document.querySelectorAll('.video-checkbox').forEach(cb => cb.checked = checked);
  updatePlaylistCount();
}

function closePlaylistModal() {
  const modal = document.getElementById('playlistModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  playlistPreviewData = null;
}

function confirmPlaylistDownload() {
  const selected = Array.from(document.querySelectorAll('.video-checkbox:checked')).map(cb => cb.dataset.videoId);
  if (selected.length === 0) { showToast('⚠️ Selecciona al menos un video'); return; }
  closePlaylistModal();
  // Start download with selected videos
  const url = urlInput?.value.trim();
  if (!url) return;
  startDownloadWithSelection(url, selected);
}

async function startDownloadWithSelection(url, selectedIds) {
  startBtn.disabled = true;
  startBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Processing...`;
  try {
    const res = await fetch(`${API}/api/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url, selected_videos: selectedIds}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('Error: ' + (err.detail || 'unknown'));
      resetBtn();
      return;
    }
    const data = await res.json();
    const ps = $('progressSection');
    if (ps) { ps.style.display = 'block'; }
    const pm = $('progressMsg');
    if (pm) pm.textContent = 'Starting download...';
    const pf = $('progressFill');
    if (pf) pf.style.width = '5%';
    pollJob(data.job_id);
    switchView('download');
  } catch(e) { showToast('Connection error'); }
  resetBtn();
}

// ============ DOWNLOAD FLOW ============
const searchToggle = document.getElementById('searchToggleBtn') || document.getElementById('searchToggle');
if (searchToggle) {
  searchToggle.addEventListener('click', () => {
    const el = document.getElementById('searchOverlay');
    if (el) {
      el.classList.toggle('hidden');
      if (!el.classList.contains('hidden')) setTimeout(() => el.querySelector('input')?.focus(), 100);
    }
  });
}

const searchInputs = [document.getElementById('searchInput'), document.getElementById('librarySearchInput')].filter(Boolean);
searchInputs.forEach(input => {
  input.addEventListener('input', () => {
    searchInputs.forEach(other => { if (other !== input && other.value !== input.value) other.value = input.value; });
    filterLibrary(input.value);
  });
});

const urlInput = $('urlInput');
const startBtn = $('startDownload');
if (urlInput && startBtn) {
  urlInput.addEventListener('input', () => {
    const v = urlInput.value.trim();
    startBtn.disabled = !(v.startsWith('http://') || v.startsWith('https://'));
  });
  startBtn.addEventListener('click', handleDownloadClick);
}

async function handleDownloadClick() {
  const url = urlInput?.value.trim();
  if (!url) return;

  // First, check if it's a playlist (with timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max for preview
    
    const previewRes = await fetch(`${API}/api/playlist/preview`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (previewRes.ok) {
      const previewData = await previewRes.json();
      if (previewData.total_videos && previewData.total_videos > 1) {
        // Playlist with multiple videos → show selection modal
        showPlaylistModal(previewData);
        return;
      }
    }
  } catch(e) {
    // Preview failed or timed out → proceed with direct download
    console.log('Preview failed, proceeding with direct download', e);
  }
  
  // Single video download
  startBtn.disabled = true;
  startBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Processing...`;
  try {
    const res = await fetch(`${API}/api/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url, selected_videos: []}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('Error: ' + (err.detail || 'unknown'));
      resetBtn();
      return;
    }
    const data = await res.json();
    const ps = $('progressSection');
    if (ps) ps.style.display = 'block';
    const pm = $('progressMsg');
    if (pm) pm.textContent = 'Starting download...';
    const pf = $('progressFill');
    if (pf) pf.style.width = '5%';
    pollJob(data.job_id);
    switchView('download');
  } catch(e) { showToast('Connection error'); }
  resetBtn();
}

function resetBtn() {
  if (!startBtn) return;
  startBtn.disabled = false;
  startBtn.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">download</span> Download & Segment`;
}

function pollJob(jobId) {
  if (pollingJobs[jobId]) return;
  pollingJobs[jobId] = true;
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/status/${jobId}`);
      const job = await res.json();
      const pf = $('progressFill');
      if (pf) pf.style.width = `${job.progress}%`;
      const pm = $('progressMsg');
      if (pm) pm.textContent = job.message || job.status;
      const tp = $('tracksPreview');
      if (tp && job.tracks) {
        tp.innerHTML = job.tracks.map(t => `<div class="track-chip">${t.num}. ${t.name}</div>`).join('');
      }
      if (job.status === 'completed' || job.status === 'error') {
        clearInterval(interval);
        delete pollingJobs[jobId];
        resetBtn();
        showToast(job.status === 'completed' ? `✅ ${job.tracks?.length || 0} tracks saved` : `❌ ${job.error || 'Error'}`);
        if (job.status === 'completed') { loadLibrary(); updateStats(); loadJobs(); }
      }
    } catch(e) {}
  }, 1500);
}

// ============ JOBS ============
async function loadJobs() {
  const list = $('jobsList');
  if (!list) return;
  try {
    const res = await fetch(`${API}/api/jobs`);
    const data = await res.json();
    const jobs = data.jobs || [];
    const active = jobs.filter(j => j.status !== 'completed' && j.status !== 'error');
    const badge = $('jobsBadge');
    if (badge) { if (active.length > 0) { badge.textContent = active.length; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); } }
    const topBadge = $('topJobsBadge');
    if (topBadge) { if (active.length > 0) { topBadge.textContent = active.length; topBadge.classList.remove('hidden'); } else { topBadge.classList.add('hidden'); } }
    if (jobs.length === 0) {
      list.innerHTML = `<div class="text-center py-16 text-on-surface-variant"><span class="material-symbols-outlined text-6xl opacity-30">sync</span><p class="mt-4">No processes</p></div>`;
      return;
    }
    jobs.forEach(j => { if (j.status !== 'completed' && j.status !== 'error') pollJob(j.id); });
    list.innerHTML = jobs.slice().reverse().map(j => {
      const isActive = j.status !== 'completed' && j.status !== 'error';
      const statusIcon = j.status === 'completed' ? '✅' : j.status === 'error' ? '❌' : '🔄';
      const statusMsg = j.status === 'completed' ? (j.tracks?.length || 0) + ' tracks'
        : j.status === 'error' ? (j.error || 'Error').slice(0,30)
        : j.message || j.status || '...';
      return `<div class="tool-btn ${!isActive ? '' : 'border-primary-container/30'}">
        <span>${statusIcon}</span>
        <span class="flex-1 truncate text-body-sm">${j.url?.slice(0,50) || 'Job ' + j.id.slice(-8)}</span>
        <span class="text-[11px] text-on-surface-variant whitespace-nowrap">${statusMsg}</span>
      </div>`;
    }).join('');
  } catch(e) {}
}

async function clearJobs() {
  if (!confirm('Limpiar todos los procesos?')) return;
  try {
    const res = await fetch(`${API}/api/jobs/clear`, { method: 'POST' });
    if (res.ok) {
      showToast('🧹 Procesos limpiados');
      loadJobs();
    } else {
      showToast('Error al limpiar');
    }
  } catch(e) { showToast('Error'); }
}

// ============ STATS ============
async function updateStats() {
  try {
    const res = await fetch(`${API}/api/library`);
    const data = await res.json();
    const totalAlbums = data.albums?.length || 0;
    const totalTracks = data.albums?.reduce((s,a) => s + a.track_count, 0) || 0;
    const sa = $('statAlbums');
    if (sa) sa.textContent = totalAlbums || '0';
    const st = $('statTracks');
    if (st) st.textContent = totalTracks || '0';
    const jobsRes = await fetch(`${API}/api/jobs`);
    const jobsData = await jobsRes.json();
    const active = (jobsData.jobs || []).filter(j => j.status !== 'completed' && j.status !== 'error');
    const sac = $('statActive');
    if (sac) sac.textContent = active.length;
    const san = $('statActiveName');
    if (san) san.textContent = active.length > 0 ? `${active.length} active` : 'Idle';
    const sp = $('statProgress');
    if (sp) { sp.style.width = `${Math.max(0, Math.min(100, active.length ? Math.round(active.reduce((sum, job) => sum + Number(job.progress || 0), 0) / active.length) : 0))}%`; }
  } catch(e) {}
}

// ============ MANAGEMENT VIEW ============
async function openManageCleanup() {
  switchView('manage');
  await loadManageView();
}

async function loadManageView() {
  await Promise.all([
    loadDeleteAlbumList(),
    loadSystemInfo(),
  ]);
}

async function loadDeleteAlbumList() {
  const list = document.getElementById('deleteAlbumList');
  if (!list) return;
  try {
    const res = await fetch(`${API}/api/library`);
    const data = await res.json();
    window._deleteAlbums = data.albums || [];
    renderDeleteList(window._deleteAlbums);
  } catch(e) {
    list.innerHTML = '<div class="text-center py-4 text-red-400">Error loading albums</div>';
  }
}

function renderDeleteList(albums) {
  const list = document.getElementById('deleteAlbumList');
  if (!list) return;
  if (albums.length === 0) {
    list.innerHTML = '<div class="text-center py-8 text-on-surface-variant"><span class="material-symbols-outlined text-4xl opacity-30">library_music</span><p class="mt-2">No albums</p></div>';
    return;
  }
  list.innerHTML = albums.map(a => {
    const safeName = encodeURIComponent(a.name);
    const displayName = escapeHtml(a.name);
    return `<div class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-glass transition-colors group cursor-pointer" onclick="deleteAlbumFromManage('${safeName}')" title="Click para borrar">
      <span class="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-red-400 transition-colors">delete</span>
      <span class="flex-1 text-body-sm truncate">${displayName}</span>
      <span class="text-[11px] text-on-surface-variant">${a.track_count} tracks</span>
    </div>`;
  }).join('');
}

function filterDeleteList(query) {
  const q = (query || '').trim().toLowerCase();
  const all = window._deleteAlbums || [];
  if (!q) {
    renderDeleteList(all);
    return;
  }
  const filtered = all.filter(a => a.name.toLowerCase().includes(q));
  renderDeleteList(filtered);
}

async function deleteAlbumFromManage(encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`¿Borrar "${name}"?`)) return;
  try {
    const res = await fetch(`${API}/api/library/delete-album?album_name=${encodeURIComponent(name)}`, { method:'DELETE' });
    if (res.ok) {
      showToast(`🗑️ "${name}" eliminado`);
      await loadDeleteAlbumList();
      await loadSystemInfo();
      setTimeout(() => rescanNavidrome(), 1000);
    } else {
      showToast('❌ Error al borrar');
    }
  } catch(e) { showToast('❌ Error de conexión'); }
}

async function loadSystemInfo() {
  try {
    const [libRes, healthRes, navRes] = await Promise.all([
      fetch(`${API}/api/library`),
      fetch(`${API}/api/health`),
      fetch(`https://navidrome.jazzone.click/rest/ping?u=admin&p=jistev2024!&v=1.16.0&c=cli`).catch(() => null),
    ]);
    const lib = await libRes.json();
    const health = await healthRes.json();
    const albums = lib.albums || [];
    const totalAlbums = albums.length;
    const totalTracks = albums.reduce((s,a) => s + a.track_count, 0);

    const elVer = document.getElementById('sysVersion');
    if (elVer) elVer.textContent = health.version || '?';
    const elAlb = document.getElementById('sysAlbums');
    if (elAlb) elAlb.textContent = totalAlbums;
    const elTrk = document.getElementById('sysTracks');
    if (elTrk) elTrk.textContent = totalTracks;

    const elNav = document.getElementById('sysNavidrome');
    if (elNav) {
      if (navRes && navRes.ok) {
        const text = await navRes.text();
        if (text.includes('status="ok"')) elNav.textContent = '✅ Connected';
        else elNav.textContent = '⚠️ Error';
      } else {
        elNav.textContent = '❌ Disconnected';
      }
    }
  } catch(e) {}
}

// ============ MODAL ============
document.addEventListener('click', (e) => {
  if (e.target.closest('.modal-overlay') && !e.target.closest('.modal-content')) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    const player = $('audioPlayer');
    if (player) player.pause();
  }
});
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal-overlay');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    const player = $('audioPlayer');
    if (player) player.pause();
  });
});

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  loadLibrary();
  updateStats();
  loadJobs();
  setInterval(loadJobs, 30000);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const so = document.getElementById('searchOverlay');
      if (so && !so.classList.contains('hidden')) so.classList.add('hidden');
    }
  });
});

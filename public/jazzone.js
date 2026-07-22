/*
  JazzOne · Full Pipeline Logic v1.3
  Album Player: Box Player-style album playback + queue
*/
const API = window.location.origin;
let currentView = 'library';
let libraryCache = null;
let currentSort = 'latest';
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

// ============ ALBUM PLAYER ENGINE ============
const player = {
  album: '',
  albumCover: '',
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  isFullScreen: false,
};

function initPlayerEngine() {
  const audio = $('audioPlayer');
  if (!audio) return;

  audio.addEventListener('ended', onTrackEnd);
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('loadedmetadata', onLoadedMetadata);
  audio.addEventListener('play', () => { player.isPlaying = true; updatePlayerUI(); startVisualizer(); });
  audio.addEventListener('pause', () => { player.isPlaying = false; updatePlayerUI(); stopVisualizer(); });

  // Mini player click → open full player
  const mpInner = $('miniPlayerInner');
  if (mpInner) {
    mpInner.addEventListener('click', (e) => {
      if (player.album) toggleFullPlayer();
    });
  }

  // Init audio context for equalizer + visualizer on first user interaction
  let vizInitialized = false;
  const initViz = () => {
    if (!vizInitialized) {
      initEQ();
      vizInitialized = true;
    }
  };
  document.addEventListener('click', initViz, { once: true });
  document.addEventListener('touchstart', initViz, { once: true });
}

function playAlbum(encodedName) {
  const name = decodeURIComponent(encodedName);
  const album = libraryCache?.find(a => a.name === name);
  if (!album) { showToast('Album not found'); return; }
  // Toggle pause if already playing this album
  const audio = $('audioPlayer');
  if (player.album === encodedName && player.tracks.length > 0 && player.isPlaying) {
    audio.pause();
    return;
  }
  if (player.album === encodedName && player.tracks.length > 0 && !player.isPlaying) {
    audio.play().catch(() => {});
    return;
  }
  playAlbumTracks(encodedName, 0);
}

async function playAlbumTracks(encodedName, startIndex) {
  const name = decodeURIComponent(encodedName);
  const album = libraryCache?.find(a => a.name === name);
  try {
    const res = await fetch(`${API}/api/library/` + encodeURIComponent(name) + '/tracks');
    const data = await res.json();
    if (!data.tracks || data.tracks.length === 0) { showToast('No tracks'); return; }
    player.album = encodedName;
    player.albumCover = album?.cover || '';
    player.tracks = data.tracks;
    player.currentIndex = Math.min(startIndex, data.tracks.length - 1);
    playCurrentTrack();
    $('miniPlayer').style.display = 'flex';
    updateAlbumModalTrackList();
    updateFullPlayerInfo();
  } catch(e) { showToast('Error loading tracks'); }
}

function playCurrentTrack() {
  const audio = $('audioPlayer');
  if (!audio || player.currentIndex < 0 || player.currentIndex >= player.tracks.length) return;
  const track = player.tracks[player.currentIndex];
  audio.src = `${API}/api/library/${player.album}/${encodeSegment(track)}`;
  player.isPlaying = true;
  audio.play().catch(() => { player.isPlaying = false; });

  const trackName = decodeURIComponent(track).replace('.m4a','');
  const albumName = decodeURIComponent(player.album);
  $('playerTrackName').textContent = trackName;
  $('playerAlbumName').textContent = albumName;

  // Mini player art
  const miniArt = $('miniAlbumArt');
  if (miniArt) miniArt.src = player.albumCover || '';

  updateFullPlayerInfo();
  updateAlbumModalTrackList();
  updatePlayerUI();
}

function onTrackEnd() {
  if (player.currentIndex < player.tracks.length - 1) { nextTrack(); }
  else {
    $('audioPlayer').currentTime = 0;
    player.isPlaying = false;
    updatePlayerUI();
  }
}

function nextTrack() {
  if (player.currentIndex < player.tracks.length - 1) { player.currentIndex++; playCurrentTrack(); }
  else { showToast('End of album'); }
}

function prevTrack() {
  const audio = $('audioPlayer');
  // If more than 3s in, restart track; else go to previous
  if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (player.currentIndex > 0) { player.currentIndex--; playCurrentTrack(); }
}

function seekTrack(seconds) {
  const audio = $('audioPlayer');
  if (audio && audio.duration) audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
}

// ============ CANVAS VISUALIZER ============
let vizCtx = null;
let vizSource = null;
let vizAnalyser = null;
let vizAnimId = null;
let vizCanvas = null;

function initVisualizer() {
  const audio = $('audioPlayer');
  if (!audio) return;
  try {
    vizCtx = new (window.AudioContext || window.webkitAudioContext)();
    vizSource = vizCtx.createMediaElementSource(audio);
    vizAnalyser = vizCtx.createAnalyser();
    vizAnalyser.fftSize = 256;
    vizSource.connect(vizAnalyser);
    vizAnalyser.connect(vizCtx.destination);
  } catch(e) { /* audio context may already exist */ }
}

function startVisualizer() {
  const canvas = $('fpVisualizer');
  if (!canvas) return;
  vizCanvas = canvas;
  // Resume context if suspended (autoplay policy)
  if (vizCtx && vizCtx.state === 'suspended') vizCtx.resume();
  if (!vizAnalyser) return;
  if (vizAnimId) return; // already running
  drawViz();
}

function stopVisualizer() {
  if (vizAnimId) { cancelAnimationFrame(vizAnimId); vizAnimId = null; }
  // Clear canvas
  const canvas = $('fpVisualizer');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawViz() {
  const canvas = vizCanvas;
  if (!canvas || !vizAnalyser) { vizAnimId = null; return; }
  
  // Size canvas to match display
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) { vizAnimId = null; return; }
  
  const bufferLength = vizAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  vizAnalyser.getByteFrequencyData(dataArray);

  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw frequency bars
  const barCount = 48;
  const barWidth = (w / barCount) * 0.8;
  const gap = (w / barCount) * 0.2;
  
  for (let i = 0; i < barCount; i++) {
    // Map to frequency bins (skip DC ~0)
    const idx = Math.floor((i / barCount) * bufferLength * 0.6) + 2;
    const val = dataArray[idx] || 0;
    const barHeight = Math.max(1, (val / 255) * h);
    
    const x = i * (barWidth + gap);
    const y = h - barHeight;
    
    // Gradient from purple to teal
    const t = i / barCount;
    ctx.fillStyle = `rgba(${Math.floor(168 + t * -40)}, ${Math.floor(139 + t * 100)}, ${Math.floor(250 - t * 50)}, 0.7)`;
    ctx.fillRect(x, y, barWidth, barHeight);
  }
  
  vizAnimId = requestAnimationFrame(drawViz);
}

// ============ EQUALIZER ============
let eqFilters = [];
let eqOpen = false;
const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

function initEQ() {
  const audio = $('audioPlayer');
  if (!audio) return;
  
  // Build sliders UI regardless of AudioContext availability
  buildEQSliders([]);
  
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    
    let lastNode = source;
    const filters = EQ_FREQS.map(freq => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      lastNode.connect(filter);
      lastNode = filter;
      return filter;
    });
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    lastNode.connect(analyser);
    analyser.connect(ctx.destination);
    
    eqFilters = filters;
    vizCtx = ctx;
    vizAnalyser = analyser;
    
    // Rebuild sliders with actual filter values
    buildEQSliders(filters);
  } catch(e) {
    // Visualizer fallback: create a separate audio-only analyser path
    console.warn('EQ init failed, visualizer may not work:', e.message);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      vizCtx = ctx;
      vizAnalyser = analyser;
    } catch(e2) {
      console.warn('Visualizer fallback also failed');
    }
  }
}

function buildEQSliders(filters) {
  const container = $('eqSliders');
  if (!container) return;
  container.innerHTML = EQ_FREQS.map((freq, i) => {
    const db = filters[i]?.gain?.value || 0;
    const pct = ((db + 12) / 24) * 100;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;position:relative">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:3px;background:rgba(255,255,255,0.06);height:100%;border-radius:2px"></div>
      <div id="eqFill${i}" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:3px;background:linear-gradient(to top,#a78bfa,#e879f9);border-radius:2px;height:${pct}%;transition:height 0.1s"></div>
      <input type="range" min="-12" max="12" value="${db}" step="0.5" orient="vertical"
        oninput="updateEQ(${i}, this.value)"
        style="position:absolute;bottom:0;left:0;right:0;height:100%;width:100%;writing-mode:vertical-lr;direction:rtl;-webkit-appearance:slider-vertical;margin:0;padding:0;opacity:0.6;cursor:pointer;z-index:2;background:transparent;accent-color:#a78bfa">
      <span id="eqVal${i}" style="position:absolute;top:-2px;font-size:7px;color:rgba(212,192,215,0.4);z-index:1">${db >= 0 ? '+' : ''}${db}</span>
    </div>`;
  }).join('');
}

function updateEQ(index, value) {
  const v = parseFloat(value);
  if (eqFilters[index]) eqFilters[index].gain.value = v;
  const fill = $(`eqFill${index}`);
  if (fill) fill.style.height = `${((v + 12) / 24) * 100}%`;
  const val = $(`eqVal${index}`);
  if (val) val.textContent = `${v >= 0 ? '+' : ''}${v}`;
}

function resetEQ() {
  eqFilters.forEach((f, i) => {
    f.gain.value = 0;
    const fill = $(`eqFill${i}`);
    if (fill) fill.style.height = '50%';
    const val = $(`eqVal${i}`);
    if (val) val.textContent = '+0';
    const input = document.querySelector(`#eqSliders input:nth-child(${i + 1})`);
    if (input) input.value = '0';
  });
}

function toggleEQ() {
  eqOpen = !eqOpen;
  const sec = $('eqSection');
  if (sec) sec.style.maxHeight = eqOpen ? '120px' : '0';
  // Highlight button
  const btn = $('eqToggleBtn');
  if (btn) btn.style.color = eqOpen ? 'rgba(168,85,247,0.8)' : 'rgba(255,255,255,0.4)';
}

function downloadAllAlbumFromPlayer() {
  if (player.album) downloadAllAlbum(player.album);
}

function onTimeUpdate() {
  const audio = $('audioPlayer');
  if (!audio || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  const sf = $('fpSeekFill'); if (sf) sf.style.width = `${pct}%`;
  const mf = $('miniSeekFill'); if (mf) mf.style.width = `${pct}%`;

  const ce = $('playerCurrentTime'); if (ce) ce.textContent = formatTime(audio.currentTime);
  const te = $('playerTotalTime');
  if (te && te.textContent === '--:--') te.textContent = formatTime(audio.duration);

  // Update total time continuously (in case loadedmetadata fired before our listener)
  if (te && audio.duration) te.textContent = formatTime(audio.duration);
}

function onLoadedMetadata() {
  const audio = $('audioPlayer');
  $('playerTotalTime').textContent = audio ? formatTime(audio.duration) : '--:--';
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ============ PLAYER UI ============
function toggleFullPlayer() {
  if (!player.album) { showToast('Nothing playing'); return; }
  player.isFullScreen = !player.isFullScreen;
  const ov = $('fullPlayerOverlay');
  if (ov) {
    ov.classList.toggle('hidden', !player.isFullScreen);
    ov.classList.toggle('flex', player.isFullScreen);
    if (player.isFullScreen) updateFullPlayerInfo();
  }
}

function closeFullPlayer() {
  player.isFullScreen = false;
  const ov = $('fullPlayerOverlay');
  if (ov) { ov.classList.add('hidden'); ov.classList.remove('flex'); }
}

function updatePlayerUI() {
  const playing = player.isPlaying && player.tracks.length > 0;
  // Mini player play icon
  const pi = $('miniPlayerPlayIcon');
  if (pi) pi.innerHTML = playing
    ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 005.75 3zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/></svg>'
    : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>';

  // Full player play icon
  const fpi = $('fpPlayIcon');
  if (fpi) fpi.innerHTML = playing
    ? '<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 005.75 3zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/></svg>'
    : '<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>';
}

function updateFullPlayerInfo() {
  if (player.currentIndex < 0 || !player.tracks.length) return;
  const track = player.tracks[player.currentIndex];
  const trackName = decodeURIComponent(track).replace('.m4a','');
  const albumName = decodeURIComponent(player.album);

  const img = $('fpAlbumArt');
  if (img) {
    img.src = player.albumCover || '';
    img.onerror = function(){ this.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23222" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" font-size="60">🎵</text></svg>'; };
  }
  $('fpTrackName').textContent = trackName;
  $('fpAlbumName').textContent = albumName;
  $('fpTrackCount').textContent = `${player.currentIndex + 1} of ${player.tracks.length}`;
  $('fpTrackCountSmall').textContent = `${player.tracks.length} tracks`;
  $('fpTrackList').innerHTML = player.tracks.map((t,i) => {
    const n = decodeURIComponent(t).replace('.m4a','');
    const cur = i === player.currentIndex;
    return `<div class="fp-track ${cur?'fp-track-current':''}" onclick="playAlbumTrackAt(${i})">
      <span class="fp-track-num">${cur
        ? '<svg class="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>'
        : (i+1)}</span>
      <span class="fp-track-name ${cur?'text-purple-400':''}">${escapeHtml(n)}</span>
    </div>`;
  }).join('');
  updatePlayerUI();
}

function playAlbumTrackAt(index) {
  if (index >= 0 && index < player.tracks.length) { player.currentIndex = index; playCurrentTrack(); }
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

  const sorted = [...albums];
  if (currentSort === 'latest') sorted.reverse();

  grid.innerHTML = sorted.map(a => {
    const encodedName = encodeSegment(a.name);
    const displayName = escapeHtml(a.name);
    const isThisAlbum = player.album && decodeURIComponent(player.album) === a.name && player.tracks.length > 0;
    return '<div class="group relative w-full overflow-hidden rounded-xl bg-[rgba(255,255,255,0.03)] backdrop-blur-[12px] border ' + (isThisAlbum ? 'border-purple-500/40' : 'border-[rgba(255,255,255,0.08)]') + ' p-3 text-left transition-all duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(168,85,247,0.4)] hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.3)] cursor-pointer" onclick="openAlbum(\'' + encodedName + '\')">' +
      '<div class="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">' +
        '<img class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" src="' + (a.cover || '') + '" alt="' + displayName + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.className+=\' flex items-center justify-center bg-[#222] text-5xl\';this.parentElement.textContent=\'🎵\'">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">' +
          '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" onclick="event.stopPropagation();playAlbum(\'' + encodedName + '\')">' +
            (isThisAlbum && player.isPlaying
              ? '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 005.75 3zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/></svg>'
              : '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>'
            ) +
          '</div>' +
        '</div>' +
        (isThisAlbum ? '<div class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>' : '') +
      '</div>' +
      '<div class="px-1">' +
        '<h3 class="text-sm font-semibold truncate text-white/80 leading-tight">' + displayName + '</h3>' +
        '<div class="flex items-center justify-between mt-1">' +
          '<span class="text-[10px] font-semibold text-white/40 uppercase tracking-wider">' + a.track_count + ' Tracks</span>' +
          (isThisAlbum ? '<span class="text-[10px] text-purple-400 font-semibold">Now Playing</span>' : '<svg class="w-3.5 h-3.5 text-emerald-400/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ============ SEARCH ============
function filterLibrary(query) {
  currentLibraryQuery = query || '';
  if (!libraryCache) return;
  const q = currentLibraryQuery.trim().toLowerCase();
  const filtered = libraryCache.filter(a => {
    if (q && !a.name.toLowerCase().includes(q)) return false;
    return matchesLibraryFilter(a, currentLibraryFilter);
  });
  renderLibrary(filtered);
}

function matchesLibraryFilter(album, filter) {
  if (filter === 'all') return true;
  const n = String(album?.name || '').toLowerCase();
  if (filter === 'acid-jazz') return /acid|jazz|funk|soul/.test(n);
  if (filter === 'concerts') return /live|concert|festival|tour|session|koko|cercle/.test(n);
  if (filter === 'instrumental') return /instrumental|piano|guitar|solo|ambient|classical/.test(n);
  if (filter === 'podcast') return /podcast|talk|interview|radio/i.test(n);
  return true;
}

function setLibraryFilter(filter, btn) {
  currentLibraryFilter = filter;
  document.querySelectorAll('.library-filter').forEach(b => {
    b.classList.toggle('bg-purple-500/20', b === btn);
    b.classList.toggle('text-purple-300', b === btn);
    b.classList.toggle('border-purple-500/20', b === btn);
    b.classList.toggle('bg-white/5', b !== btn);
    b.classList.toggle('text-white/40', b !== btn);
    b.classList.toggle('border-white/10', b !== btn);
  });
  filterLibrary(currentLibraryQuery);
}

async function playFirstTrack() {
  const album = libraryCache?.[0];
  if (!album) { showToast('Empty'); return; }
  playAlbum(encodeSegment(album.name));
}

// ============ OPEN ALBUM → FULL PLAYER ============
async function openAlbum(encodedName) {
  const name = decodeURIComponent(encodedName);
  
  // Load album and open full player directly
  const album = libraryCache?.find(a => a.name === name);
  if (!album) { showToast('Album not found'); return; }
  
  // Load tracks
  try {
    const res = await fetch(`${API}/api/library/` + encodeURIComponent(name) + '/tracks');
    const data = await res.json();
    if (!data.tracks || data.tracks.length === 0) { showToast('No tracks'); return; }
    
    // Set player state
    player.album = encodedName;
    player.albumCover = album?.cover || '';
    player.tracks = data.tracks;
    player.currentIndex = player.currentIndex >= 0 ? player.currentIndex : 0;
    
    // Update full player UI
    updateFullPlayerInfo();
    
    // Open full player
    player.isFullScreen = true;
    const ov = $('fullPlayerOverlay');
    if (ov) { ov.classList.remove('hidden'); ov.classList.add('flex'); }
    
    // Show mini player
    $('miniPlayer').style.display = 'flex';
  } catch(e) { showToast('Error loading album'); }
}

function renderModalTrackList(list, encodedName, tracks) {
  list.innerHTML = tracks.map((t,i) => {
    const isCurrent = player.album && decodeURIComponent(player.album) === decodeURIComponent(encodedName) && i === player.currentIndex;
    return `<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5 ${isCurrent ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}">
      <span class="w-6 text-center text-xs font-medium ${isCurrent ? 'text-purple-400' : 'text-white/40'}">
        ${isCurrent ? '<svg class="w-3.5 h-3.5 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>' : (i+1)}
      </span>
      <span class="flex-1 truncate text-sm ${isCurrent ? 'text-purple-400' : 'text-white/80'}">${escapeHtml(t.replace('.m4a',''))}</span>
      <button class="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-purple-400 hover:bg-white/5 transition-all" onclick="event.stopPropagation();playAlbumTrackFromModal('${encodedName}', ${i})">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
      </button>
    </div>`;
  }).join('');
}

function updateAlbumModalTrackList() {
  const list = $('modalTrackList');
  const modal = $('albumModal');
  if (!list || !modal || modal.classList.contains('hidden')) return;
  const h2 = modal.querySelector('h2');
  if (!h2) return;
  renderModalTrackList(list, encodeSegment(h2.textContent || ''), player.tracks);
  // Update play-all button
  const btn = modal.querySelector('.album-play-all-btn');
  if (btn) {
    const isPlaying = player.isPlaying && decodeURIComponent(player.album) === encodeSegment(h2.textContent || '');
    btn.innerHTML = (isPlaying
      ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 005.75 3zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/></svg>'
      : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>')
      + (isPlaying ? ' Pause' : ' Play All');
  }
}

function playAlbumTrackFromModal(encodedName, index) {
  // If it's a different album, load it first
  if (player.album !== encodedName) { playAlbumTracks(encodedName, index); return; }
  if (index >= 0 && index < player.tracks.length) { player.currentIndex = index; playCurrentTrack(); }
}

// ============ DOWNLOAD ============
function downloadAllAlbum(encodedName) {
  const name = decodeURIComponent(encodedName);
  const a = document.createElement('a');
  a.href = `${API}/api/library/download-all?album_name=${encodeURIComponent(name)}`;
  a.download = `${name}.zip`;
  a.click();
  showToast('✅ Downloading ZIP...');
}

async function deleteAlbumFromDetail(encodedName) {
  if (!confirm('Delete this album?')) return;
  try {
    const res = await fetch(`${API}/api/library/delete-album?album_name=${encodeURIComponent(decodeURIComponent(encodedName))}`, { method:'DELETE' });
    if (res.ok) {
      showToast('🗑️ Deleted');
      document.getElementById('albumModal')?.classList.add('hidden');
      document.getElementById('albumModal')?.classList.remove('flex');
      loadLibrary(); updateStats();
      setTimeout(() => rescanNavidrome(), 1000);
    }
  } catch(e) { showToast('Connection error'); }
}

// ============ NAV / RESCAN / LOGS ============
function openNavidrome() { window.open('https://navidrome.jazzone.click', '_blank'); }
async function rescanNavidrome() {
  try {
    const r = await fetch(`${API}/api/rescan`, { method:'POST' });
    const d = await r.json();
    showToast(d.status === 'scanning' ? '🔄 Rescanning...' : 'Error');
  } catch(e) { showToast('Connection error'); }
}

async function openLogs() {
  $('logModal').classList.remove('hidden'); $('logModal').classList.add('flex');
  await refreshLogs();
}

async function refreshLogs() {
  const content = $('logContent');
  content.innerHTML = '<div class="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto my-8"></div>';
  try {
    const r = await fetch(`${API}/api/logs?lines=200`);
    const d = await r.json();
    if (d.error) { content.textContent = 'Error: ' + d.error; return; }
    if (!d.logs?.length) { content.textContent = '(no logs)'; return; }
    content.innerHTML = d.logs.map(l => {
      l = l.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (l.includes('ERROR')) return '<span class="text-red-400">'+l+'</span>';
      if (l.includes('WARNING')) return '<span class="text-yellow-400">'+l+'</span>';
      if (l.includes('INFO')) return '<span class="text-green-400/70">'+l+'</span>';
      return l;
    }).join('');
    content.scrollTop = content.scrollHeight;
  } catch(e) { content.textContent = 'Error: ' + e.message; }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#logModal') && !e.target.closest('.modal-content')) {
    $('logModal').classList.add('hidden'); $('logModal').classList.remove('flex');
  }
  if (e.target.closest('#fullPlayerOverlay') && !e.target.closest('.full-player-content')) {
    closeFullPlayer();
  }
});
document.querySelectorAll('#logModal .modal-close').forEach(b => {
  b.addEventListener('click', () => { $('logModal').classList.add('hidden'); $('logModal').classList.remove('flex'); });
});

async function cleanupStale() {
  const btn = document.querySelector('[onclick*="cleanupStale"]');
  if (btn) btn.style.opacity = '0.5';
  try {
    const r = await fetch(`${API}/api/cleanup-stale`, { method:'POST' });
    const d = await r.json();
    if (d.status === 'ok') showToast(d.ta !== undefined ? `🧹 ${d.ta} albums, ${d.tm} tracks` : '🧹 Cleaned', 4000);
    else showToast('❌ ' + (d.detail || 'error'));
  } catch(e) { showToast('❌ Connection error'); }
  if (btn) btn.style.opacity = '1';
}

// ============ MODALS ============
document.addEventListener('click', (e) => {
  // Close modals on overlay click
  if (e.target.closest('.modal-overlay') && !e.target.closest('.modal-content')) {
    const m = document.querySelector('.modal-overlay:not(.hidden)');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  }
  // Close modals on .modal-close click (event delegation)
  if (e.target.closest('.modal-close')) {
    const m = e.target.closest('.modal-overlay');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  }
  // Close full player on overlay click
  if (e.target.closest('#fullPlayerOverlay') && !e.target.closest('#fullPlayerOverlay > div')) {
    closeFullPlayer();
  }
});

// ============ NAVIGATION / SORT ============
document.querySelectorAll('[data-sort]').forEach(b => {
  b.addEventListener('click', () => {
    currentSort = b.dataset.sort;
    loadLibrary();
  });
});

// ============ MANAGE VIEW ============
function openManageCleanup() { switchView('manage'); }

async function loadManageView() {
  // Load delete list
  const list = $('deleteAlbumList');
  if (!list) return;
  try {
    const r = await fetch(`${API}/api/library`);
    const d = await r.json();
    const albums = d.albums || [];
    if (albums.length === 0) { list.innerHTML = '<p class="text-xs text-white/30 text-center py-4">No albums</p>'; return; }
    list.innerHTML = albums.map(a =>
      `<div class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onclick="deleteAlbum('${encodeSegment(a.name)}')">
        <span class="text-sm text-white/70">${escapeHtml(a.name)}</span>
        <span class="text-[10px] text-white/30">${a.track_count} tracks</span>
      </div>`
    ).join('');
  } catch(e) { list.innerHTML = '<p class="text-xs text-red-400/70">Error loading</p>'; }
}

function filterDeleteList(query) {
  const items = document.querySelectorAll('#deleteAlbumList > div');
  const q = query.toLowerCase().trim();
  items.forEach(el => { el.style.display = (!q || el.textContent.toLowerCase().includes(q)) ? '' : 'none'; });
}

async function deleteAlbum(encodedName) {
  if (!confirm(`Delete "${decodeURIComponent(encodedName)}"?`)) return;
  try {
    const r = await fetch(`${API}/api/library/delete-album?album_name=${encodeURIComponent(decodeURIComponent(encodedName))}`, { method:'DELETE' });
    if (r.ok) {
      showToast('🗑️ Deleted');
      loadLibrary(); updateStats(); loadManageView();
      setTimeout(() => rescanNavidrome(), 1000);
    }
  } catch(e) { showToast('Connection error'); }
}

// ============ IMPORT / DROP ============
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

async function handleDrop(event) {
  event.preventDefault(); event.stopPropagation();
  const zone = $('dropZone');
  zone.style.borderColor = 'rgba(255,255,255,0.1)'; zone.style.background = '';
  const items = event.dataTransfer?.items;
  if (!items?.length) { showToast('⚠️ Drop music folder from Finder'); return; }
  showToast('📂 Reading folder...');
  const files = await getFilesFromDataTransfer(items);
  if (!files.length) { showToast('⚠️ No audio files found'); return; }
  await uploadFiles(files);
}

async function getFilesFromDataTransfer(items) {
  const exts = new Set(['.mp3','.m4a','.flac','.ogg','.wav','.wma','.aac','.opus']);
  const all = [], q = [];
  for (let i = 0; i < items.length; i++) { const e = items[i].webkitGetAsEntry?.(); if (e) q.push(e); }
  while (q.length) {
    const e = q.shift();
    if (e.isFile) {
      const f = await new Promise(r => e.file(r));
      if (exts.has(f.name.substring(f.name.lastIndexOf('.')).toLowerCase())) all.push(f);
    } else if (e.isDirectory) {
      const reader = e.createReader();
      let entries = await new Promise(r => reader.readEntries(r));
      while (entries.length) { q.push(...entries); entries = await new Promise(r => reader.readEntries(r)); }
    }
  }
  return all;
}

async function handleFileSelect(event) {
  const files = event.target?.files;
  if (!files?.length) return;
  showToast(`📂 ${files.length} files selected`);
  await uploadFiles(files);
}

async function uploadFiles(fileList) {
  const fd = new FormData();
  let totalSize = 0;
  for (const f of fileList) { fd.append('files', f); totalSize += f.size; }

  const zone = $('dropZone'), content = $('dropZoneContent'), progress = $('uploadProgress');
  const fill = $('uploadProgressFill'), msg = $('uploadProgressMsg');
  const status = $('uploadStatus'), fileListEl = $('uploadFileList');

  content.classList.add('hidden'); progress.classList.remove('hidden'); fill.style.width = '0%';
  status.textContent = `Uploading ${fileList.length} files (${(totalSize/1024/1024).toFixed(1)} MB)...`;
  msg.textContent = 'Connecting...'; fileListEl.innerHTML = '';
  let shown = 0;
  for (const f of fileList) {
    if (shown++ > 15) { fileListEl.innerHTML += '<span class="track-chip">+ more...</span>'; break; }
    fileListEl.innerHTML += `<span class="track-chip">${f.name}</span>`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);
    const res = await fetch(`${API}/api/import/upload`, { method:'POST', body: fd, signal: controller.signal });
    clearTimeout(timeout);
    fill.style.width = '100%';

    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      msg.textContent = '❌ ' + (err.detail || `HTTP ${res.status}`);
      status.textContent = 'Error';
      setTimeout(() => { content.classList.remove('hidden'); progress.classList.add('hidden'); }, 4000);
      return;
    }

    const data = await res.json();
    if (data.status === 'ok') {
      msg.textContent = `✅ ${data.tracks} tracks into ${data.album_count} albums`;
      status.textContent = 'Complete';
      if (data.rescan) showToast('🔄 Rescanning...', 4000);
      setTimeout(() => { loadLibrary(); updateStats(); }, 2000);
    } else {
      msg.textContent = '❌ Import error';
      status.textContent = 'Error';
    }
  } catch(e) {
    if (e.name === 'AbortError') msg.textContent = '❌ Timeout after 5min';
    else msg.textContent = '❌ ' + (e.message || '');
    status.textContent = 'Error';
  }
  setTimeout(() => { content.classList.remove('hidden'); progress.classList.add('hidden'); fileListEl.innerHTML = ''; fill.style.width = '0%'; }, 8000);
}

// ============ DOWNLOAD FLOW ============
const searchToggle = $('searchToggleBtn');
if (searchToggle) {
  searchToggle.addEventListener('click', () => {
    const el = $('searchOverlay');
    if (el) {
      el.classList.toggle('hidden');
      if (!el.classList.contains('hidden')) setTimeout(() => el.querySelector('input')?.focus(), 100);
    }
  });
}

const searchInputs = [$('searchInput'), $('librarySearchInput')].filter(Boolean);
searchInputs.forEach(input => {
  input.addEventListener('input', () => {
    searchInputs.forEach(o => { if (o !== input && o.value !== input.value) o.value = input.value; });
    filterLibrary(input.value);
  });
});

const urlInput = $('urlInput'), startBtn = $('startDownload');
if (urlInput && startBtn) {
  urlInput.addEventListener('input', () => {
    const v = urlInput.value.trim();
    startBtn.disabled = !(v.includes('youtube.com') || v.includes('youtu.be'));
  });
  startBtn.addEventListener('click', startDownloadJob);
}

async function startDownloadJob() {
  const url = urlInput?.value.trim(); if (!url) return;
  startBtn.disabled = true;
  startBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...';
  try {
    const r = await fetch(`${API}/api/download`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url})
    });
    if (!r.ok) { const e = await r.json(); showToast('Error: ' + (e.detail||'unknown')); resetBtn(); return; }
    const d = await r.json();
    const ps = $('progressSection');
    if (ps) { ps.style.display = 'block'; if ($('progressMsg')) $('progressMsg').textContent = 'Starting...'; if ($('progressFill')) $('progressFill').style.width = '5%'; }
    pollJob(d.job_id);
    showToast('📥 Download started');
  } catch(e) { showToast('Connection error'); }
  resetBtn();
}

function resetBtn() {
  if (!startBtn) return;
  startBtn.disabled = false;
  startBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><span>Download & Segment</span>';
}

function pollJob(jobId) {
  if (pollingJobs[jobId]) return;
  pollingJobs[jobId] = true;
  const interval = setInterval(async () => {
    try {
      const r = await fetch(`${API}/api/status/${jobId}`);
      const j = await r.json();
      if ($('progressFill')) $('progressFill').style.width = `${j.progress}%`;
      if ($('progressMsg')) $('progressMsg').textContent = j.message || j.status;
      if (j.tracks && $('tracksPreview')) {
        $('tracksPreview').innerHTML = j.tracks.map(t => `<span class="track-chip">${t.num}. ${t.name}</span>`).join('');
      }
      if (j.status === 'completed' || j.status === 'error') {
        clearInterval(interval); delete pollingJobs[jobId]; resetBtn();
        showToast(j.status === 'completed' ? `✅ ${j.tracks?.length||0} tracks saved` : `❌ ${j.error||'Error'}`);
        if (j.status === 'completed') { loadLibrary(); updateStats(); }
      }
    } catch(e) {}
  }, 1500);
}

// ============ JOBS ============
function clearJobs() {
  if (!confirm('Clear all jobs?')) return;
  // Just reload - jobs are ephemeral on the server anyway
  if ($('jobsList')) $('jobsList').innerHTML = '<div class="text-center py-6 text-white/20 text-sm">Cleared</div>';
}

async function loadJobs() {
  const list = $('jobsList');
  if (!list || currentView !== 'download') return;
  try {
    const r = await fetch(`${API}/api/jobs`);
    const d = await r.json();
    const jobs = d.jobs || [];
    const active = jobs.filter(j => j.status !== 'completed' && j.status !== 'error');
    jobs.forEach(j => { if (j.status !== 'completed' && j.status !== 'error') pollJob(j.id); });
    if (jobs.length === 0) {
      list.innerHTML = '<div class="text-center py-6 text-white/20 text-sm"><svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>No processes</div>';
      return;
    }
    list.innerHTML = jobs.slice().reverse().map(j =>
      '<div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">' +
        '<div class="w-2 h-2 rounded-full ' + (j.status === 'completed' ? 'bg-emerald-400' : j.status === 'error' ? 'bg-red-400' : 'bg-purple-400 animate-pulse') + '"></div>' +
        '<div class="flex-1 min-w-0"><p class="text-sm text-white/70 truncate">' + (j.info?.title || j.url?.slice(0,60) || 'Job') + '</p>' +
        '<p class="text-[10px] text-white/30">' + (j.status === 'completed' ? '✅ Complete' : j.status === 'error' ? '❌ Error' : j.message || j.status) + '</p></div>' +
        (j.tracks ? '<span class="text-[10px] text-white/30">' + j.tracks.length + ' tracks</span>' : '') +
      '</div>'
    ).join('');
  } catch(e) {}
}

// ============ STATS ============
async function updateStats() {
  try {
    const r = await fetch(`${API}/api/library`);
    const d = await r.json();
    const totalAlbums = d.albums?.length || 0;
    const totalTracks = d.albums?.reduce((s,a) => s + a.track_count, 0) || 0;
    if ($('statAlbums')) $('statAlbums').textContent = totalAlbums || '0';
    if ($('statTracks')) $('statTracks').textContent = totalTracks || '0';
    if ($('sysAlbums')) $('sysAlbums').textContent = totalAlbums || '0';
    if ($('sysTracks')) $('sysTracks').textContent = totalTracks || '0';

    const jr = await fetch(`${API}/api/jobs`);
    const jd = await jr.json();
    const active = (jd.jobs || []).filter(j => j.status !== 'completed' && j.status !== 'error');
    if ($('statActive')) $('statActive').textContent = active.length;
    if ($('statActiveName')) $('statActiveName').textContent = active.length > 0 ? `${active.length} active` : 'Idle';
    if ($('statProgress')) {
      const p = active.length ? Math.round(active.reduce((s,j) => s + Number(j.progress||0), 0) / active.length) : 0;
      $('statProgress').style.width = `${Math.max(0,Math.min(100,p))}%`;
    }
  } catch(e) {}
}

// ============ INIT ============
function bootApp() {
  initPlayerEngine();
  loadLibrary();
  updateStats();
  loadJobs();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('fullPlayerOverlay') && !$('fullPlayerOverlay').classList.contains('hidden')) closeFullPlayer();
      if ($('searchOverlay') && !$('searchOverlay').classList.contains('hidden')) $('searchOverlay').classList.add('hidden');
    }
    if ((e.key === ' ' || e.key === 'Space') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const a = $('audioPlayer');
      if (a && player.tracks.length > 0) { if (a.paused) a.play().catch(()=>{}); else a.pause(); }
    }
    if (e.key === 'ArrowRight' && e.target.tagName !== 'INPUT') { e.preventDefault(); nextTrack(); }
    if (e.key === 'ArrowLeft' && e.target.tagName !== 'INPUT') { e.preventDefault(); prevTrack(); }
  });
}

// Boot immediately (DOM is already loaded when jazzone.js loads dynamically)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

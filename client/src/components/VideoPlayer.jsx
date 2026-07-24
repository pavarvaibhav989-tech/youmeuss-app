import { useRef, useEffect, useCallback, useState } from 'react';

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Extract YouTube video ID from any YouTube URL format.
 */
function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || null;
    }
  } catch { /* not a URL */ }
  // Also try regex for edge cases
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Normalize any video URL to the cleanest form.
 * Strips tracking params from YouTube URLs.
 */
function normalizeUrl(url) {
  if (!url) return null;
  // Blob URLs from file uploads — pass through as-is
  if (url.startsWith('blob:')) return url;
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/watch?v=${ytId}`;
  const trimmed = url.trim();
  return trimmed || null;
}

// ─── YouTube IFrame Player API (singleton loader) ─────────────────────────────

let ytApiLoaded = false;
const ytApiQueue = [];

/**
 * Load the YouTube IFrame Player API script exactly once.
 * Returns a promise that resolves when window.YT is available.
 */
function loadYTApi() {
  return new Promise((resolve) => {
    if (ytApiLoaded && window.YT?.Player) { resolve(); return; }
    ytApiQueue.push(resolve);
    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        ytApiLoaded = true;
        if (prev) prev();
        ytApiQueue.forEach(r => r());
        ytApiQueue.length = 0;
      };
    }
  });
}

/**
 * YouTube player using the official IFrame Player API.
 *
 * HOST:   Player state changes (play/pause) trigger onPlay/onPause callbacks
 *         which propagate to other participants via socket.
 * CLIENT: Responds to isPlaying/currentTime/isSyncing props by commanding
 *         the player to play, pause, or seek.
 */
function YouTubeEmbed({ ytId, isPlaying, currentTime, isSyncing, isHost, onPlay, onPause }) {
  const wrapperRef = useRef(null);
  const playerRef  = useRef(null);

  // Keep latest callbacks + flags in refs so stale closures never capture old values
  const isHostRef  = useRef(isHost);
  const onPlayRef  = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  useEffect(() => { isHostRef.current  = isHost;  }, [isHost]);
  useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

  // ── Initialize YT player when ytId changes ─────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current) return;

    // Create a fresh mount-point div inside the wrapper
    wrapperRef.current.innerHTML = '';
    const mount = document.createElement('div');
    wrapperRef.current.appendChild(mount);

    let player;

    loadYTApi().then(() => {
      if (!wrapperRef.current) return; // component unmounted while API was loading

      player = new window.YT.Player(mount, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady() {
            playerRef.current = player;
          },
          onStateChange({ data }) {
            // Only the host reports state changes to the room
            if (!isHostRef.current || !playerRef.current) return;
            const YT = window.YT;
            if (data === YT.PlayerState.PLAYING) {
              onPlayRef.current?.(playerRef.current.getCurrentTime());
            } else if (data === YT.PlayerState.PAUSED) {
              onPauseRef.current?.(playerRef.current.getCurrentTime());
            }
          },
        },
      });
    });

    return () => {
      playerRef.current = null;
      try { player?.destroy?.(); } catch (_) {}
    };
  }, [ytId]);

  // ── Sync play/pause state for non-host participants ────────────────────────
  useEffect(() => {
    const p = playerRef.current;
    if (!p || isHost) return; // host controls via native YT controls
    try {
      isPlaying ? p.playVideo() : p.pauseVideo();
    } catch (_) {}
  }, [isPlaying, isHost]);

  // ── Seek when a sync correction arrives ───────────────────────────────────
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !isSyncing || currentTime == null) return;
    try {
      const diff = Math.abs((p.getCurrentTime?.() ?? 0) - currentTime);
      if (diff > 1.5) p.seekTo(currentTime, true);
    } catch (_) {}
  }, [currentTime, isSyncing]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }} />
      {isSyncing && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          padding: '4px 12px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          fontSize: '11px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
          Syncing...
        </div>
      )}
    </div>
  );
}


/**
 * Native HTML5 video player for remote server-hosted files.
 * More reliable than ReactPlayer for direct MP4/WebM URLs.
 */
function FileVideoPlayer({ cleanUrl, isPlaying, currentTime, isSyncing, isHost, onPlay, onPause, onSeek }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);
  const lastTimeRef = useRef(0);

  // Sync play/pause from socket
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && v.paused) v.play().catch(() => {});
    else if (!isPlaying && !v.paused) v.pause();
  }, [isPlaying]);

  // Seek when syncing
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isSyncing || currentTime == null) return;
    if (Math.abs(v.currentTime - currentTime) > 1) v.currentTime = currentTime;
  }, [currentTime, isSyncing]);

  const handlePlay = useCallback(() => {
    if (isHost) onPlay?.(videoRef.current?.currentTime || 0);
  }, [isHost, onPlay]);

  const handlePause = useCallback(() => {
    if (isHost) onPause?.(videoRef.current?.currentTime || 0);
  }, [isHost, onPause]);

  const handleTimeUpdate = useCallback(() => {
    const t = videoRef.current?.currentTime || 0;
    if (isHost && Math.abs(t - lastTimeRef.current) > 2) onSeek?.(t);
    lastTimeRef.current = t;
  }, [isHost, onSeek]);

  if (error) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', background: '#1a1a2e',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(239,68,68,0.3)', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#fc8181', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>Failed to load video</p>
        <p style={{ color: '#718096', fontSize: '12px', maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>
          Could not play this file. Make sure the server is running and the file is MP4 or WebM.
        </p>
        <p style={{ color: '#4a5568', fontSize: '11px', marginTop: '8px', wordBreak: 'break-all' }}>{cleanUrl}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        src={cleanUrl}
        controls
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onError={() => { console.error('[VideoPlayer] Failed to load:', cleanUrl); setError(true); }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {isSyncing && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          padding: '4px 12px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          fontSize: '11px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
          Syncing...
        </div>
      )}
    </div>
  );
}

/**
 * Native HTML5 <video> player for blob URLs from file uploads.
 * ReactPlayer doesn't reliably handle blob: URLs, so we bypass it entirely.
 */
function NativeVideoPlayer({ src, isSyncing }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', background: '#1a1a2e',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(239,68,68,0.3)', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#fc8181', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>Failed to play video</p>
        <p style={{ color: '#718096', fontSize: '12px', maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>
          This file format may not be supported by your browser. Try MP4 or WebM.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        onError={() => setError(true)}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {isSyncing && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          padding: '4px 12px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          fontSize: '11px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
          Syncing...
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoPlayer({
  videoUrl,
  isPlaying,
  currentTime,
  isSyncing,
  isHost,
  onPlay,
  onPause,
  onSeek,
  onProgress,
}) {
  const cleanUrl = normalizeUrl(videoUrl);
  const ytId = getYouTubeId(cleanUrl);
  const isBlob = cleanUrl?.startsWith('blob:');

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!cleanUrl) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎬</div>
        <p style={{ color: '#a0aec0', fontSize: '16px', fontWeight: 600, margin: 0 }}>No video loaded</p>
        <p style={{ color: '#718096', fontSize: '13px', marginTop: '8px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>
          Paste a YouTube link below and click Load
        </p>
      </div>
    );
  }

  // ── YouTube URL → YT IFrame Player API (full sync support) ─────────────────
  if (ytId) {
    return (
      <YouTubeEmbed
        ytId={ytId}
        isPlaying={isPlaying}
        currentTime={currentTime}
        isSyncing={isSyncing}
        isHost={isHost}
        onPlay={onPlay}
        onPause={onPause}
      />
    );
  }

  // ── Blob URL (local file upload) → use native <video> element ──────────────
  if (isBlob) {
    return <NativeVideoPlayer src={cleanUrl} isSyncing={isSyncing} />;
  }

  // ── Remote video URL → use ReactPlayer ─────────────────────────────────────
  return (
    <FileVideoPlayer
      cleanUrl={cleanUrl}
      isPlaying={isPlaying}
      currentTime={currentTime}
      isSyncing={isSyncing}
      isHost={isHost}
      onPlay={onPlay}
      onPause={onPause}
      onSeek={onSeek}
    />
  );
}


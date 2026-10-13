import { useRef, useEffect, useCallback, useState } from 'react';
import { FilmSlate, WarningCircle } from '@phosphor-icons/react';

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

function SyncBadge() {
  return (
    <div style={{
      position: 'absolute', top: '12px', left: '12px', zIndex: 10,
      padding: '4px 12px', borderRadius: '999px',
      background: 'color-mix(in srgb, var(--color-surface-950) 80%, transparent)',
      border: '1px solid color-mix(in srgb, var(--color-rose-500) 30%, transparent)',
      backdropFilter: 'blur(12px)',
      fontSize: '11px', color: 'var(--color-rose-400)',
      fontFamily: 'var(--font-mono)',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'var(--color-rose-500)', display: 'inline-block',
        boxShadow: '0 0 6px var(--color-rose-500)',
      }} />
      Syncing…
    </div>
  );
}

/**
 * YouTube player using the official IFrame Player API.
 */
function YouTubeEmbed({ ytId, isPlaying, currentTime, isSyncing, isHost, onPlay, onPause }) {
  const wrapperRef = useRef(null);
  const playerRef  = useRef(null);

  const isHostRef  = useRef(isHost);
  const onPlayRef  = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  useEffect(() => { isHostRef.current  = isHost;  }, [isHost]);
  useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    wrapperRef.current.innerHTML = '';
    const mount = document.createElement('div');
    wrapperRef.current.appendChild(mount);

    let player;

    loadYTApi().then(() => {
      if (!wrapperRef.current) return;

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
      try { player?.destroy?.(); } catch { /* ignore */ }
    };
  }, [ytId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || isHost) return;
    try {
      isPlaying ? p.playVideo() : p.pauseVideo();
    } catch { /* ignore */ }
  }, [isPlaying, isHost]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !isSyncing || currentTime == null) return;
    try {
      const diff = Math.abs((p.getCurrentTime?.() ?? 0) - currentTime);
      if (diff > 1.5) p.seekTo(currentTime, true);
    } catch { /* ignore */ }
  }, [currentTime, isSyncing]);

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16/9',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: '#000',
      border: '1px solid color-mix(in srgb, white 6%, transparent)',
    }}>
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }} />
      {isSyncing && <SyncBadge />}
    </div>
  );
}

/**
 * Native HTML5 video player for remote server-hosted files.
 */
function FileVideoPlayer({ cleanUrl, isPlaying, currentTime, isSyncing, isHost, onPlay, onPause, onSeek }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && v.paused) v.play().catch(() => {});
    else if (!isPlaying && !v.paused) v.pause();
  }, [isPlaying]);

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
        width: '100%', aspectRatio: '16/9',
        background: 'var(--color-surface-900)',
        borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid color-mix(in srgb, var(--color-red-500) 25%, transparent)',
        padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'color-mix(in srgb, var(--color-red-500) 12%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <WarningCircle size={22} color="var(--color-red-500)" weight="fill" />
        </div>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>Failed to load video</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>
          Could not play this file. Make sure the server is running and the file is MP4 or WebM.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '8px', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>{cleanUrl}</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16/9',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: '#000',
      border: '1px solid color-mix(in srgb, white 6%, transparent)',
    }}>
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
      {isSyncing && <SyncBadge />}
    </div>
  );
}

/**
 * Native HTML5 <video> player for blob URLs from file uploads.
 */
function NativeVideoPlayer({ src, isSyncing }) {
  const videoRef = useRef(null);
  const [prevSrc, setPrevSrc] = useState(src);
  const [error, setError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setError(false);
  }

  if (error) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--color-surface-900)',
        borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid color-mix(in srgb, var(--color-red-500) 25%, transparent)',
        padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'color-mix(in srgb, var(--color-red-500) 12%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <WarningCircle size={22} color="var(--color-red-500)" weight="fill" />
        </div>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>Failed to play video</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>
          This file format may not be supported by your browser. Try MP4 or WebM.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16/9',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: '#000',
      border: '1px solid color-mix(in srgb, white 6%, transparent)',
    }}>
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        onError={() => setError(true)}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {isSyncing && <SyncBadge />}
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
}) {
  const cleanUrl = normalizeUrl(videoUrl);
  const ytId = getYouTubeId(cleanUrl);
  const isBlob = cleanUrl?.startsWith('blob:');

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!cleanUrl) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--color-surface-900)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid color-mix(in srgb, white 6%, transparent)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle rose radial ambient */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--color-rose-500) 8%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--color-surface-800)',
          border: '1px solid color-mix(in srgb, white 8%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          <FilmSlate size={26} color="var(--color-rose-400)" weight="duotone" />
        </div>
        <p style={{
          color: 'var(--color-text-primary)',
          fontSize: '0.9375rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          No video loaded
        </p>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.8125rem',
          marginTop: '0.375rem',
          textAlign: 'center',
          maxWidth: '320px',
          lineHeight: 1.5,
        }}>
          Paste a YouTube or video URL above and click Load
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


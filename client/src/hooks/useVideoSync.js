import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Hook for video playback synchronization across room participants.
 */
export function useVideoSync(roomId, isHost) {
  const [videoUrl, setVideoUrl]   = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const stopSync = useCallback(() => {
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    // Request current playback state when joining
    socket.emit('VIDEO_STATE_REQUEST', { roomId });

    const handleVideoLoad = ({ videoUrl: url }) => {
      setVideoUrl(url || null);
      setCurrentTime(0);
      setIsPlaying(false);
    };

    const handleVideoPlay = ({ currentTime: t }) => {
      setIsPlaying(true);
      setCurrentTime(t);
      setIsSyncing(true);
      setTimeout(stopSync, 800);
    };

    const handleVideoPause = ({ currentTime: t }) => {
      setIsPlaying(false);
      setCurrentTime(t);
      setIsSyncing(true);
      setTimeout(stopSync, 800);
    };

    const handleVideoSeek = ({ currentTime: t }) => {
      setCurrentTime(t);
      setIsSyncing(true);
      setTimeout(stopSync, 800);
    };

    const handleVideoState = ({ videoUrl: url, isPlaying: playing, currentTime: t }) => {
      setVideoUrl(url || null);
      setIsPlaying(!!playing);
      setCurrentTime(t || 0);
    };

    socket.on('VIDEO_LOAD', handleVideoLoad);
    socket.on('VIDEO_PLAY', handleVideoPlay);
    socket.on('VIDEO_PAUSE', handleVideoPause);
    socket.on('VIDEO_SEEK', handleVideoSeek);
    socket.on('VIDEO_STATE', handleVideoState);

    return () => {
      socket.off('VIDEO_LOAD', handleVideoLoad);
      socket.off('VIDEO_PLAY', handleVideoPlay);
      socket.off('VIDEO_PAUSE', handleVideoPause);
      socket.off('VIDEO_SEEK', handleVideoSeek);
      socket.off('VIDEO_STATE', handleVideoState);
    };
  }, [roomId, stopSync]);

  const loadVideo = useCallback((url) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    // Update local state IMMEDIATELY — don't wait for socket echo
    setVideoUrl(cleanUrl);
    setCurrentTime(0);
    setIsPlaying(false);
    // Blob URLs are local to this browser tab — don't broadcast them
    // (other participants can't access blob: URLs)
    if (!cleanUrl.startsWith('blob:')) {
      const socket = getSocket();
      socket.emit('VIDEO_LOAD', { roomId, videoUrl: cleanUrl });
    }
  }, [roomId]);

  const play = useCallback((time) => {
    const t = time || 0;
    setIsPlaying(true);
    setCurrentTime(t);
    getSocket().emit('VIDEO_PLAY', { roomId, currentTime: t });
  }, [roomId]);

  const pause = useCallback((time) => {
    const t = time || 0;
    setIsPlaying(false);
    setCurrentTime(t);
    getSocket().emit('VIDEO_PAUSE', { roomId, currentTime: t });
  }, [roomId]);

  const seek = useCallback((time) => {
    const t = time || 0;
    setCurrentTime(t);
    getSocket().emit('VIDEO_SEEK', { roomId, currentTime: t });
  }, [roomId]);

  return { videoUrl, isPlaying, currentTime, isSyncing, loadVideo, play, pause, seek };
}

export default useVideoSync;

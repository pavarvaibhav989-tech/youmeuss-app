/**
 * Video sync socket event handlers.
 * Keeps all room participants in sync with the host's playback state.
 */

// In-memory playback state per room
// Map<roomId, { videoUrl, isPlaying, currentTime, lastUpdate, hostId }>
const playbackStates = new Map();

export function getPlaybackState(roomId) {
  return playbackStates.get(roomId) || null;
}

export default function videoHandler(io, socket) {
  /**
   * VIDEO_LOAD — Host loads a new video for the room.
   */
  socket.on('VIDEO_LOAD', ({ roomId, videoUrl }) => {
    playbackStates.set(roomId, {
      videoUrl,
      isPlaying: false,
      currentTime: 0,
      lastUpdate: Date.now(),
      hostId: socket.user.id,
    });

    io.to(roomId).emit('VIDEO_LOAD', { videoUrl });
    console.log(`🎬 Video loaded in room ${roomId}: ${videoUrl}`);
  });

  /**
   * VIDEO_PLAY — Host presses play.
   */
  socket.on('VIDEO_PLAY', ({ roomId, currentTime }) => {
    const state = playbackStates.get(roomId);
    if (state) {
      state.isPlaying = true;
      state.currentTime = currentTime;
      state.lastUpdate = Date.now();
    }

    socket.to(roomId).emit('VIDEO_PLAY', { currentTime });
  });

  /**
   * VIDEO_PAUSE — Host pauses playback.
   */
  socket.on('VIDEO_PAUSE', ({ roomId, currentTime }) => {
    const state = playbackStates.get(roomId);
    if (state) {
      state.isPlaying = false;
      state.currentTime = currentTime;
      state.lastUpdate = Date.now();
    }

    socket.to(roomId).emit('VIDEO_PAUSE', { currentTime });
  });

  /**
   * VIDEO_SEEK — Host seeks to a new position.
   */
  socket.on('VIDEO_SEEK', ({ roomId, currentTime }) => {
    const state = playbackStates.get(roomId);
    if (state) {
      state.currentTime = currentTime;
      state.lastUpdate = Date.now();
    }

    socket.to(roomId).emit('VIDEO_SEEK', { currentTime });
  });

  /**
   * VIDEO_STATE_REQUEST — New joiner requests current playback state.
   */
  socket.on('VIDEO_STATE_REQUEST', ({ roomId }) => {
    const state = playbackStates.get(roomId);
    if (state) {
      // Calculate current time if video is playing
      let adjustedTime = state.currentTime;
      if (state.isPlaying) {
        const elapsed = (Date.now() - state.lastUpdate) / 1000;
        adjustedTime = state.currentTime + elapsed;
      }

      socket.emit('VIDEO_STATE', {
        videoUrl: state.videoUrl,
        isPlaying: state.isPlaying,
        currentTime: adjustedTime,
      });
    }
  });
}

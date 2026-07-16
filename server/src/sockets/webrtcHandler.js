/**
 * WebRTC signaling socket event handlers.
 * Relays SDP offers/answers and ICE candidates between peers.
 */

export default function webrtcHandler(io, socket) {
  /**
   * WEBRTC_JOIN — User wants to start/join a video call.
   * Notify other participants in the room.
   */
  socket.on('WEBRTC_JOIN', ({ roomId }) => {
    socket.to(roomId).emit('WEBRTC_JOIN', {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  /**
   * WEBRTC_OFFER — Relay SDP offer to a specific peer.
   */
  socket.on('WEBRTC_OFFER', ({ roomId, targetUserId, offer }) => {
    // Find the target user's socket in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) return;

    for (const socketId of room) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket && targetSocket.user && targetSocket.user.id === targetUserId) {
        targetSocket.emit('WEBRTC_OFFER', {
          userId: socket.user.id,
          username: socket.user.username,
          offer,
        });
        break;
      }
    }
  });

  /**
   * WEBRTC_ANSWER — Relay SDP answer to a specific peer.
   */
  socket.on('WEBRTC_ANSWER', ({ roomId, targetUserId, answer }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) return;

    for (const socketId of room) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket && targetSocket.user && targetSocket.user.id === targetUserId) {
        targetSocket.emit('WEBRTC_ANSWER', {
          userId: socket.user.id,
          username: socket.user.username,
          answer,
        });
        break;
      }
    }
  });

  /**
   * WEBRTC_ICE — Relay ICE candidate to a specific peer.
   */
  socket.on('WEBRTC_ICE', ({ roomId, targetUserId, candidate }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) return;

    for (const socketId of room) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket && targetSocket.user && targetSocket.user.id === targetUserId) {
        targetSocket.emit('WEBRTC_ICE', {
          userId: socket.user.id,
          candidate,
        });
        break;
      }
    }
  });

  /**
   * WEBRTC_LEAVE — User leaves the video call.
   */
  socket.on('WEBRTC_LEAVE', ({ roomId }) => {
    socket.to(roomId).emit('WEBRTC_LEAVE', {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });
}

/**
 * Room socket event handlers.
 * Manages user presence within rooms.
 */

// In-memory store of active users per room
// Map<roomId, Map<userId, { socketId, username, avatar_url }>>
const activeRooms = new Map();

export function getActiveRooms() {
  return activeRooms;
}

export function getRoomUsers(roomId) {
  return activeRooms.get(roomId) || new Map();
}

export default function roomHandler(io, socket) {
  /**
   * ROOM_JOIN — User joins a room's socket channel.
   */
  socket.on('ROOM_JOIN', ({ roomId }) => {
    const user = socket.user;
    if (!user || !roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;

    // Track active user
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Map());
    }
    activeRooms.get(roomId).set(user.id, {
      socketId: socket.id,
      userId: user.id,
      username: user.username,
      avatar_url: user.avatar_url || null,
    });

    // Send current participants to the joining user
    const users = Array.from(activeRooms.get(roomId).values());
    socket.emit('ROOM_USERS', { users });

    // Broadcast to others that someone joined
    socket.to(roomId).emit('USER_JOINED', {
      userId: user.id,
      username: user.username,
      avatar_url: user.avatar_url || null,
    });

    console.log(`👤 ${user.username} joined room ${roomId} (${users.length} users)`);
  });

  /**
   * ROOM_LEAVE — User explicitly leaves a room.
   */
  socket.on('ROOM_LEAVE', ({ roomId }) => {
    handleLeave(io, socket, roomId);
  });

  /**
   * Handle disconnect — clean up from all rooms.
   */
  socket.on('disconnect', () => {
    if (socket.roomId) {
      handleLeave(io, socket, socket.roomId);
    }
  });
}

function handleLeave(io, socket, roomId) {
  const user = socket.user;
  if (!user || !roomId) return;

  socket.leave(roomId);

  const room = activeRooms.get(roomId);
  if (room) {
    room.delete(user.id);

    if (room.size === 0) {
      activeRooms.delete(roomId);
    }
  }

  // Broadcast to remaining users
  io.to(roomId).emit('USER_LEFT', {
    userId: user.id,
    username: user.username,
  });

  console.log(`👤 ${user.username} left room ${roomId}`);
}

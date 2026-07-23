/**
 * Chat socket event handlers.
 * Real-time messaging and typing indicators.
 */
import { v4 as uuidv4 } from 'uuid';
import { runSql } from '../db/index.js';

export default function chatHandler(io, socket) {
  /**
   * CHAT_MESSAGE — User sends a chat message.
   */
  socket.on('CHAT_MESSAGE', async ({ roomId, message }) => {
    if (!message || !message.trim() || !roomId) return;

    const user = socket.user;
    const id = uuidv4();
    const created_at = new Date().toISOString();

    // Persist to database
    try {
      await runSql('INSERT INTO messages (id, room_id, user_id, message, created_at) VALUES (?, ?, ?, ?, ?)', [
        id, roomId, user.id, message.trim(), created_at,
      ]);
    } catch (err) {
      console.error('Error saving message:', err);
    }

    // Broadcast to entire room (including sender for confirmation)
    io.to(roomId).emit('CHAT_MESSAGE', {
      id,
      message: message.trim(),
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatar_url || null,
      created_at,
    });
  });

  /**
   * USER_TYPING — User is typing indicator.
   */
  socket.on('USER_TYPING', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('USER_TYPING', {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping,
    });
  });
}

/**
 * Main socket connection handler.
 * Authenticates connections and registers all event handlers.
 */
import { verifySocketToken } from '../middleware/auth.js';
import roomHandler from './roomHandler.js';
import videoHandler from './videoHandler.js';
import chatHandler from './chatHandler.js';
import webrtcHandler from './webrtcHandler.js';

export function initializeSockets(io) {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const user = verifySocketToken(token);
    if (!user) {
      return next(new Error('Invalid or expired token'));
    }

    // Attach user to socket for use in handlers
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // Register all event handlers
    roomHandler(io, socket);
    videoHandler(io, socket);
    chatHandler(io, socket);
    webrtcHandler(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${reason})`);
    });
  });

  console.log('✅ Socket.io initialized');
}

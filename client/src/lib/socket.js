import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket = null;

/**
 * Get or create the socket connection singleton.
 * Always returns the same instance; recreates if disconnected.
 */
export function getSocket() {
  // Reuse existing connected socket
  if (socket && (socket.connected || socket.active)) return socket;

  // Destroy stale socket before creating new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn('🔌 No auth token — socket will not connect');
  }

  socket = io(SERVER_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('🔌 Socket error:', err.message);
    // If auth error (token expired), redirect to login
    if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
      console.warn('🔌 Socket auth failed — clearing tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Soft redirect — let React router handle it
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
}

/**
 * Force-reset the socket (call after login to get fresh connection with new token).
 */
export function resetSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Disconnect and clean up the socket connection.
 */
export function disconnectSocket() {
  resetSocket();
}

export default getSocket;

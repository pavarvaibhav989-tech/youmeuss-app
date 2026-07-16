import { useEffect, useRef, useCallback } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';

/**
 * Hook for managing socket connection lifecycle.
 * Connects on mount, joins room, cleans up on unmount.
 */
export function useSocket(roomId) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (roomId) {
      socket.emit('ROOM_JOIN', { roomId });
    }

    return () => {
      if (roomId) {
        socket.emit('ROOM_LEAVE', { roomId });
      }
    };
  }, [roomId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  return { socket: socketRef.current, emit, on };
}

export default useSocket;

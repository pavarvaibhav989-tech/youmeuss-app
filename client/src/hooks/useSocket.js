import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Hook for managing socket connection lifecycle.
 * Connects on mount, joins room, cleans up on unmount.
 */
export function useSocket(roomId) {
  const [socketInstance] = useState(() => (typeof window !== 'undefined' ? getSocket() : null));
  const socketRef = useRef(socketInstance);

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

  return { socket: socketInstance, emit, on };
}

export default useSocket;

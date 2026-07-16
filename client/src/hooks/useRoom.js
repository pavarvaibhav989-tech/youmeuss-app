import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import api from '../lib/api';

/**
 * Hook for room data and participant tracking.
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch room data from API
  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      try {
        setLoading(true);
        // Try joining the room first
        await api.post(`/rooms/${roomId}/join`);
        const { data } = await api.get(`/rooms/${roomId}`);
        setRoom(data.room);
        setParticipants(data.participants);
        setHost(data.host);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Listen for real-time participant changes
  useEffect(() => {
    const socket = getSocket();

    const handleUsers = ({ users }) => {
      setParticipants((prev) => {
        // Merge socket presence with DB participants
        return prev.map((p) => ({
          ...p,
          isOnline: users.some((u) => u.userId === p.id),
        }));
      });
    };

    const handleUserJoined = ({ userId, username, avatar_url }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === userId)) {
          return prev.map((p) =>
            p.id === userId ? { ...p, isOnline: true } : p
          );
        }
        return [...prev, { id: userId, username, avatar_url, isOnline: true }];
      });
    };

    const handleUserLeft = ({ userId }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === userId ? { ...p, isOnline: false } : p
        )
      );
    };

    socket.on('ROOM_USERS', handleUsers);
    socket.on('USER_JOINED', handleUserJoined);
    socket.on('USER_LEFT', handleUserLeft);

    return () => {
      socket.off('ROOM_USERS', handleUsers);
      socket.off('USER_JOINED', handleUserJoined);
      socket.off('USER_LEFT', handleUserLeft);
    };
  }, [roomId]);

  return { room, participants, host, loading, error };
}

export default useRoom;

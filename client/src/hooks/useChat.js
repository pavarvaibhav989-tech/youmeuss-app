import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';
import api from '../lib/api';

/**
 * Hook for real-time chat functionality.
 * Loads the last 50 messages from the DB on mount, then appends
 * live messages via socket so history is always visible on join.
 */
export function useChat(roomId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ── Load chat history on room join ────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    api.get(`/rooms/${roomId}/messages?limit=50`)
      .then(({ data }) => {
        setMessages(data.messages || []);
      })
      .catch((err) => {
        console.warn('[useChat] Could not load message history:', err.message);
      })
      .finally(() => {
        setHistoryLoaded(true);
      });
  }, [roomId]);

  // ── Real-time socket listeners ────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleMessage = (msg) => {
      setMessages((prev) => {
        // Deduplicate — socket may echo a message already in history
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTyping = ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        }
        return prev.filter((u) => u.userId !== userId);
      });
    };

    socket.on('CHAT_MESSAGE', handleMessage);
    socket.on('USER_TYPING', handleTyping);

    return () => {
      socket.off('CHAT_MESSAGE', handleMessage);
      socket.off('USER_TYPING', handleTyping);
    };
  }, [roomId]);

  const sendMessage = useCallback((message) => {
    if (!message.trim()) return;
    socketRef.current?.emit('CHAT_MESSAGE', { roomId, message: message.trim() });

    // Stop typing indicator
    socketRef.current?.emit('USER_TYPING', { roomId, isTyping: false });
  }, [roomId]);

  const sendTyping = useCallback((isTyping) => {
    socketRef.current?.emit('USER_TYPING', { roomId, isTyping });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('USER_TYPING', { roomId, isTyping: false });
      }, 3000);
    }
  }, [roomId]);

  return {
    messages,
    typingUsers,
    historyLoaded,
    sendMessage,
    sendTyping,
    setMessages,
  };
}

export default useChat;

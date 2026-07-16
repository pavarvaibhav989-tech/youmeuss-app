import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Hook for real-time chat functionality.
 */
export function useChat(roomId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
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
    sendMessage,
    sendTyping,
    setMessages,
  };
}

export default useChat;

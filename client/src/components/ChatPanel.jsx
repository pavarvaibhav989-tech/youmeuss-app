import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChatPanel({ messages, typingUsers, onSendMessage, onTyping }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping?.(true);
  };

  // Generate consistent color from username
  const getUserColor = (username) => {
    const colors = [
      'text-brand-400', 'text-accent-400', 'text-success', 'text-info',
      'text-warning', 'text-brand-300', 'text-accent-300',
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-400/10">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          💬 Chat
          {messages.length > 0 && (
            <span className="text-xs text-text-muted font-normal">({messages.length})</span>
          )}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-sm text-text-muted">No messages yet</p>
            <p className="text-xs text-text-muted mt-1">Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white
                            ${isOwn ? 'gradient-brand' : 'bg-surface-400'}`}
              >
                {msg.username?.charAt(0).toUpperCase()}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <p className={`text-xs font-medium mb-0.5 ${getUserColor(msg.username)}`}>
                    {msg.username}
                  </p>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${isOwn
                      ? 'gradient-brand text-white rounded-br-md'
                      : 'bg-surface-600 text-text-primary rounded-bl-md'
                    }`}
                >
                  {msg.message}
                </div>
                <p className="text-[10px] text-text-muted mt-0.5 px-1">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 animate-fade-in">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-text-muted">
              {typingUsers.map((u) => u.username).join(', ')} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-3 border-t border-surface-400/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-2.5
                       text-sm text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                       transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center
                       text-white disabled:opacity-30 disabled:cursor-not-allowed
                       hover:opacity-90 transition-opacity cursor-pointer border-none
                       flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

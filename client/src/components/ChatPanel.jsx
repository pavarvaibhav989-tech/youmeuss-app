import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaperPlaneTilt, ChatCircle, Smiley } from '@phosphor-icons/react';

export default function ChatPanel({ messages, typingUsers, onSendMessage, onTyping }) {
  const [input, setInput]       = useState('');
  const messagesEndRef           = useRef(null);
  const inputRef                 = useRef(null);
  const { user }                 = useAuth();

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

  // Deterministic color from username — using rose/surface palette, no random saturation
  const getUserColor = (username) => {
    const palette = [
      'var(--color-rose-400)',
      '#a78bfa',   // muted violet
      '#34d399',   // muted emerald
      '#60a5fa',   // muted blue
      '#fb923c',   // muted orange
      'var(--color-rose-300)',
      '#e879f9',   // muted fuchsia
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          minHeight: 0,
        }}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '0.5rem',
              paddingBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--color-surface-700)',
                border: '1px solid color-mix(in srgb, white 6%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChatCircle size={20} color="var(--color-text-muted)" />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              No messages yet
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Say hello
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          return (
            <div
              key={msg.id}
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}
            >
              {/* Avatar — squircle shape */}
              {!isOwn && (
                <div
                  className="avatar"
                  style={{
                    width: '26px',
                    height: '26px',
                    fontSize: '0.6rem',
                    background: getUserColor(msg.username),
                    // Override gradient for other users — just use their color
                    backgroundImage: 'none',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {msg.username?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  maxWidth: '78%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                  gap: '0.175rem',
                }}
              >
                {!isOwn && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: getUserColor(msg.username),
                      paddingLeft: '0.25rem',
                    }}
                  >
                    {msg.username}
                  </span>
                )}
                <div
                  style={{
                    padding: '0.5625rem 0.875rem',
                    borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    ...(isOwn
                      ? {
                          background: 'linear-gradient(135deg, var(--color-rose-500), var(--color-rose-600))',
                          color: 'white',
                          boxShadow: '0 2px 8px color-mix(in srgb, var(--color-rose-600) 25%, transparent)',
                        }
                      : {
                          background: 'var(--color-surface-700)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid color-mix(in srgb, white 6%, transparent)',
                        }),
                  }}
                >
                  {msg.message}
                </div>
                <span
                  style={{
                    fontSize: '0.625rem',
                    color: 'var(--color-text-muted)',
                    padding: '0 0.25rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div
            className="animate-fade-in"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}
          >
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {typingUsers.map((u) => u.username).join(', ')} typing
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '0.75rem',
          borderTop: '1px solid color-mix(in srgb, white 5%, transparent)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Message…"
            className="input-base"
            style={{ flex: 1, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '10px',
              flexShrink: 0,
              justifyContent: 'center',
            }}
            aria-label="Send message"
          >
            <PaperPlaneTilt size={15} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  );
}

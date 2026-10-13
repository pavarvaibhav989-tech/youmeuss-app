import { Crown, Circle } from '@phosphor-icons/react';

export default function ParticipantList({ participants, hostId, currentUserId }) {
  const onlineCount = participants.filter(p => p.isOnline !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.25rem 0.25rem 0.75rem',
      }}>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
        }}>
          Participants
        </span>
        <span style={{
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-700)',
          padding: '0.1rem 0.45rem',
          borderRadius: '9999px',
          border: '1px solid color-mix(in srgb, white 6%, transparent)',
        }}>
          {onlineCount}/{participants.length} online
        </span>
      </div>

      {/* Participant rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {participants.map((p) => {
          const isCurrentUser = p.id === currentUserId;
          const isHost = p.id === hostId;
          const online = p.isOnline !== false;
          const initial = p.username?.charAt(0).toUpperCase();

          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                background: isCurrentUser
                  ? 'color-mix(in srgb, var(--color-rose-500) 5%, transparent)'
                  : 'transparent',
                border: '1px solid',
                borderColor: isCurrentUser
                  ? 'color-mix(in srgb, var(--color-rose-500) 10%, transparent)'
                  : 'transparent',
                transition: 'background 150ms, border-color 150ms',
              }}
            >
              {/* Avatar with presence ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', // squircle
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'white',
                  background: isCurrentUser
                    ? 'linear-gradient(135deg, var(--color-rose-500), var(--color-rose-700))'
                    : 'var(--color-surface-600)',
                  border: isCurrentUser
                    ? '1px solid color-mix(in srgb, var(--color-rose-400) 30%, transparent)'
                    : '1px solid color-mix(in srgb, white 8%, transparent)',
                }}>
                  {initial}
                </div>
                {/* Presence dot */}
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: online ? 'var(--color-green-500)' : 'var(--color-surface-500)',
                  border: '2px solid var(--color-surface-900)',
                }} />
              </div>

              {/* Name + you label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: isCurrentUser ? 'var(--color-rose-300)' : 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}>
                  {p.username}
                  {isCurrentUser && (
                    <span style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                      fontWeight: 400,
                      marginLeft: '0.375rem',
                    }}>
                      you
                    </span>
                  )}
                </p>
                {!online && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1 }}>
                    offline
                  </p>
                )}
              </div>

              {/* Host badge */}
              {isHost && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'color-mix(in srgb, var(--color-rose-500) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-rose-500) 20%, transparent)',
                  flexShrink: 0,
                }}>
                  <Crown size={10} weight="fill" color="var(--color-rose-400)" />
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: 'var(--color-rose-400)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    Host
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {participants.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>No one here yet</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Invite friends to join</p>
        </div>
      )}
    </div>
  );
}

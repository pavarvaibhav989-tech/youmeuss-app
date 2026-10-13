import { useState } from 'react';
import { X, Copy, Check, LinkSimple } from '@phosphor-icons/react';

export default function InviteModal({ roomCode, onClose }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/room/${roomCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="glass-elevated animate-scale-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          maxWidth: '440px',
          width: '100%',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            borderRadius: '8px',
          }}
          title="Close"
        >
          <X size={15} weight="bold" />
        </button>

        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text-primary)',
            marginBottom: '0.375rem',
          }}
        >
          Invite Friends
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem' }}>
          Share this link or code to invite people to your watch party.
        </p>

        {/* Room Code */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            Room Code
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="room-code"
              style={{
                fontSize: '1.25rem',
                padding: '0.4rem 1rem',
                letterSpacing: '0.22em',
              }}
            >
              {roomCode}
            </span>
          </div>
        </div>

        {/* Invite Link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            Invite Link
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                flex: 1,
                background: 'var(--color-surface-800)',
                borderRadius: 'var(--radius-md)',
                padding: '0.625rem 0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                border: '1px solid color-mix(in srgb, white 7%, transparent)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {inviteLink}
            </div>
            <button
              onClick={copyToClipboard}
              className="btn-primary"
              style={{
                flexShrink: 0,
                padding: '0.625rem 1rem',
                fontSize: '0.8125rem',
                gap: '0.375rem',
              }}
            >
              {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Tip */}
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          margin: 0,
          borderTop: '1px solid color-mix(in srgb, white 5%, transparent)',
          paddingTop: '1rem',
        }}>
          Anyone with this link or code can join immediately — no download required.
        </p>
      </div>
    </div>
  );
}

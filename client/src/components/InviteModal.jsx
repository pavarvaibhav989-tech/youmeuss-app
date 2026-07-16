import { useState } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative glass rounded-2xl p-8 max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-600 hover:bg-surface-500
                     flex items-center justify-center text-text-muted hover:text-text-primary
                     transition-all cursor-pointer border-none text-lg"
        >
          ×
        </button>

        <h2 className="text-xl font-bold text-text-primary mb-2">Invite Friends</h2>
        <p className="text-sm text-text-secondary mb-6">Share this link to invite people to your room</p>

        {/* Room Code */}
        <div className="mb-4">
          <label className="text-xs text-text-muted uppercase tracking-wider font-medium">Room Code</label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold tracking-[0.25em] gradient-brand-text">{roomCode}</span>
          </div>
        </div>

        {/* Invite Link */}
        <div className="mb-6">
          <label className="text-xs text-text-muted uppercase tracking-wider font-medium">Invite Link</label>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 bg-surface-700 rounded-lg px-4 py-3 text-sm text-text-secondary truncate border border-surface-400/20">
              {inviteLink}
            </div>
            <button
              onClick={copyToClipboard}
              className={`px-5 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200
                         cursor-pointer border-none whitespace-nowrap
                         ${copied
                           ? 'bg-success'
                           : 'gradient-brand hover:opacity-90 glow-brand'
                         }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-text-muted text-center">
          Anyone with this link can join your room 🎬
        </p>
      </div>
    </div>
  );
}

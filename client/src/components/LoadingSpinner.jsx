export default function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-950)',
        gap: '1.5rem',
      }}
    >
      {/* Ring spinner — CSS only, transform-only animation */}
      <div style={{ position: 'relative', width: '40px', height: '40px' }}>
        <svg
          viewBox="0 0 40 40"
          width="40"
          height="40"
          style={{ animation: 'spin 0.9s linear infinite' }}
        >
          <circle
            cx="20" cy="20" r="16"
            fill="none"
            stroke="color-mix(in srgb, var(--color-surface-600) 60%, transparent)"
            strokeWidth="2.5"
          />
          <circle
            cx="20" cy="20" r="16"
            fill="none"
            stroke="var(--color-rose-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="28 72"
            strokeDashoffset="0"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        {text}
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

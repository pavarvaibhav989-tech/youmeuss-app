import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, WarningCircle, Info, XCircle, X } from '@phosphor-icons/react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle,
    color: 'var(--color-green-500)',
    bg: 'color-mix(in srgb, var(--color-green-500) 12%, transparent)',
    border: 'color-mix(in srgb, var(--color-green-500) 25%, transparent)',
  },
  error: {
    Icon: XCircle,
    color: 'var(--color-red-500)',
    bg: 'color-mix(in srgb, var(--color-red-500) 12%, transparent)',
    border: 'color-mix(in srgb, var(--color-red-500) 25%, transparent)',
  },
  warning: {
    Icon: WarningCircle,
    color: '#fbbf24',
    bg: 'color-mix(in srgb, #fbbf24 12%, transparent)',
    border: 'color-mix(in srgb, #fbbf24 25%, transparent)',
  },
  info: {
    Icon: Info,
    color: 'var(--color-rose-400)',
    bg: 'color-mix(in srgb, var(--color-rose-500) 12%, transparent)',
    border: 'color-mix(in srgb, var(--color-rose-500) 25%, transparent)',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100% - 3rem)',
        }}
      >
        {toasts.map((toast) => {
          const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
          const { Icon } = cfg;

          return (
            <div
              key={toast.id}
              className="glass-elevated animate-slide-up"
              style={{
                pointerEvents: 'auto',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: `1px solid ${cfg.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: cfg.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={cfg.color} weight="fill" />
              </div>

              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  flex: 1,
                  lineHeight: 1.45,
                }}
              >
                {toast.message}
              </p>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 150ms',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                aria-label="Close notification"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

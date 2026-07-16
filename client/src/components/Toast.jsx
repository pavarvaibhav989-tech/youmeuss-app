import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { icon: '✓', color: 'bg-success' },
  error: { icon: '✕', color: 'bg-error' },
  info: { icon: 'ℹ', color: 'bg-info' },
  warning: { icon: '⚠', color: 'bg-warning' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
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
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-up glass rounded-xl px-5 py-3.5
                       flex items-center gap-3 min-w-[300px] max-w-[420px] shadow-2xl"
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${TOAST_TYPES[toast.type].color}`}
            >
              {TOAST_TYPES[toast.type].icon}
            </span>
            <p className="text-sm text-text-primary flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer
                         bg-transparent border-none text-lg leading-none p-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

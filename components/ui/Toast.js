'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

/* ─── Context ──────────────────────────────────────────────────────── */
const ToastContext = createContext(null);

let _id = 0;

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const variantStyles = {
  success: 'text-[var(--c-success)] bg-[var(--c-success-muted)]',
  error:   'text-[var(--c-error)]   bg-[var(--c-error-muted)]',
  warning: 'text-[var(--c-warning)] bg-[var(--c-warning-muted)]',
  info:    'text-[var(--c-info)]    bg-[var(--c-info-muted)]',
  default: 'text-[var(--c-text-soft)] bg-[var(--c-hover)]',
};

/* ─── Provider ─────────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ message, variant = 'default', duration = 4000 }) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ─── Hook ─────────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  const toast = ctx;
  return {
    toast,
    success: (message, opts) => toast({ message, variant: 'success', ...opts }),
    error:   (message, opts) => toast({ message, variant: 'error',   ...opts }),
    warning: (message, opts) => toast({ message, variant: 'warning', ...opts }),
    info:    (message, opts) => toast({ message, variant: 'info',    ...opts }),
  };
}

/* ─── Viewport ─────────────────────────────────────────────────────── */
function ToastViewport({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

/* ─── Item ─────────────────────────────────────────────────────────── */
function ToastItem({ toast: t, onDismiss }) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        'border border-[var(--c-border)] bg-[var(--c-card)] backdrop-blur-sm',
        'animate-slide-up-right min-w-[240px] max-w-sm',
      )}
    >
      <span className={cn('w-6 h-6 flex items-center justify-center rounded-full shrink-0 text-xs', variantStyles[t.variant])}>
        {icons[t.variant] ?? icons.info}
      </span>
      <p className="flex-1 text-sm text-[var(--c-text)]">{t.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

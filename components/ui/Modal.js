'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

const sizes = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

function Modal({ open, onClose, size = 'md', className, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-up" style={{ animationDuration: '150ms' }} />

      {/* Panel */}
      <div className={cn(
        'relative w-full bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-xl',
        'animate-scale-in overflow-hidden',
        sizes[size],
        className,
      )}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ onClose, className, children }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-5 border-b border-[var(--c-border-subtle)]',
      className,
    )}>
      <div className="font-semibold text-[var(--c-text)] text-base">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--c-text-muted)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ModalBody({ className, children }) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  );
}

function ModalFooter({ className, children }) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--c-border-subtle)]',
      className,
    )}>
      {children}
    </div>
  );
}

export { Modal, ModalHeader, ModalBody, ModalFooter };
export default Modal;

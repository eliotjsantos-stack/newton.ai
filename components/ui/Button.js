'use client';

import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  primary:   'bg-[var(--c-accent)] text-white hover:bg-[var(--c-accent-hover)] shadow-sm',
  secondary: 'bg-white text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-canvas)] hover:border-[var(--c-border-strong)]',
  ghost:     'text-[var(--c-text-muted)] hover:bg-[var(--c-canvas)] hover:text-[var(--c-text)]',
  danger:    'bg-[var(--c-error-muted)] text-[var(--c-error-text)] hover:bg-[var(--c-error)] hover:text-white border border-[var(--c-error)]/20',
  outline:   'border border-[var(--c-border-strong)] text-[var(--c-text)] hover:bg-[var(--c-canvas)]',
};

const sizes = {
  xs: 'h-7  px-3   text-xs  gap-1.5',
  sm: 'h-8  px-3.5 text-sm  gap-2',
  md: 'h-9  px-4   text-sm  gap-2',
  lg: 'h-10 px-5   text-sm  gap-2',
  xl: 'h-12 px-6   text-base gap-2.5',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled = false, className, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent-ring)]',
        'select-none cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size} />
          {children}
        </>
      ) : children}
    </button>
  );
});

function Spinner({ size }) {
  const dim = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <svg className={cn(dim, 'animate-spin shrink-0')} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export { Button };
export default Button;

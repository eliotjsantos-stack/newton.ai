'use client';

import { cn } from '../../lib/cn';

const variants = {
  default: 'bg-[var(--c-canvas)] text-[var(--c-text-soft)] border-[var(--c-border)]',
  accent:  'bg-[var(--c-accent-muted)] text-[var(--c-accent)] border-[var(--c-accent)]/20',
  success: 'bg-[var(--c-success-muted)] text-[var(--c-success-text)] border-[var(--c-success)]/20',
  error:   'bg-[var(--c-error-muted)] text-[var(--c-error-text)] border-[var(--c-error)]/20',
  warning: 'bg-[var(--c-warning-muted)] text-[var(--c-warning-text)] border-[var(--c-warning)]/20',
  blue:    'bg-blue-50 text-blue-700 border-blue-200/60',
  purple:  'bg-purple-50 text-purple-700 border-purple-200/60',
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

function Badge({ variant = 'default', size = 'md', dot = false, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'inline-block w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'accent'  && 'bg-[var(--c-accent)]',
          variant === 'success' && 'bg-[var(--c-success)]',
          variant === 'error'   && 'bg-[var(--c-error)]',
          variant === 'warning' && 'bg-[var(--c-warning)]',
          variant === 'blue'    && 'bg-blue-500',
          variant === 'default' && 'bg-[var(--c-text-faint)]',
        )} />
      )}
      {children}
    </span>
  );
}

export { Badge };
export default Badge;

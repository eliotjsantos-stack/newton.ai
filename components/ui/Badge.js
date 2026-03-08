'use client';

import { cn } from '../../lib/cn';

const variants = {
  default: 'bg-[var(--c-hover)] text-[var(--c-text-soft)] border-[var(--c-border)]',
  brand:   'bg-[var(--c-brand-muted)] text-brand border-brand/20',
  success: 'bg-[var(--c-success-muted)] text-[var(--c-success)] border-[var(--c-success)]/20',
  error:   'bg-[var(--c-error-muted)] text-[var(--c-error)] border-[var(--c-error)]/20',
  warning: 'bg-[var(--c-warning-muted)] text-[var(--c-warning)] border-[var(--c-warning)]/20',
  info:    'bg-[var(--c-info-muted)] text-[var(--c-info)] border-[var(--c-info)]/20',
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
          variant === 'brand'   && 'bg-brand',
          variant === 'success' && 'bg-[var(--c-success)]',
          variant === 'error'   && 'bg-[var(--c-error)]',
          variant === 'warning' && 'bg-[var(--c-warning)]',
          variant === 'info'    && 'bg-[var(--c-info)]',
          variant === 'default' && 'bg-[var(--c-text-muted)]',
        )} />
      )}
      {children}
    </span>
  );
}

export { Badge };
export default Badge;

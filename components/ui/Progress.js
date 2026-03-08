'use client';

import { cn } from '../../lib/cn';

/**
 * Progress bar.
 * @param {number} value    - 0–100
 * @param {'brand'|'success'|'error'|'info'} color
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} animated - pulsing indeterminate mode
 */
function Progress({ value = 0, color = 'brand', size = 'md', animated = false, label, className }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  const fillColors = {
    brand:   'bg-brand',
    success: 'bg-[var(--c-success)]',
    error:   'bg-[var(--c-error)]',
    info:    'bg-[var(--c-info)]',
    warning: 'bg-[var(--c-warning)]',
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--c-text-soft)]">{label}</span>
          {!animated && (
            <span className="text-xs font-medium text-[var(--c-text)]">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-[var(--c-hover)] overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillColors[color],
            animated && 'animate-pulse',
          )}
          style={{ width: animated ? '100%' : `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={animated ? undefined : clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export { Progress };
export default Progress;

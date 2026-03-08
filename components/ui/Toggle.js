'use client';

import { cn } from '../../lib/cn';

const sizes = {
  sm: { track: 'w-8 h-4',   thumb: 'w-3 h-3',   translate: 'translate-x-4' },
  md: { track: 'w-11 h-6',  thumb: 'w-5 h-5',   translate: 'translate-x-5' },
  lg: { track: 'w-14 h-7',  thumb: 'w-6 h-6',   translate: 'translate-x-7' },
};

function Toggle({ checked = false, onChange, disabled = false, size = 'md', label, className }) {
  const s = sizes[size] ?? sizes.md;

  return (
    <label className={cn(
      'inline-flex items-center gap-3 select-none',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      className,
    )}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent-ring)] shrink-0',
          s.track,
          checked ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-border-strong)]',
        )}
      >
        <span className={cn(
          'absolute left-0.5 inline-block rounded-full bg-white shadow transition-transform duration-200',
          s.thumb,
          checked ? s.translate : 'translate-x-0.5',
        )} />
      </button>

      {label && (
        <span className="text-sm text-[var(--c-text-soft)]">{label}</span>
      )}
    </label>
  );
}

export { Toggle };
export default Toggle;

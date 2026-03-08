'use client';

import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(function Input(
  { label, hint, error, prefix, suffix, className, containerClassName, id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--c-text-soft)]">
          {label}
        </label>
      )}

      <div className={cn(
        'flex items-center gap-2 px-3 rounded-md border bg-white transition-all duration-150',
        'border-[var(--c-border)]',
        'focus-within:border-[var(--c-accent)] focus-within:ring-2 focus-within:ring-[var(--c-accent-ring)]',
        error && 'border-[var(--c-error)] focus-within:ring-[var(--c-error)]/20',
      )}>
        {prefix && <span className="shrink-0 text-[var(--c-text-faint)] text-sm">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex-1 bg-transparent py-2.5 text-sm text-[var(--c-text)]',
            'placeholder:text-[var(--c-text-faint)]',
            'outline-none min-w-0',
            className,
          )}
          {...props}
        />
        {suffix && <span className="shrink-0 text-[var(--c-text-faint)] text-sm">{suffix}</span>}
      </div>

      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-[var(--c-error-text)]' : 'text-[var(--c-text-faint)]')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

export { Input };
export default Input;

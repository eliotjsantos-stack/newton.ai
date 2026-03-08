'use client';

import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    prefix,
    suffix,
    className,
    containerClassName,
    id: idProp,
    ...props
  },
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
        'flex items-center gap-2 px-3 rounded-xl border transition-colors duration-150',
        'bg-[var(--c-card)] border-[var(--c-border)]',
        'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
        error && 'border-[var(--c-error)] focus-within:ring-[var(--c-error)]/20',
      )}>
        {prefix && (
          <span className="shrink-0 text-[var(--c-text-muted)] text-sm">{prefix}</span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex-1 bg-transparent py-2.5 text-sm text-[var(--c-text)]',
            'placeholder:text-[var(--c-text-muted)]',
            'outline-none min-w-0',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="shrink-0 text-[var(--c-text-muted)] text-sm">{suffix}</span>
        )}
      </div>

      {(error || hint) && (
        <p className={cn(
          'text-xs',
          error ? 'text-[var(--c-error)]' : 'text-[var(--c-text-muted)]',
        )}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

export { Input };
export default Input;

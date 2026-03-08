'use client';

import { cn } from '../../lib/cn';

function Card({ hover = false, padding = true, className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-[var(--c-border)] card-shadow',
        padding && 'p-5',
        hover && 'transition-shadow duration-150 hover:card-shadow-md cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-sm font-semibold text-[var(--c-text)]', className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-[var(--c-text-muted)] mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('px-5 pb-5', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn(
      'px-5 py-4 border-t border-[var(--c-border)] flex items-center gap-3',
      className,
    )} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
export default Card;

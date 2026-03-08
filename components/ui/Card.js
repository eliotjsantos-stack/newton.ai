'use client';

import { cn } from '../../lib/cn';

const variants = {
  default: 'bg-[var(--c-card)] border border-[var(--c-border)]',
  ghost:   'bg-transparent border border-[var(--c-border-subtle)]',
  glass:   'glass',
  solid:   'bg-[var(--c-card)] shadow-md',
};

function Card({ variant = 'default', hover = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variants[variant],
        hover && 'card-lift cursor-pointer',
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
    <div className={cn('px-6 pt-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-base font-semibold text-[var(--c-text)] tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-[var(--c-text-soft)] mt-1', className)} {...props}>
      {children}
    </p>
  );
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-[var(--c-border-subtle)] flex items-center gap-3',
      className,
    )} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
export default Card;

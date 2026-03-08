'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent-ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--c-accent)] text-white hover:bg-[var(--c-accent-hover)]',
        secondary:
          'bg-[var(--c-canvas)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-card-hover)]',
        outline:
          'border border-[var(--c-border)] bg-transparent text-[var(--c-text)] hover:bg-[var(--c-canvas)]',
        ghost:
          'bg-transparent text-[var(--c-text-soft)] hover:bg-[var(--c-canvas)] hover:text-[var(--c-text)]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        link:
          'text-[var(--c-accent)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-7 px-3 text-xs',
        lg:      'h-11 px-6 text-base',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

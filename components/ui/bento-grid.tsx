'use client';

import { cn } from '../../lib/cn';
import { ReactNode } from 'react';

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-4 auto-rows-[18rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  name?: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ElementType;
  description?: string;
  href?: string;
  cta?: string;
  children?: ReactNode;
}

function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl',
        'bg-white',
        '[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_4px_8px_rgba(0,0,0,.08),0_20px_40px_rgba(0,0,0,.08)]',
        className,
      )}
    >
      {/* Background content */}
      {background && (
        <div className="absolute inset-0 overflow-hidden">
          {background}
        </div>
      )}

      {/* Children content (takes priority over name/description pattern) */}
      {children ? (
        <div className="relative z-10 h-full">
          {children}
        </div>
      ) : (
        <>
          {/* Bottom content */}
          <div className="pointer-events-none relative z-10 mt-auto flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
            {Icon && (
              <Icon className="h-10 w-10 text-[var(--c-text-muted)] mb-2 transition-colors duration-300 group-hover:text-[var(--c-accent)]" />
            )}
            {name && (
              <h3 className="text-base font-semibold text-[var(--c-text)]">{name}</h3>
            )}
            {description && (
              <p className="text-sm text-[var(--c-text-muted)] leading-relaxed">{description}</p>
            )}
          </div>

          {/* CTA — slides in on hover */}
          {href && cta && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex translate-y-8 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <a
                href={href}
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--c-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--c-accent-hover)] transition-colors"
              >
                {cta}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { BentoGrid, BentoCard };

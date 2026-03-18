'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BentoGrid({ className, children }) {
  return (
    <div className={cn('grid auto-rows-[185px] grid-cols-3 gap-3', className)}>
      {children}
    </div>
  );
}

export function BentoCard({ className, href, cta, children }) {
  const hasCta = !!(href && cta);

  const inner = (
    <>
      <div className={cn('h-full', hasCta && 'transition-all duration-300 ease-out group-hover:-translate-y-4')}>
        {children}
      </div>
      {hasCta && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex translate-y-6 items-center justify-between px-5 py-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-xs font-semibold text-[#0071E3]">{cta}</span>
          <svg className="w-3.5 h-3.5 text-[#0071E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      )}
    </>
  );

  const base = cn(
    'group relative col-span-3 overflow-hidden rounded-xl',
    'bg-[var(--c-card)] border border-[var(--c-border)]',
    'transition-[border-color] duration-200 hover:border-[var(--c-border-strong)]',
    className,
  );

  if (href) return <Link href={href} className={base}>{inner}</Link>;
  return <div className={base}>{inner}</div>;
}

// legacy named exports for any existing imports
export { BentoGrid as BentoGrid_legacy, BentoCard as BentoCard_legacy };

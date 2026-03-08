'use client';

import { cn } from '../../lib/cn';

/**
 * Skeleton loading placeholder.
 * @param {'line'|'circle'|'rect'} shape
 * @param {string} width  - Tailwind width class e.g. 'w-32'
 * @param {string} height - Tailwind height class e.g. 'h-4'
 */
function Skeleton({ shape = 'rect', width, height, className, ...props }) {
  return (
    <div
      className={cn(
        'skeleton',
        shape === 'circle' && 'rounded-full',
        shape === 'line'   && 'rounded-md',
        shape === 'rect'   && 'rounded-xl',
        width,
        height ?? (shape === 'line' ? 'h-4' : 'h-10'),
        !width && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

/** Pre-built skeleton for a text paragraph */
function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="line"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

/** Pre-built skeleton for a card */
function SkeletonCard({ className }) {
  return (
    <div className={cn('p-5 rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" width="w-10" height="h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="line" className="w-1/2" />
          <Skeleton shape="line" className="w-1/3 h-3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard };
export default Skeleton;

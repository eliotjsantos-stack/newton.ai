'use client';

import { cn } from '../../lib/cn';

const sizes = {
  xs:  { outer: 'w-6 h-6',   text: 'text-[10px]', dot: 'w-1.5 h-1.5 border' },
  sm:  { outer: 'w-8 h-8',   text: 'text-xs',      dot: 'w-2 h-2 border' },
  md:  { outer: 'w-10 h-10', text: 'text-sm',      dot: 'w-2.5 h-2.5 border-2' },
  lg:  { outer: 'w-12 h-12', text: 'text-base',    dot: 'w-3 h-3 border-2' },
  xl:  { outer: 'w-16 h-16', text: 'text-lg',      dot: 'w-3.5 h-3.5 border-2' },
};

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function Avatar({ src, name, size = 'md', online, className, ...props }) {
  const s = sizes[size] ?? sizes.md;
  const initials = getInitials(name);

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <div className={cn(
        'rounded-full overflow-hidden flex items-center justify-center',
        'bg-brand/15 text-brand font-semibold select-none',
        s.outer,
      )}>
        {src ? (
          <img src={src} alt={name ?? 'avatar'} className="w-full h-full object-cover" />
        ) : (
          <span className={s.text}>{initials || '?'}</span>
        )}
      </div>

      {online !== undefined && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-[var(--c-card)]',
          s.dot,
          online ? 'bg-[var(--c-success)]' : 'bg-[var(--c-text-muted)]',
        )} />
      )}
    </div>
  );
}

function AvatarGroup({ avatars = [], size = 'md', max = 4, className }) {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - shown.length;
  const s = sizes[size] ?? sizes.md;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {shown.map((a, i) => (
        <Avatar key={i} {...a} size={size} className="ring-2 ring-[var(--c-card)]" />
      ))}
      {extra > 0 && (
        <div className={cn(
          'rounded-full flex items-center justify-center ring-2 ring-[var(--c-card)]',
          'bg-[var(--c-hover)] text-[var(--c-text-soft)] font-medium select-none',
          s.outer, s.text,
        )}>
          +{extra}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
export default Avatar;

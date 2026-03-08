'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Minimal dropdown menu.
 *
 * Usage:
 *   <Dropdown trigger={<Button>Open</Button>}>
 *     <DropdownItem onClick={...}>Edit</DropdownItem>
 *     <DropdownDivider />
 *     <DropdownItem danger onClick={...}>Delete</DropdownItem>
 *   </Dropdown>
 */
function Dropdown({ trigger, align = 'left', children, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[160px] py-1 rounded-xl',
            'bg-[var(--c-popover)] border border-[var(--c-border)] shadow-xl',
            'animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ onClick, danger = false, disabled = false, icon, className, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100',
        danger
          ? 'text-[var(--c-error)] hover:bg-[var(--c-error-muted)]'
          : 'text-[var(--c-text)] hover:bg-[var(--c-hover)]',
        disabled && 'opacity-40 pointer-events-none',
        className,
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0 text-[var(--c-text-muted)]">{icon}</span>}
      {children}
    </button>
  );
}

function DropdownDivider({ className }) {
  return <div className={cn('my-1 h-px bg-[var(--c-border-subtle)]', className)} />;
}

function DropdownLabel({ className, children }) {
  return (
    <div className={cn('px-3 py-1.5 text-xs font-medium text-[var(--c-text-muted)] uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}

export { Dropdown, DropdownItem, DropdownDivider, DropdownLabel };
export default Dropdown;

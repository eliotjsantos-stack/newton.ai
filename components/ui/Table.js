'use client';

import { cn } from '../../lib/cn';

function Table({ className, children, ...props }) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-[var(--c-border)] card-shadow', className)}>
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHead({ className, children, ...props }) {
  return (
    <thead className={cn('bg-[var(--c-canvas)] border-b border-[var(--c-border)]', className)} {...props}>
      {children}
    </thead>
  );
}

function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-[var(--c-border)] bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

function TableRow({ className, clickable = false, children, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        clickable && 'cursor-pointer hover:bg-[var(--c-canvas)]',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function TableHeader({ align = 'left', className, children, ...props }) {
  return (
    <th
      className={cn(
        'px-4 py-3 font-semibold text-[var(--c-text-muted)] text-xs whitespace-nowrap',
        align === 'right'  && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({ align = 'left', muted = false, className, children, ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3',
        muted ? 'text-[var(--c-text-soft)]' : 'text-[var(--c-text)]',
        align === 'right'  && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell };
export default Table;

/**
 * Utility for conditional class name merging.
 * Filters falsy values and joins with spaces.
 *
 * Usage: cn('base', condition && 'conditional', 'always')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names, resolving Tailwind conflicts (last wins).
 * `cn('px-2', condition && 'px-4')` → 'px-4'.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

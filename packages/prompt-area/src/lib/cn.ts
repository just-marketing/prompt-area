import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware conflict resolution.
 *
 * Bundled into the npm package so consumers don't need a `@/lib/utils`
 * helper. The package build aliases `@/lib/utils` to this module, while
 * the shadcn registry continues to rely on the consumer's own utils.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

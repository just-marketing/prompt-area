import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware conflict resolution.
 *
 * The `cn` helper is bundled into the npm package so consumers don't need a
 * `@/lib/utils` helper of their own; the package build aliases `@/lib/utils`
 * to this module, while the shadcn registry relies on the consumer's own
 * utils. `clsx` and `tailwind-merge` are peer dependencies, kept out of the
 * bundle so they dedupe with the copies any shadcn/Tailwind project already
 * ships rather than shipping a second copy.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

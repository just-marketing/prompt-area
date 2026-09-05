/**
 * Merge class names with Tailwind-aware conflict resolution.
 *
 * The `cn` helper is bundled into the npm package so consumers don't need a
 * `@/lib/utils` helper of their own; the package build aliases `@/lib/utils`
 * to this module, while the shadcn registry relies on the consumer's own
 * utils. The implementation comes from the `cn` package (shadcn's compiled
 * drop-in replacement for `clsx` + `tailwind-merge`), declared as a peer
 * dependency and kept out of the bundle so it dedupes with the copy any
 * shadcn/Tailwind project already ships rather than shipping a second one.
 */
export { cn } from 'cn'

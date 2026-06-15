'use client'

import { cn } from '@/lib/utils'
import type { StatusBarProps } from './types'

/**
 * StatusBar - A horizontal bar with left and right slots.
 *
 * Designed to sit above or below a text input (e.g., PromptArea) to
 * display contextual information. Place it as a sibling before or
 * after the input inside a shared wrapper.
 *
 * @example
 * ```tsx
 * <div className="rounded-lg border">
 *   <StatusBar
 *     left={<span>prompt-area</span>}
 *     right={<span>Default</span>}
 *   />
 *   <PromptArea value={segments} onChange={setSegments} ... />
 * </div>
 * ```
 */
export function StatusBar({
  left,
  right,
  className,
  disabled = false,
  'aria-label': ariaLabel,
  'data-test-id': dataTestId,
  ref,
}: StatusBarProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel ?? 'Status bar'}
      aria-disabled={disabled || undefined}
      data-test-id={dataTestId}
      className={cn(
        'status-bar',
        'flex items-center justify-between gap-2 px-3 py-1.5 text-xs',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}>
      {left && <div className="flex items-center gap-1.5">{left}</div>}
      {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
    </div>
  )
}

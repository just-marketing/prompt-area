'use client'

import { cn } from '@/lib/utils'
import type { ActionBarProps } from './types'

/**
 * ActionBar - A horizontal toolbar with left and right slots.
 *
 * Designed to sit below a text input (e.g., PromptArea) and stay
 * anchored via normal document flow. Place it as a sibling after
 * the input inside a shared wrapper.
 *
 * @example
 * ```tsx
 * <div className="rounded-lg border p-4">
 *   <PromptArea value={segments} onChange={setSegments} ... />
 *   <ActionBar
 *     left={
 *       <>
 *         <button><PlusCircle /></button>
 *         <button><AtSign /></button>
 *       </>
 *     }
 *     right={
 *       <>
 *         <button><Mic /></button>
 *         <button onClick={handleSubmit}><ArrowUp /></button>
 *       </>
 *     }
 *   />
 * </div>
 * ```
 */
export function ActionBar({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  disabled = false,
  'aria-label': ariaLabel,
  'data-test-id': dataTestId,
  ref,
}: ActionBarProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={ariaLabel ?? 'Action bar'}
      aria-disabled={disabled || undefined}
      data-test-id={dataTestId}
      className={cn(
        'action-bar',
        'flex items-center justify-between gap-2 pt-2',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}>
      {left && <div className={cn('flex items-center gap-1', leftClassName)}>{left}</div>}
      {right && (
        <div className={cn('ml-auto flex items-center gap-1', rightClassName)}>{right}</div>
      )}
    </div>
  )
}

'use client'

import { forwardRef } from 'react'
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
export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  (
    {
      left,
      right,
      className,
      disabled = false,
      'aria-label': ariaLabel,
      'data-test-id': dataTestId,
    },
    ref,
  ) => {
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
        {left && <div className="flex items-center gap-1">{left}</div>}
        {right && <div className="ml-auto flex items-center gap-1">{right}</div>}
      </div>
    )
  },
)

ActionBar.displayName = 'ActionBar'

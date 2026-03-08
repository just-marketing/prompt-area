/**
 * Convenience hook that wires up all the boilerplate state for a PromptArea.
 *
 * Instead of manually managing `useState<Segment[]>`, `useRef<PromptAreaHandle>`,
 * and computing derived values, call `usePromptAreaState()` once and spread
 * `bind` into your `<PromptArea>`.
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { bind, plainText, isEmpty, chips, clear, focus } = usePromptAreaState()
 *
 *   return (
 *     <PromptArea
 *       {...bind}
 *       onSubmit={() => {
 *         sendMessage(plainText)
 *         clear()
 *       }}
 *     />
 *   )
 * }
 * ```
 */

'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { Segment, ChipSegment, PromptAreaHandle } from './types'
import { segmentsToPlainText } from './prompt-area-engine'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type UsePromptAreaStateOptions = {
  /** Initial segment value. Defaults to `[]`. */
  initialValue?: Segment[]
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type PromptAreaBind = {
  /** Ref to attach to PromptArea — gives access to imperative methods. */
  ref: React.RefObject<PromptAreaHandle | null>
  /** Current segment array — pass as `value` prop. */
  value: Segment[]
  /** Setter — pass as `onChange` prop. */
  onChange: (segments: Segment[]) => void
}

export type PromptAreaState = {
  /** Props to spread directly onto `<PromptArea {...bind} />`. Contains ref, value, and onChange. */
  bind: PromptAreaBind
  /** Derived plain text representation of the current value. */
  plainText: string
  /** `true` when the value is empty or whitespace-only. */
  isEmpty: boolean
  /** `true` when the value contains at least one chip. */
  hasChips: boolean
  /** All chip segments in the current value. */
  chips: ChipSegment[]
  /** Clear all content (both state and the editor DOM). */
  clear: () => void
  /** Focus the editor. */
  focus: () => void
  /** Blur the editor. */
  blur: () => void
  /** Insert a chip at the current cursor position. */
  insertChip: (chip: Omit<ChipSegment, 'type'>) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePromptAreaState(options: UsePromptAreaStateOptions = {}): PromptAreaState {
  const { initialValue = [] } = options

  const [value, setValue] = useState<Segment[]>(initialValue)
  const ref = useRef<PromptAreaHandle>(null)

  // Derived
  const plainText = useMemo(() => segmentsToPlainText(value), [value])

  const isEmpty = useMemo(() => {
    if (value.length === 0) return true
    return value.every((seg) => seg.type === 'text' && seg.text.trim() === '')
  }, [value])

  const hasChips = useMemo(() => value.some((seg) => seg.type === 'chip'), [value])

  const chips = useMemo(
    () => value.filter((seg): seg is ChipSegment => seg.type === 'chip'),
    [value],
  )

  // Bind object — safe to spread onto <PromptArea>
  const bind = useMemo<PromptAreaBind>(() => ({ ref, value, onChange: setValue }), [value])

  // Actions that proxy to the imperative handle
  const clear = useCallback(() => {
    if (ref.current) {
      ref.current.clear()
    } else {
      setValue([])
    }
  }, [])

  const focus = useCallback(() => ref.current?.focus(), [])
  const blur = useCallback(() => ref.current?.blur(), [])

  const insertChip = useCallback(
    (chip: Omit<ChipSegment, 'type'>) => ref.current?.insertChip(chip),
    [],
  )

  return {
    bind,
    plainText,
    isEmpty,
    hasChips,
    chips,
    clear,
    focus,
    blur,
    insertChip,
  }
}

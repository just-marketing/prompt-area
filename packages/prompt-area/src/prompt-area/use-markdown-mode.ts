/**
 * Hook that toggles a PromptArea between its markdown and plain-text variants.
 *
 * PromptArea's `markdown` prop controls whether inline markdown (bold, italic,
 * URLs, and list bullets) is rendered and whether typed list markers normalize
 * to `•`. Flipping it at runtime is non-destructive: the segment value is kept,
 * only its rendering changes (bullets convert `•` ↔ `-` when `normalizeBullets`
 * is on). This hook owns that boolean as a named "mode" and hands you a `toggle`
 * plus a `markdown` value ready to spread onto the component.
 *
 * @example
 * ```tsx
 * function Composer() {
 *   const { bind } = usePromptAreaState()
 *   const { markdown, mode, toggle } = useMarkdownMode()
 *
 *   return (
 *     <>
 *       <PromptArea {...bind} markdown={markdown} />
 *       <button onClick={toggle} aria-pressed={markdown}>
 *         {mode === 'markdown' ? 'Markdown' : 'Plain text'}
 *       </button>
 *     </>
 *   )
 * }
 * ```
 */

'use client'

import { useCallback, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Mode
// ---------------------------------------------------------------------------

/**
 * The two rendering variants of a PromptArea.
 * - `'markdown'`: inline markdown is decorated and list markers normalize to `•`.
 * - `'plain'`: raw source text is shown verbatim with no decoration.
 */
export type PromptAreaMode = 'markdown' | 'plain'

/** Returns the other mode. Pure — handy for building custom toggles. */
export function oppositeMode(mode: PromptAreaMode): PromptAreaMode {
  return mode === 'markdown' ? 'plain' : 'markdown'
}

// ---------------------------------------------------------------------------
// Options / return type
// ---------------------------------------------------------------------------

export type UseMarkdownModeOptions = {
  /** Starting mode for the uncontrolled hook. Defaults to `'markdown'`. */
  initialMode?: PromptAreaMode
  /**
   * Controlled mode. When provided, the hook mirrors this value and never owns
   * its own state — drive changes through `onModeChange`.
   */
  mode?: PromptAreaMode
  /** Called with the next mode whenever `toggle`/`setMode` change it. */
  onModeChange?: (mode: PromptAreaMode) => void
}

export type MarkdownModeState = {
  /** The active mode. */
  mode: PromptAreaMode
  /** `true` in markdown mode — spread onto `<PromptArea markdown={markdown} />`. */
  markdown: boolean
  /** `true` in plain-text mode (the inverse of `markdown`). */
  isPlainText: boolean
  /** Switch to an explicit mode. No-op if already in it. */
  setMode: (mode: PromptAreaMode) => void
  /** Flip between markdown and plain text. */
  toggle: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarkdownMode(options: UseMarkdownModeOptions = {}): MarkdownModeState {
  const { initialMode = 'markdown', mode: controlledMode, onModeChange } = options
  const isControlled = controlledMode !== undefined

  const [internalMode, setInternalMode] = useState<PromptAreaMode>(
    () => controlledMode ?? initialMode,
  )

  const mode = isControlled ? controlledMode : internalMode

  const setMode = useCallback(
    (next: PromptAreaMode) => {
      if (next === mode) return
      if (!isControlled) setInternalMode(next)
      onModeChange?.(next)
    },
    [mode, isControlled, onModeChange],
  )

  const toggle = useCallback(() => setMode(oppositeMode(mode)), [mode, setMode])

  return useMemo(
    () => ({
      mode,
      markdown: mode === 'markdown',
      isPlainText: mode === 'plain',
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  )
}

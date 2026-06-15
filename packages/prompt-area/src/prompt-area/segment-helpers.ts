/**
 * Convenience helpers for creating and inspecting Segments.
 *
 * These reduce boilerplate when building AI chat UIs that work with the
 * PromptArea document model.
 *
 * @example
 * ```ts
 * import { text, chip, isSegmentsEmpty, segmentsToPlainText } from './segment-helpers'
 *
 * const greeting = [text('Hello '), chip({ trigger: '@', value: 'u1', displayText: 'Alice' })]
 * isSegmentsEmpty(greeting) // false
 * segmentsToPlainText(greeting) // "Hello @Alice"
 * ```
 */

import type { Segment, TextSegment, ChipSegment } from './types'
import { segmentsToPlainText, plainTextToSegments } from './prompt-area-engine'

// Re-export serialization utilities so consumers have a single import.
export { segmentsToPlainText, plainTextToSegments }

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

/** Create a text segment. */
export function text(value: string): TextSegment {
  return { type: 'text', text: value }
}

/** Create a chip segment. */
export function chip(opts: Omit<ChipSegment, 'type'>): ChipSegment {
  return { type: 'chip', ...opts }
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/** Returns `true` when the segment array is empty or contains only whitespace text. */
export function isSegmentsEmpty(segments: Segment[]): boolean {
  if (segments.length === 0) return true
  return segments.every((seg) => seg.type === 'text' && seg.text.trim() === '')
}

/** Returns `true` when the segment array contains at least one chip. */
export function hasChips(segments: Segment[]): boolean {
  return segments.some((seg) => seg.type === 'chip')
}

/** Extracts all chip segments from a segment array. */
export function getChips(segments: Segment[]): ChipSegment[] {
  return segments.filter((seg): seg is ChipSegment => seg.type === 'chip')
}

/** Extracts chips matching a specific trigger character. */
export function getChipsByTrigger(segments: Segment[], trigger: string): ChipSegment[] {
  return segments.filter(
    (seg): seg is ChipSegment => seg.type === 'chip' && seg.trigger === trigger,
  )
}

/**
 * PromptArea usage analytics
 *
 * A typed event stream describing how end users interact with the composer,
 * delivered to the host application via the `onAnalyticsEvent` prop. The
 * package never transmits anything itself — events exist only inside the
 * integrator's own callback, ready to forward to PostHog, GA4, Segment, or
 * any other tool.
 *
 * Privacy by design: payloads carry metadata only — counts, lengths, trigger
 * characters, and interaction methods. No typed text, no queries, no chip
 * display text. Chip `value` (the integrator's own suggestion ID) is included
 * only when it came from the integrator (`select`, `activate`,
 * `programmatic`); it is omitted for auto-resolved chips, where it would be
 * user-typed text.
 */

import type { Segment } from './types'
import { segmentsToPlainText } from './prompt-area-engine'

/**
 * How a chip came to exist.
 * - 'select': picked from the trigger dropdown
 * - 'auto_resolve': resolved from typed text on space (`resolveOnSpace`)
 * - 'activate': inserted via a callback/launch trigger's `insertChip`
 * - 'paste': carried in by pasted content
 * - 'programmatic': inserted by the host via the imperative `insertChip`
 */
export type ChipAddMethod = 'select' | 'auto_resolve' | 'activate' | 'paste' | 'programmatic'

/**
 * A usage event emitted through `onAnalyticsEvent`.
 *
 * New event types — and new literals in fields like `method` — are added in
 * minor releases. Do not exhaustively match with a `never` check; always keep
 * a default branch. New fields on existing events are only ever optional.
 *
 * Emission semantics (deduplication is part of the contract):
 * - 'input_start': once per compose session — re-armed on mount, after a
 *   `submit` emission, on `clear()`, and when the host resets `value` to
 *   empty. A draft prefilled via `setText`/`appendText` and submitted without
 *   typing produces a `submit` with no preceding 'input_start'.
 * - 'submit': one per submit gesture (Enter or a send button). Emitted only
 *   when an `onSubmit` handler is wired. It does not imply a message was
 *   accepted — the editor may be empty; filter on `textLength` downstream.
 * - 'trigger_activate': once per activation (not per keystroke while the
 *   query is being typed).
 * - 'max_length_reached': once per at-cap episode — re-armed when the length
 *   drops back below `maxLength`.
 * - 'undo' / 'redo': only when a history snapshot was actually applied.
 * - 'search_empty': once per trigger activation, when a completed search
 *   first returns zero results; re-armed by a non-empty result.
 */
export type PromptAreaAnalyticsEvent =
  /** First user input of a compose session. See emission semantics above. */
  | { type: 'input_start' }
  /** A submit gesture. `msSinceInputStart` is null when no 'input_start'
   * preceded it (prefilled draft, or a gesture outside the editor such as a
   * host-owned send button). */
  | {
      type: 'submit'
      /** 'enter' for the keyboard path, 'button' for a send-button click. */
      method: 'enter' | 'button'
      /** Plain-text length; chips count as `trigger + displayText`. */
      textLength: number
      /** Total number of chips in the submitted value. */
      chipCount: number
      /** Chip counts keyed by trigger character, e.g. `{ '@': 2, '#': 1 }`. */
      chipCountByTrigger: Record<string, number>
      /** Image attachments present at submit time. */
      imageCount: number
      /** File attachments present at submit time. */
      fileCount: number
      /** Milliseconds since this session's 'input_start', or null. */
      msSinceInputStart: number | null
    }
  /** A trigger became active (dropdown opened, or a callback/launch fired). */
  | { type: 'trigger_activate'; trigger: string; mode: 'dropdown' | 'callback' | 'launch' }
  /** A chip was added. `value` is the integrator-supplied suggestion ID and
   * is omitted for auto-resolved chips (user-typed text). `index` and
   * `queryLength` are present for method 'select'. */
  | {
      type: 'chip_add'
      trigger: string
      method: ChipAddMethod
      value?: string
      /** Dropdown position of the selected suggestion (method 'select'). */
      index?: number
      /** Query length when the suggestion was selected (method 'select'). */
      queryLength?: number
    }
  /** A chip was removed — deleted outright, or an auto-resolved chip reverted
   * to plain text with backspace. `value` follows the same rule as 'chip_add'. */
  | { type: 'chip_delete'; trigger: string; method: 'delete' | 'revert'; value?: string }
  /** A completed suggestion search returned zero results. */
  | { type: 'search_empty'; trigger: string; queryLength: number }
  /** A suggestion search threw or rejected (non-abort). */
  | { type: 'search_error'; trigger: string }
  /** Content was pasted. `textLength` is the length of the pasted content,
   * not the document. */
  | { type: 'paste'; source: 'internal' | 'external'; textLength: number }
  /** An undo snapshot was applied. */
  | { type: 'undo' }
  /** A redo snapshot was applied. */
  | { type: 'redo' }
  /** Typing was truncated by the `maxLength` cap. */
  | { type: 'max_length_reached'; maxLength: number }
  /** An image was pasted from the clipboard. */
  | { type: 'image_paste' }
  /** The remove button on an image attachment was clicked. */
  | { type: 'image_remove' }
  /** The remove button on a file attachment was clicked. */
  | { type: 'file_remove' }

/** Handler for `onAnalyticsEvent`. Exceptions are caught and logged, never
 * propagated into the editor. */
export type PromptAreaAnalyticsHandler = (event: PromptAreaAnalyticsEvent) => void

/**
 * Conventional analytics event name for an event: `prompt_area_${type}`,
 * e.g. 'prompt_area_submit'. Use it when forwarding so independent
 * integrations end up with comparable names:
 *
 * ```ts
 * onAnalyticsEvent={(e) => posthog.capture(promptAreaEventName(e), e)}
 * ```
 */
export function promptAreaEventName(event: PromptAreaAnalyticsEvent): string {
  return `prompt_area_${event.type}`
}

/**
 * Build a 'submit' analytics event from a value. The component emits this
 * automatically for Enter submits (and `CompactPromptArea`'s send button);
 * call it yourself when a host-owned send button (e.g. in an `ActionBar`
 * slot) submits, so button submits reach your pipeline too:
 *
 * ```ts
 * handleAnalyticsEvent(buildSubmitEvent(segments, { method: 'button' }))
 * ```
 */
export function buildSubmitEvent(
  segments: Segment[],
  options?: {
    /** Defaults to 'button' — the host-owned path this helper exists for. */
    method?: 'enter' | 'button'
    imageCount?: number
    fileCount?: number
    msSinceInputStart?: number | null
  },
): PromptAreaAnalyticsEvent {
  let chipCount = 0
  const chipCountByTrigger: Record<string, number> = {}
  for (const seg of segments) {
    if (seg.type === 'chip') {
      chipCount++
      chipCountByTrigger[seg.trigger] = (chipCountByTrigger[seg.trigger] ?? 0) + 1
    }
  }
  return {
    type: 'submit',
    method: options?.method ?? 'button',
    textLength: segmentsToPlainText(segments).length,
    chipCount,
    chipCountByTrigger,
    imageCount: options?.imageCount ?? 0,
    fileCount: options?.fileCount ?? 0,
    msSinceInputStart: options?.msSinceInputStart ?? null,
  }
}

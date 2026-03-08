/**
 * Pre-built trigger configuration factories for common AI chat patterns.
 *
 * Each factory returns a full `TriggerConfig` with sensible defaults.
 * Pass only what you need to override.
 *
 * @example
 * ```tsx
 * <PromptArea
 *   triggers={[
 *     mentionTrigger({ onSearch: searchUsers }),
 *     commandTrigger({ onSearch: searchCommands }),
 *     hashtagTrigger(),
 *   ]}
 * />
 * ```
 */

import type { TriggerConfig } from './types'

// ---------------------------------------------------------------------------
// Shared option type — everything in TriggerConfig except the keys each
// factory sets by default.
// ---------------------------------------------------------------------------

type TriggerPresetOptions = Omit<Partial<TriggerConfig>, 'char' | 'position' | 'mode'>

// ---------------------------------------------------------------------------
// @mention — dropdown at any position
// ---------------------------------------------------------------------------

export type MentionTriggerOptions = TriggerPresetOptions & {
  /** Override the trigger character. Defaults to `'@'`. */
  char?: string
}

/**
 * Creates a **mention** trigger (`@`).
 *
 * Defaults: `position: 'any'`, `mode: 'dropdown'`, `chipStyle: 'pill'`,
 * accessible label `"mention"`.
 */
export function mentionTrigger(opts: MentionTriggerOptions = {}): TriggerConfig {
  const { char = '@', ...rest } = opts
  return {
    char,
    position: 'any',
    mode: 'dropdown',
    chipStyle: 'pill',
    accessibilityLabel: 'mention',
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// /command — dropdown only at line start
// ---------------------------------------------------------------------------

export type CommandTriggerOptions = TriggerPresetOptions & {
  /** Override the trigger character. Defaults to `'/'`. */
  char?: string
}

/**
 * Creates a **command** trigger (`/`).
 *
 * Defaults: `position: 'start'`, `mode: 'dropdown'`, `chipStyle: 'inline'`,
 * accessible label `"command"`.
 */
export function commandTrigger(opts: CommandTriggerOptions = {}): TriggerConfig {
  const { char = '/', ...rest } = opts
  return {
    char,
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    accessibilityLabel: 'command',
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// #hashtag — dropdown at any position, auto-resolve on space
// ---------------------------------------------------------------------------

export type HashtagTriggerOptions = TriggerPresetOptions & {
  /** Override the trigger character. Defaults to `'#'`. */
  char?: string
}

/**
 * Creates a **hashtag / tag** trigger (`#`).
 *
 * Defaults: `position: 'any'`, `mode: 'dropdown'`, `chipStyle: 'pill'`,
 * `resolveOnSpace: true`, accessible label `"tag"`.
 */
export function hashtagTrigger(opts: HashtagTriggerOptions = {}): TriggerConfig {
  const { char = '#', ...rest } = opts
  return {
    char,
    position: 'any',
    mode: 'dropdown',
    chipStyle: 'pill',
    resolveOnSpace: true,
    accessibilityLabel: 'tag',
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// Generic callback trigger (e.g., for file pickers, model selectors)
// ---------------------------------------------------------------------------

export type CallbackTriggerOptions = Omit<Partial<TriggerConfig>, 'mode'> & {
  /** The trigger character. Required. */
  char: string
}

/**
 * Creates a **callback** trigger that fires `onActivate` instead of showing
 * a dropdown. Useful for opening file pickers, model selectors, etc.
 *
 * Defaults: `position: 'start'`, `mode: 'callback'`.
 */
export function callbackTrigger(opts: CallbackTriggerOptions): TriggerConfig {
  const { char, ...rest } = opts
  return {
    char,
    position: 'start',
    mode: 'callback',
    ...rest,
  }
}

/**
 * Framework-agnostic helpers, safe to import from React Server Components.
 *
 * These are the same functions and types re-exported from the main entry,
 * but built without a `'use client'` boundary so they can run on the server
 * (e.g. converting stored segments to text, or parsing markdown in a route
 * handler). For the components and hooks, import from `prompt-area`.
 */
export {
  text,
  chip,
  isSegmentsEmpty,
  hasChips,
  getChips,
  getChipsByTrigger,
} from '../prompt-area/segment-helpers'

export {
  segmentsToPlainText,
  plainTextToSegments,
  isValidTriggerPosition,
  detectActiveTrigger,
  resolveChip,
  resolveTriggersInSegments,
  parseInlineMarkdown,
  segmentsEqual,
  mergeAdjacentTextSegments,
} from '../prompt-area/prompt-area-engine'
export type { MarkdownToken } from '../prompt-area/prompt-area-engine'

export {
  mentionTrigger,
  commandTrigger,
  hashtagTrigger,
  callbackTrigger,
} from '../prompt-area/trigger-presets'
export type {
  MentionTriggerOptions,
  CommandTriggerOptions,
  HashtagTriggerOptions,
  CallbackTriggerOptions,
} from '../prompt-area/trigger-presets'

export type {
  TextSegment,
  ChipSegment,
  Segment,
  TriggerPosition,
  TriggerMode,
  ChipStyle,
  TriggerSuggestion,
  TriggerConfig,
  TriggerActivateContext,
  ActiveTrigger,
  PromptAreaImage,
  PromptAreaFile,
} from '../prompt-area/types'

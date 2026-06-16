export { PromptArea } from './prompt-area'
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
  PromptAreaProps,
  PromptAreaHandle,
} from './types'

export { usePromptArea } from './use-prompt-area'
export { usePromptAreaState } from './use-prompt-area-state'
export type {
  UsePromptAreaStateOptions,
  PromptAreaBind,
  PromptAreaState,
} from './use-prompt-area-state'

export {
  text,
  chip,
  isSegmentsEmpty,
  hasChips,
  getChips,
  getChipsByTrigger,
} from './segment-helpers'

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
} from './prompt-area-engine'
export type { MarkdownToken } from './prompt-area-engine'

export { mentionTrigger, commandTrigger, hashtagTrigger, callbackTrigger } from './trigger-presets'
export type {
  MentionTriggerOptions,
  CommandTriggerOptions,
  HashtagTriggerOptions,
  CallbackTriggerOptions,
} from './trigger-presets'

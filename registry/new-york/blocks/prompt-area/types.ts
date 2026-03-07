/**
 * PromptArea component types
 *
 * A lightweight contentEditable-based text input that supports:
 * - Trigger characters (/, @, #) that activate handlers
 * - Immutable chips for resolved mentions/commands
 * - Configurable trigger behavior (dropdown vs callback)
 * - Simple inline markdown rendering
 */

/**
 * A segment of content within the editable text.
 * The document model is an ordered array of these segments.
 */
export type TextSegment = {
  type: 'text'
  text: string
}

export type ChipSegment = {
  type: 'chip'
  /** The trigger character that created this chip (e.g., '@', '#') */
  trigger: string
  /** The resolved value/ID (e.g., user ID, file ID) */
  value: string
  /** The display text shown in the chip */
  displayText: string
  /** Optional data payload attached to the chip */
  data?: unknown
  /**
   * True when this chip was auto-created by pressing space (resolveOnSpace).
   * Backspace on an auto-resolved chip reverts it to plain text instead of deleting.
   */
  autoResolved?: boolean
}

export type Segment = TextSegment | ChipSegment

/**
 * Determines where a trigger character is valid.
 * - 'start': Only valid at the very start of input or after a newline (e.g., slash commands)
 * - 'any': Valid after any whitespace boundary (e.g., @mentions)
 */
export type TriggerPosition = 'start' | 'any'

/**
 * Defines how a trigger behaves when activated.
 * - 'dropdown': Shows a popover with suggestions from `onSearch`
 * - 'callback': Fires `onActivate` immediately without a dropdown
 */
export type TriggerMode = 'dropdown' | 'callback'

/**
 * Visual style for rendered chips.
 * - 'pill': Button-like pill with background color, padding, border-radius (default)
 * - 'inline': Bold inline text that flows naturally with surrounding content
 */
export type ChipStyle = 'pill' | 'inline'

/**
 * A suggestion item shown in the trigger dropdown.
 */
export type TriggerSuggestion = {
  /** Unique value/ID for this suggestion */
  value: string
  /** Display label shown in the dropdown */
  label: string
  /** Optional description shown below the label */
  description?: string
  /** Optional icon element rendered before the label */
  icon?: React.ReactNode
  /** Optional arbitrary data passed through on selection */
  data?: unknown
}

/**
 * Configuration for a trigger character.
 */
export type TriggerConfig = {
  /** The trigger character (e.g., '/', '@', '#') */
  char: string
  /** Where this trigger is valid */
  position: TriggerPosition
  /** How this trigger behaves */
  mode: TriggerMode
  /**
   * For 'dropdown' mode: called with the current query to fetch suggestions.
   * Should return a list of suggestions to display.
   *
   * Receives an options object with an `AbortSignal` that is aborted when a
   * newer search supersedes this one. Pass it to `fetch()` or other async
   * APIs to cancel in-flight work automatically.
   */
  onSearch?: (
    query: string,
    options: { signal: AbortSignal },
  ) => TriggerSuggestion[] | Promise<TriggerSuggestion[]>
  /**
   * For 'dropdown' mode: called when a suggestion is selected.
   * Return the display text for the chip, or void to use `suggestion.label`.
   */
  onSelect?: (suggestion: TriggerSuggestion) => string | void
  /**
   * For 'callback' mode: called when the trigger is activated.
   * Receives the full input text and cursor position.
   */
  onActivate?: (context: TriggerActivateContext) => void
  /**
   * When true, pressing space while this trigger is active (with a non-empty query)
   * auto-resolves the typed text into a chip without selecting from the dropdown.
   * The auto-resolved chip can be reverted to plain text with backspace.
   * Useful for free-form tags (e.g., #hashtag).
   */
  resolveOnSpace?: boolean
  /**
   * Visual style for chips created by this trigger.
   * - 'pill' (default): Button-like pill with background, padding, border-radius
   * - 'inline': Bold inline text without pill styling
   */
  chipStyle?: ChipStyle
  /** CSS class name(s) applied to chips created by this trigger */
  chipClassName?: string
  /** Label used for accessibility (e.g., "mention", "command") */
  accessibilityLabel?: string
  /**
   * Debounce delay in milliseconds before calling `onSearch`.
   * Defaults to 0 (immediate). The initial empty-query search always fires
   * immediately regardless of this setting so the dropdown appears instantly.
   */
  searchDebounceMs?: number
  /**
   * Called when `onSearch` rejects or throws (non-abort errors only).
   * Use this to log errors or show toast notifications.
   */
  onSearchError?: (error: unknown) => void
  /**
   * Message shown in the dropdown when `onSearch` returns an empty array.
   * If omitted, the popover hides when there are no results (current behavior).
   */
  emptyMessage?: string
}

/**
 * Context passed to callback-mode trigger handlers.
 */
export type TriggerActivateContext = {
  /** The full plain text content at the time of activation */
  text: string
  /** The cursor offset position */
  cursorPosition: number
  /** Function to insert a chip at the current cursor position */
  insertChip: (chip: Omit<ChipSegment, 'type'>) => void
}

/**
 * Represents an active trigger being typed by the user.
 */
export type ActiveTrigger = {
  /** The trigger config that was activated */
  config: TriggerConfig
  /** Position (character offset) where the trigger character was typed */
  startOffset: number
  /** The text typed after the trigger character so far */
  query: string
}

/**
 * An image attachment displayed in the prompt area.
 * State is managed externally by the parent component.
 */
export type PromptAreaImage = {
  /** Unique identifier for this image */
  id: string
  /** URL to display (CDN URL or temporary blob URL for preview) */
  url: string
  /** Optional alt text for accessibility */
  alt?: string
  /** When true, shows a loading indicator over the thumbnail */
  loading?: boolean
}

/**
 * Props for the PromptArea component.
 */
export type PromptAreaProps = {
  /** The document segments (controlled) */
  value: Segment[]
  /** Called when the content changes */
  onChange: (segments: Segment[]) => void
  /** Trigger configurations */
  triggers?: TriggerConfig[]
  /** Placeholder text when empty. Pass an array of strings to animate between them. */
  placeholder?: string | string[]
  /** Additional CSS class for the container */
  className?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether to render simple inline markdown (bold, italic, URLs, lists) */
  markdown?: boolean
  /** Called when Enter is pressed (without Shift) */
  onSubmit?: (segments: Segment[]) => void
  /** Called when Escape is pressed */
  onEscape?: () => void
  /** Called when a chip element is clicked. Receives the chip's segment data. */
  onChipClick?: (chip: ChipSegment) => void
  /** Called when a new chip is added (dropdown selection, auto-resolve, paste, or imperative insert) */
  onChipAdd?: (chip: ChipSegment) => void
  /** Called when a chip is deleted (backspace or forward delete) */
  onChipDelete?: (chip: ChipSegment) => void
  /** Called when a URL link is clicked. Receives the URL string. */
  onLinkClick?: (url: string) => void
  /** Called after content is pasted. Receives the resulting segments and the paste source. */
  onPaste?: (data: { segments: Segment[]; source: 'internal' | 'external' }) => void
  /** Called after an undo operation. Receives the restored segments. */
  onUndo?: (segments: Segment[]) => void
  /** Called after a redo operation. Receives the restored segments. */
  onRedo?: (segments: Segment[]) => void
  /** Minimum height in pixels */
  minHeight?: number
  /** Maximum height in pixels */
  maxHeight?: number
  /** Auto-focus on mount */
  autoFocus?: boolean
  /** When true, the area auto-grows to fit content on focus and shrinks on blur */
  autoGrow?: boolean
  /** Accessible label for the input */
  'aria-label'?: string
  /** data-test-id for e2e testing */
  'data-test-id'?: string
  /** Array of image attachments to display */
  images?: PromptAreaImage[]
  /** Where to render the image strip relative to the text area. Defaults to 'above'. */
  imagePosition?: 'above' | 'below'
  /** Called when the user pastes an image from clipboard. Receives the File object. */
  onImagePaste?: (file: File) => void
  /** Called when the user clicks the remove button on an image */
  onImageRemove?: (image: PromptAreaImage) => void
  /** Called when the user clicks an image thumbnail */
  onImageClick?: (image: PromptAreaImage) => void
}

/**
 * Ref handle exposed by PromptArea via forwardRef/useImperativeHandle.
 */
export type PromptAreaHandle = {
  /** Focus the editable area */
  focus: () => void
  /** Blur the editable area */
  blur: () => void
  /** Insert a chip at the current cursor position */
  insertChip: (chip: Omit<ChipSegment, 'type'>) => void
  /** Get the current plain text (without chip markup) */
  getPlainText: () => string
  /** Clear all content */
  clear: () => void
}

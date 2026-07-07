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
 * - 'callback': Inserts the char, then fires `onActivate` with the typed query
 * - 'launch': Fires `onActivate` on keydown and SUPPRESSES the char (it never
 *   enters the editor) — for opening an external surface (dialog, palette) where
 *   no in-editor text should appear. Honors `position` like the other modes.
 */
export type TriggerMode = 'dropdown' | 'callback' | 'launch'

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
   * For 'callback' and 'launch' modes: called when the trigger is activated.
   * Receives the full input text and cursor position. For 'launch' it fires on
   * keydown (before the char would insert); for 'callback' it fires after.
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
   * For 'dropdown' mode: when true, clicking a chip created by this trigger
   * reopens the suggestion dropdown anchored to the chip, and selecting a
   * suggestion replaces the chip in place. The empty-query suggestions are
   * shown with the chip's current value preselected. `onChipClick` still
   * fires, so side effects (analytics, etc.) keep working.
   */
  reopenOnChipClick?: boolean
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
 * A file attachment displayed in the prompt area.
 * State is managed externally by the parent component.
 */
export type PromptAreaFile = {
  /** Unique identifier for this file */
  id: string
  /** Display filename (e.g., "report.pdf") */
  name: string
  /** File size in bytes */
  size?: number
  /** MIME type (used for icon selection, e.g., "application/pdf") */
  type?: string
  /** When true, shows a loading indicator over the file card */
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
  /**
   * When markdown is on, the editor rewrites typed list markers (`- ` / `* `)
   * to a `•` bullet glyph in the model. Set to `false` to keep the original
   * marker in the value/`onChange` text — needed when a host renders the output
   * as real markdown, where `•` is not a valid list marker. Default `true`.
   */
  normalizeBullets?: boolean
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
  /**
   * Maximum number of plain-text characters allowed, enforced on typed input:
   * once the editor exceeds the cap it is truncated back to this length, with
   * the caret kept where the edit happened. Chips count as their
   * `trigger + displayText` length.
   *
   * The cap applies to typing only. Paste is not capped — divert it via
   * `onRawPaste` if needed — and the imperative `setText` / `appendText` also
   * bypass it, so a programmatic write can exceed the cap until the next
   * keystroke truncates.
   */
  maxLength?: number
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
  /** Array of file attachments to display */
  files?: PromptAreaFile[]
  /** Where to render the file strip relative to the text area. Defaults to 'above'. */
  filePosition?: 'above' | 'below'
  /** Called when the user clicks the remove button on a file */
  onFileRemove?: (file: PromptAreaFile) => void
  /** Called when the user clicks a file attachment */
  onFileClick?: (file: PromptAreaFile) => void
  /**
   * Called on keydown before PromptArea's own handling. Call `preventDefault()`
   * to suppress the built-in behaviour (submit, trigger navigation, etc.) for
   * that key and take over entirely.
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  /**
   * Called on blur with the native FocusEvent, so consumers can inspect
   * `relatedTarget` (e.g. to retain focus when a composer toolbar is clicked).
   */
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void
  /**
   * Called at the start of a paste, before PromptArea reads the clipboard. Call
   * `preventDefault()` to take over the paste completely — e.g. to divert large
   * text or non-image files to an upload pipeline. The built-in segment/image
   * paste handling is skipped when the event's default is prevented.
   */
  onRawPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void
  /**
   * Whether pressing Enter (without Shift) submits. Defaults to true. Set false
   * to make Enter insert a newline instead (e.g. on touch devices where submit
   * is a dedicated button).
   */
  submitOnEnter?: boolean
  /** Forwarded to the editable element. */
  spellCheck?: boolean
  /** Forwarded to the editable element as `aria-describedby`. */
  'aria-describedby'?: string
}

/**
 * Ref handle exposed by PromptArea via useImperativeHandle.
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
  /**
   * Replace all content with plain text (chips dropped), caret moved to the
   * end. Not capped by `maxLength` (see its docs); undoable.
   */
  setText: (text: string) => void
  /**
   * Append plain text at the end (existing chips preserved), caret moved to the
   * end. Not capped by `maxLength` (see its docs); undoable.
   */
  appendText: (text: string) => void
  /** Caret offset in plain-text characters, or null when unavailable. */
  getCursorPosition: () => number | null
  /** Move the caret to a plain-text offset. */
  setCursorPosition: (offset: number) => void
  /** Move the caret to the end of the content. */
  setCursorToEnd: () => void
  /** Current selection as plain-text offsets, or null when there is none. */
  getSelection: () => { start: number; end: number } | null
  /** Set the selection between two plain-text offsets. */
  setSelection: (start: number, end: number) => void
}

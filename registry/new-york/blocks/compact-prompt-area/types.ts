import type {
  Segment,
  TriggerConfig,
  ChipSegment,
  PromptAreaImage,
  PromptAreaFile,
} from '../prompt-area/types'

export type CompactPromptAreaProps = {
  /** The document segments (controlled) */
  value: Segment[]
  /** Called when the content changes */
  onChange: (segments: Segment[]) => void
  /** Trigger configurations */
  triggers?: TriggerConfig[]
  /** Placeholder text when empty. Pass an array to animate between them. */
  placeholder?: string | string[]
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether to render simple inline markdown */
  markdown?: boolean
  /** Called when Enter is pressed (without Shift) */
  onSubmit?: (segments: Segment[]) => void
  /** Called when Escape is pressed */
  onEscape?: () => void
  /** Called when a chip element is clicked */
  onChipClick?: (chip: ChipSegment) => void
  /** Called when a new chip is added */
  onChipAdd?: (chip: ChipSegment) => void
  /** Called when a chip is deleted */
  onChipDelete?: (chip: ChipSegment) => void
  /** Called after content is pasted */
  onPaste?: (data: { segments: Segment[]; source: 'internal' | 'external' }) => void
  /** Array of image attachments */
  images?: PromptAreaImage[]
  /** Called when the user pastes an image */
  onImagePaste?: (file: File) => void
  /** Called when the user removes an image */
  onImageRemove?: (image: PromptAreaImage) => void
  /** Array of file attachments */
  files?: PromptAreaFile[]
  /** Called when the user removes a file */
  onFileRemove?: (file: PromptAreaFile) => void

  // ---- Compact-specific props ----

  /** Icon for the circular plus button on the left. Defaults to Plus icon. */
  plusButtonIcon?: React.ReactNode
  /** Click handler for the plus button */
  onPlusClick?: () => void
  /** Icon for the circular submit button on the right. Defaults to ArrowUp icon. */
  submitButtonIcon?: React.ReactNode
  /** Slot rendered immediately before the submit button (e.g., mic button) */
  beforeSubmitSlot?: React.ReactNode
  /** Maximum height the expanded area can reach in pixels. Defaults to 320. */
  maxHeight?: number
  /** Additional CSS class for the outer container */
  className?: string
  /** Accessible label */
  'aria-label'?: string
  /** data-test-id for e2e testing */
  'data-test-id'?: string
}

/**
 * StatusBar component types
 *
 * A horizontal bar with left and right slots, designed to sit
 * above or below a text input (e.g., PromptArea) to display
 * contextual information such as branch name, model selector, etc.
 */

/**
 * Props for the StatusBar component.
 */
export type StatusBarProps = {
  /** Content rendered on the left side of the bar */
  left?: React.ReactNode
  /** Content rendered on the right side of the bar */
  right?: React.ReactNode
  /** Additional CSS class for the root element */
  className?: string
  /** Whether the status bar is disabled (visually dims and disables pointer events) */
  disabled?: boolean
  /** Accessible label for the status bar */
  'aria-label'?: string
  /** data-test-id for e2e testing */
  'data-test-id'?: string
}

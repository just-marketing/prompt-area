/**
 * ActionBar component types
 *
 * A horizontal toolbar with left and right slots, designed to sit
 * below a text input (e.g., PromptArea) and stay anchored via
 * normal document flow.
 */

/**
 * Props for the ActionBar component.
 */
export type ActionBarProps = {
  /** Content rendered on the left side of the bar */
  left?: React.ReactNode
  /** Content rendered on the right side of the bar */
  right?: React.ReactNode
  /** Additional CSS class for the root element */
  className?: string
  /** Whether the action bar is disabled (visually dims and disables pointer events) */
  disabled?: boolean
  /** Accessible label for the toolbar */
  'aria-label'?: string
  /** data-test-id for e2e testing */
  'data-test-id'?: string
}

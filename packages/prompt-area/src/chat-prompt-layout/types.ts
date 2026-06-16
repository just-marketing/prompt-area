/**
 * ChatPromptLayout component types
 *
 * A full-height chat layout with a scrollable messages area and
 * a bottom-anchored prompt slot. Includes contextual scroll
 * navigation buttons.
 */

/**
 * Props for the ChatPromptLayout component.
 */
export type ChatPromptLayoutProps = {
  /** Chat messages rendered in the scrollable area */
  children: React.ReactNode
  /** Prompt area rendered at the bottom of the layout (slot) */
  prompt: React.ReactNode
  /** Additional CSS class for the root container */
  className?: string
  /** Accessible label for the layout region */
  'aria-label'?: string
  /** data-test-id for e2e testing */
  'data-test-id'?: string
}

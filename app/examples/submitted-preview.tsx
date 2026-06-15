'use client'

import { RotateCcw } from 'lucide-react'

/**
 * Shared "Submitted:" preview shown below the example composers, with a Reset
 * button. Pair with `useSubmittablePrompt`: pass `submitted?.text` and `reset`.
 * Renders nothing when there is no submission.
 */
export function SubmittedPreview({
  text,
  onReset,
}: {
  text: string | undefined
  onReset: () => void
}) {
  if (!text) return null
  return (
    <div className="bg-muted/50 rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-medium">Submitted:</div>
        <button
          type="button"
          onClick={onReset}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
          aria-label="Reset">
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>
      <div className="text-sm">{text}</div>
    </div>
  )
}

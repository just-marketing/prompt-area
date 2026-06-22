'use client'

import { useCallback, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { INSTALL_PROMPT } from '@/lib/install-prompt'

const TOOLBAR_BTN =
  'text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors'

/**
 * Copyable, multi-line "install with an AI agent" prompt. Renders the canonical
 * INSTALL_PROMPT in a box with a small toolbar (Expand / Copy) so users can
 * read the whole prompt before dropping it into Claude Code, Cursor, Codex,
 * etc. Collapsed by default to a few lines; Expand lifts the height cap. Used
 * by the homepage install tabs and the docs Installation page.
 */
export function InstallPromptBox({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(INSTALL_PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  return (
    <div className={`bg-muted/50 overflow-hidden rounded-lg border ${className ?? ''}`}>
      <div className="flex items-center justify-end gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={TOOLBAR_BTN}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse the install prompt' : 'Expand the install prompt'}>
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              Expand
            </>
          )}
        </button>
        <button
          type="button"
          onClick={copy}
          className={TOOLBAR_BTN}
          aria-label="Copy the install prompt">
          {copied ? (
            <>
              <Check className="size-3.5 text-green-600 dark:text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre
        className={`text-foreground [scrollbar-width:thin] overflow-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap ${
          expanded ? '' : 'max-h-24'
        }`}>
        {INSTALL_PROMPT}
      </pre>
    </div>
  )
}

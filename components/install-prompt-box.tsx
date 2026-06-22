'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { INSTALL_PROMPT } from '@/lib/install-prompt'

/**
 * Copyable, multi-line "install with an AI agent" prompt. Renders the canonical
 * INSTALL_PROMPT in a scrollable box with a copy button so users can drop it
 * straight into Claude Code, Cursor, Codex, etc. Used by the homepage install
 * tabs and the docs Installation page.
 */
export function InstallPromptBox({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(INSTALL_PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  return (
    <div className={`bg-muted/50 relative rounded-lg border ${className ?? ''}`}>
      <button
        onClick={copy}
        className="bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium backdrop-blur transition-colors"
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
      <pre className="text-foreground max-h-24 [scrollbar-width:thin] overflow-auto px-4 py-3 pr-20 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {INSTALL_PROMPT}
      </pre>
    </div>
  )
}

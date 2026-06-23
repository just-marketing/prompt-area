'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

/** Soft fade on the right edge so an overflowing command reads as scrollable. */
const FADE_MASK = 'linear-gradient(to right, #000 calc(100% - 1.5rem), transparent)'

/**
 * Copy-to-clipboard shell command box with a leading `$` prompt. Long commands
 * stay on one line and scroll, with a right-edge fade instead of a hard cut.
 * `compact` uses a smaller font for tight columns (e.g. the split hero).
 */
export function CommandBox({
  cmd,
  compact = false,
  method,
  location,
}: {
  cmd: string
  compact?: boolean
  /** Install method this command represents, e.g. 'npm' | 'pnpm' | 'yarn' | 'shadcn'. */
  method?: string
  /** Where on the site the box is rendered, e.g. 'hero' | 'docs'. */
  location?: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      track('install_command_copied', { method: method ?? 'unknown', command: cmd, location })
    })
  }, [cmd, method, location])

  return (
    <button
      onClick={copy}
      className="group bg-muted/50 hover:bg-muted flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
      aria-label={`Copy: ${cmd}`}>
      <span className="text-muted-foreground/60 font-mono text-sm select-none">$</span>
      <code
        className={cn(
          'text-foreground min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto font-mono whitespace-nowrap',
          compact ? 'text-xs' : 'text-xs sm:text-sm',
        )}
        style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}>
        {cmd}
      </code>
      {copied ? (
        <Check className="size-4 shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
      )}
    </button>
  )
}

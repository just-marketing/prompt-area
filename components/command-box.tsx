'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Copy-to-clipboard shell command box with a leading `$` prompt. */
export function CommandBox({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [cmd])

  return (
    <button
      onClick={copy}
      className="group bg-muted/50 hover:bg-muted flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
      aria-label={`Copy: ${cmd}`}>
      <span className="text-muted-foreground/60 font-mono text-sm select-none">$</span>
      <code className="text-foreground flex-1 overflow-x-auto font-mono text-xs sm:text-sm">
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

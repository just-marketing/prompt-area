'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Copies the canonical URL of the current docs page to the clipboard.
export function CopyPageButton() {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={copy}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
      )}>
      {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Maximize2, X } from 'lucide-react'
import { INSTALL_PROMPT } from '@/lib/install-prompt'
import { cn } from '@/lib/utils'

const TOOLBAR_BTN =
  'text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors'

/** Copy-to-clipboard button with copied-state feedback, reused by the box and the dialog. */
function CopyButton({ className = TOOLBAR_BTN }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(INSTALL_PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  return (
    <button type="button" onClick={copy} className={className} aria-label="Copy the install prompt">
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
  )
}

/**
 * Copyable "install with an AI agent" prompt. Shows a compact, scrollable
 * preview with Expand and Copy actions; Expand opens the full canonical
 * INSTALL_PROMPT in a centered modal (rendered through a portal so it isn't
 * clipped by the box or anchored to a transformed ancestor, and the page
 * layout stays put). Closes on Escape, backdrop click, or the close button.
 * Used by the homepage install tabs and the docs Installation page.
 */
export function InstallPromptBox({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      <div className={cn('bg-muted/50 overflow-hidden rounded-lg border', className)}>
        <div className="flex items-center justify-end gap-1 border-b px-2 py-1.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={TOOLBAR_BTN}
            aria-haspopup="dialog"
            aria-label="Expand the install prompt">
            <Maximize2 className="size-3.5" />
            Expand
          </button>
          <CopyButton />
        </div>
        <pre className="text-foreground max-h-24 [scrollbar-width:thin] overflow-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {INSTALL_PROMPT}
        </pre>
      </div>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
            onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Install Prompt Area with an AI agent"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className="bg-background relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-2xl outline-none">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Install with an AI agent</h2>
                <div className="flex items-center gap-1">
                  <CopyButton />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 items-center justify-center rounded-md transition-colors"
                    aria-label="Close">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <pre className="text-foreground flex-1 [scrollbar-width:thin] overflow-auto px-5 py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {INSTALL_PROMPT}
              </pre>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

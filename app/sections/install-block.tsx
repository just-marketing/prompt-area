'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

const CLI_COMMAND = 'npx shadcn@latest add https://prompt-area.com/r/prompt-area.json'

const AGENT_PROMPT = `Fetch https://prompt-area.com/llms-full.txt and read the full documentation. Install the prompt-area component by running: npx shadcn@latest add https://prompt-area.com/r/prompt-area.json — then add the required CSS classes from the documentation to globals.css and help me build a prompt input.`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 transition-colors"
      aria-label="Copy to clipboard">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function InstallBlock() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2 font-mono text-sm">
        <span>{CLI_COMMAND}</span>
        <CopyButton text={CLI_COMMAND} />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-xs font-medium">
          AI Agent Prompt (Claude Code, Codex, Cursor, etc.)
        </p>
        <div className="bg-muted flex items-start justify-between gap-2 rounded-md px-3 py-2 text-sm leading-relaxed">
          <span>{AGENT_PROMPT}</span>
          <CopyButton text={AGENT_PROMPT} />
        </div>
      </div>
    </div>
  )
}

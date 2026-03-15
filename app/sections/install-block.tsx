'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, Terminal, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const CLI_COMMAND = 'npx shadcn@latest add https://prompt-area.com/r/prompt-area.json'

const AGENT_PROMPT = `Fetch https://prompt-area.com/llms-full.txt and read the full documentation. Install the prompt-area component by running: npx shadcn@latest add https://prompt-area.com/r/prompt-area.json — then add the required CSS classes from the documentation to globals.css and help me build a prompt input.`

type Tab = 'cli' | 'agent'

export function InstallBlock() {
  const [tab, setTab] = useState<Tab>('cli')
  const [copied, setCopied] = useState(false)

  const content = tab === 'cli' ? CLI_COMMAND : AGENT_PROMPT

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b">
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              setTab('cli')
              setCopied(false)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
              tab === 'cli'
                ? 'border-foreground text-foreground border-b-2 font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            <Terminal className="size-3.5" />
            CLI
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('agent')
              setCopied(false)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
              tab === 'agent'
                ? 'border-foreground text-foreground border-b-2 font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            <Bot className="size-3.5" />
            AI Agent
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
          aria-label={`Copy ${tab === 'cli' ? 'command' : 'prompt'}`}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>

      <div
        className={cn(
          'bg-muted mt-2 rounded-md px-3 py-2 text-sm',
          tab === 'cli' ? 'font-mono' : 'leading-relaxed',
        )}>
        {content}
      </div>
    </div>
  )
}

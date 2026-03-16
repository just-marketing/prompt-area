'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { SectionHeading } from './section-heading'

const AGENT_PROMPT = `Fetch https://prompt-area.com/llms-full.txt and read the full documentation. Install the prompt-area component by running: npx shadcn@latest add https://prompt-area.com/r/prompt-area.json — then add the required CSS classes from the documentation to globals.css and help me build a prompt input. If there are any existing chat or prompt textarea inputs in the project, replace them with PromptArea using the context from the documentation.`

const COMPONENTS = [
  {
    name: 'Prompt Area',
    description: 'Core rich text input with triggers, markdown, and attachments',
    command: 'npx shadcn@latest add https://prompt-area.com/r/prompt-area.json',
  },
  {
    name: 'Action Bar',
    description: 'Horizontal toolbar companion with left/right slots',
    command: 'npx shadcn@latest add https://prompt-area.com/r/action-bar.json',
  },
  {
    name: 'Status Bar',
    description: 'Contextual info bar for model name, branch, or metadata',
    command: 'npx shadcn@latest add https://prompt-area.com/r/status-bar.json',
  },
  {
    name: 'Compact Prompt Area',
    description: 'Pill-shaped collapsible variant with plus and submit buttons',
    command: 'npx shadcn@latest add https://prompt-area.com/r/compact-prompt-area.json',
  },
  {
    name: 'Chat Prompt Layout',
    description: 'Full-height chat layout with scroll navigation',
    command: 'npx shadcn@latest add https://prompt-area.com/r/chat-prompt-layout.json',
  },
]

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

function ComponentInstallTabs() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = COMPONENTS[activeIndex]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1" role="tablist">
        {COMPONENTS.map((comp, i) => (
          <button
            key={comp.name}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              i === activeIndex
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}>
            {comp.name}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{active.description}</p>
      <div className="bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2 font-mono text-sm">
        <span className="min-w-0 truncate">{active.command}</span>
        <CopyButton text={active.command} />
      </div>
    </div>
  )
}

export function InstallSection() {
  return (
    <div id="installation" className="flex scroll-mt-16 flex-col gap-4">
      <SectionHeading id="installation" as="h2">
        Installation
      </SectionHeading>
      <p className="text-muted-foreground text-sm">
        Install individual components via the shadcn CLI, or use the AI agent prompt to set
        everything up in one go.
      </p>

      {/* Component install commands as tabs */}
      <ComponentInstallTabs />

      {/* AI Agent Prompt */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">AI Agent Prompt</span>
          <span className="text-muted-foreground text-xs">
            Claude Code, Codex, Cursor, Windsurf, etc.
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          Copy this prompt and give it to your AI coding agent to install and set up the component
          in a single step.
        </p>
        <div className="bg-muted flex items-start justify-between gap-2 rounded-md px-3 py-2 text-sm leading-relaxed">
          <span>{AGENT_PROMPT}</span>
          <CopyButton text={AGENT_PROMPT} />
        </div>
      </div>
    </div>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { WhatIsPromptArea } from './sections/what-is-prompt-area'

const DemoSection = dynamic(() =>
  import('./sections/demo-section').then((m) => ({ default: m.DemoSection })),
)

const BelowFoldSections = dynamic(() => import('./below-fold-sections'))

export default function HomeContent() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      {/* Hero */}
      <div id="hero" className="flex scroll-mt-16 flex-col gap-4 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Prompt Area</h1>
        <p className="text-muted-foreground text-lg">
          A production-grade rich text input for AI chat interfaces
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A contentEditable textarea with @mentions, /commands, #tags, inline markdown, file
          attachments, undo/redo, and dark mode. Built as a{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          component &mdash; install with one command, zero extra dependencies.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <a
            href="#installation"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById('installation')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                history.replaceState(null, '', '#installation')
              }
            }}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-4 py-2 text-sm font-medium transition-colors">
            Quick Start
          </a>
          <a
            href="https://github.com/team-gpt/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="border-input hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            GitHub
          </a>
        </div>
      </div>

      {/* What is Prompt Area? */}
      <WhatIsPromptArea />

      {/* Demo */}
      <div id="demo" className="scroll-mt-16">
        <DemoSection />
      </div>

      <BelowFoldSections />
    </div>
  )
}

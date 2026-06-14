import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DocsLead } from '@/components/docs/docs-primitives'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Examples',
  description:
    'Live, interactive examples of Prompt Area — triggers (@mentions, /commands, #tags), formatting, attachments, agent-style inputs, and developer-experience helpers.',
  alternates: { canonical: `${SITE_URL}/docs/examples` },
}

const EXAMPLES = [
  {
    href: '/docs/examples/triggers',
    title: 'Triggers',
    description: '@mentions, /commands, #tags, callbacks, and async search.',
  },
  {
    href: '/docs/examples/formatting',
    title: 'Formatting',
    description: 'Inline markdown and rotating placeholders.',
  },
  {
    href: '/docs/examples/attachments',
    title: 'Attachments',
    description: 'Image and file attachments, plus copy & paste with chips.',
  },
  {
    href: '/docs/examples/agent-inputs',
    title: 'Agent Inputs',
    description: 'Claude Code– and Codex-style composers built by composition.',
  },
  {
    href: '/docs/examples/dx-helpers',
    title: 'DX Helpers',
    description: 'usePromptAreaState, trigger presets, and segment helpers.',
  },
]

export default function ExamplesOverviewPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Examples</h1>
      <DocsLead>
        Live, interactive examples you can preview and copy. Each renders the real component —
        toggle between Preview and Code on any example.
      </DocsLead>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <Link
            key={ex.href}
            href={ex.href}
            className="group hover:bg-accent/40 flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors">
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{ex.title}</span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {ex.description}
              </span>
            </span>
            <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </>
  )
}

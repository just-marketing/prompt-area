import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { ClaudeCodeInputExample, claudeCodeInputCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Claude Code Style',
  description:
    'A Claude Code–style chat input built by composing Prompt Area with Action Bar and Status Bar — a file chip, a Plan-mode toggle, a model selector, and project/branch context.',
  alternates: { canonical: `${SITE_URL}/docs/examples/claude-code-style` },
}

export default function ClaudeCodeStylePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Claude Code Style</h1>
      <DocsLead>
        A faithful Claude Code–style composer, assembled from Prompt Area, Action Bar, and Status
        Bar — showing how the building blocks combine into a real agent input.
      </DocsLead>

      <DocsExample
        id="demo"
        title="Demo"
        description="A file chip above the input, a Plan-mode toggle and model selector in the action bar, and project/branch context in the status bar."
        code={claudeCodeInputCode}>
        <ClaudeCodeInputExample />
      </DocsExample>

      <DocsP>
        Composed from the{' '}
        <Link
          href="/docs/components/prompt-area"
          className="text-foreground font-medium underline underline-offset-4">
          Prompt Area
        </Link>
        ,{' '}
        <Link
          href="/docs/components/action-bar"
          className="text-foreground font-medium underline underline-offset-4">
          Action Bar
        </Link>
        , and{' '}
        <Link
          href="/docs/components/status-bar"
          className="text-foreground font-medium underline underline-offset-4">
          Status Bar
        </Link>{' '}
        components. Compare with the{' '}
        <Link
          href="/docs/examples/codex-style"
          className="text-foreground font-medium underline underline-offset-4">
          Codex style
        </Link>
        .
      </DocsP>
    </>
  )
}

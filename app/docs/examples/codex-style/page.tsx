import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { CodexInputExample, codexInputCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Codex Style',
  description:
    'An OpenAI Codex–style composer built with Prompt Area and Action Bar — a permissions pill, a reasoning-effort model selector, and a peeking repository/environment/branch context tray.',
  alternates: { canonical: `${SITE_URL}/docs/examples/codex-style` },
}

export default function CodexStylePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Codex Style</h1>
      <DocsLead>
        An OpenAI Codex–style cloud-agent composer: a large rounded card with a permissions menu and
        reasoning-effort model selector, layered over a peeking context tray.
      </DocsLead>

      <DocsExample
        id="demo"
        title="Demo"
        description="A “Do anything” prompt with a permissions pill and a lightning model selector in the toolbar, plus a context tray with repository, environment, and branch dropdowns."
        code={codexInputCode}>
        <CodexInputExample />
      </DocsExample>

      <DocsP>
        Built by composing the{' '}
        <Link
          href="/docs/components/prompt-area"
          className="text-foreground font-medium underline underline-offset-4">
          Prompt Area
        </Link>{' '}
        and{' '}
        <Link
          href="/docs/components/action-bar"
          className="text-foreground font-medium underline underline-offset-4">
          Action Bar
        </Link>
        . Compare with the{' '}
        <Link
          href="/docs/examples/claude-code-style"
          className="text-foreground font-medium underline underline-offset-4">
          Claude Code style
        </Link>
        .
      </DocsP>
    </>
  )
}

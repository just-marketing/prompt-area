import type { Metadata } from 'next'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import {
  ClaudeCodeInputExample,
  claudeCodeInputCode,
  CodexInputExample,
  codexInputCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Agent Inputs',
  description:
    'Full agent-style composers built by composing Prompt Area with Action Bar and Status Bar — Claude Code–style and OpenAI Codex–style inputs.',
  alternates: { canonical: `${SITE_URL}/docs/examples/agent-inputs` },
}

export default function AgentInputsExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Agent Inputs</h1>
      <DocsLead>
        Complete, real-world composers assembled from Prompt Area, Action Bar, and Status Bar —
        showing how the pieces combine into agent-style chat inputs.
      </DocsLead>

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="claude-code"
        title="Claude Code–style"
        description="A file chip above the input, a Plan-mode toggle and model selector in the action bar, and project/branch context in the status bar."
        code={claudeCodeInputCode}>
        <ClaudeCodeInputExample />
      </DocsExample>
      <DocsExample
        id="codex"
        title="Codex–style"
        description="A stacked composer with a permissions pill and reasoning-effort model selector, over a peeking tray of repository, environment, and branch selectors."
        code={codexInputCode}>
        <CodexInputExample />
      </DocsExample>
    </>
  )
}

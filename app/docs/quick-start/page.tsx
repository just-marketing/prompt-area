import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/code-block'
import { CodeTabs } from '@/components/code-tabs'
import { DocsLead, DocsP, DocsH2, Callout } from '@/components/docs/docs-primitives'
import { OpenInCodeSandbox } from '@/components/open-in-codesandbox'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Quick Start',
  description:
    'Render your first Prompt Area in React: manage state with usePromptAreaState, add @mentions and /commands, and read structured output for your LLM.',
  alternates: { canonical: `${SITE_URL}/docs/quick-start` },
}

export default function QuickStartPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Quick Start</h1>
      <DocsLead>
        Build a working chat input in a few steps — state, mentions, commands, and structured output
        you can send straight to a model.
      </DocsLead>

      <div className="flex flex-wrap items-center gap-3">
        <OpenInCodeSandbox />
        <Link
          href="/docs/try-it-live"
          className="text-muted-foreground hover:text-foreground text-sm font-medium underline underline-offset-4 transition-colors">
          Try it live in the browser
        </Link>
      </div>

      <DocsH2 id="render-with-state">Render with state</DocsH2>
      <DocsP>
        The{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">usePromptAreaState</code>{' '}
        hook manages the editor value and exposes derived state. Spread its{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">bind</code> onto the
        component:
      </DocsP>
      <CodeTabs
        label="Import style"
        tabs={[
          {
            label: 'npm',
            content: (
              <CodeBlock
                code={`'use client'

import { PromptArea, usePromptAreaState } from 'prompt-area'
import 'prompt-area/styles.css'

export function ChatInput() {
  const { bind, plainText, isEmpty, clear } = usePromptAreaState()

  function handleSubmit() {
    if (isEmpty) return
    sendToModel(plainText)
    clear()
  }

  return (
    <PromptArea
      {...bind}
      placeholder="Ask anything…"
      onSubmit={handleSubmit}
      autoGrow
      minHeight={48}
    />
  )
}`}
              />
            ),
          },
          {
            label: 'shadcn',
            content: (
              <CodeBlock
                code={`'use client'

import { PromptArea } from '@/components/prompt-area'
import { usePromptAreaState } from '@/components/use-prompt-area-state'

export function ChatInput() {
  const { bind, plainText, isEmpty, clear } = usePromptAreaState()

  function handleSubmit() {
    if (isEmpty) return
    sendToModel(plainText)
    clear()
  }

  return (
    <PromptArea
      {...bind}
      placeholder="Ask anything…"
      onSubmit={handleSubmit}
      autoGrow
      minHeight={48}
    />
  )
}`}
              />
            ),
          },
        ]}
      />
      <DocsP>
        The two differ only in imports: the npm package re-exports everything from{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">prompt-area</code> (and
        ships a stylesheet), while shadcn copies the source into{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">@/components</code>. The
        snippets below use the shadcn paths — for npm, import the same names from{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">prompt-area</code>.
      </DocsP>

      <DocsH2 id="add-triggers">Add mentions and commands</DocsH2>
      <DocsP>
        Triggers are just configuration. Use the presets and give each an{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">onSearch</code> function
        that returns items as the user types. Each selection becomes an immutable chip.
      </DocsP>
      <CodeBlock
        code={`import {
  mentionTrigger,
  commandTrigger,
} from '@/components/trigger-presets'

const USERS = [
  { value: 'ana', label: 'Ana', description: 'Designer' },
  { value: 'bob', label: 'Bob', description: 'Engineer' },
]
const COMMANDS = [
  { value: 'summarize', label: 'summarize', description: 'Summarize the thread' },
]

const search = (items) => (q) =>
  items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))

<PromptArea
  {...bind}
  triggers={[
    mentionTrigger({ onSearch: search(USERS) }),
    commandTrigger({ onSearch: search(COMMANDS) }),
  ]}
/>`}
      />

      <DocsH2 id="read-structured-output">Read structured output</DocsH2>
      <DocsP>
        Instead of parsing a string, read typed chips with{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">getChipsByTrigger</code>{' '}
        and send exactly what your prompt needs:
      </DocsP>
      <CodeBlock
        code={`import { getChipsByTrigger } from '@/components/segment-helpers'

const mentions = getChipsByTrigger(bind.value, '@').map((c) => c.value)
const command = getChipsByTrigger(bind.value, '/')[0]?.value

await runChat({ prompt: plainText, context: mentions, command })`}
      />

      <Callout>
        Want every prop and method? See the{' '}
        <Link
          href="/docs/api/prompt-area"
          className="text-foreground font-medium underline underline-offset-4">
          PromptArea Props
        </Link>{' '}
        and{' '}
        <Link
          href="/docs/api/hooks"
          className="text-foreground font-medium underline underline-offset-4">
          Hooks &amp; Helpers
        </Link>{' '}
        reference.
      </Callout>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/code-block'
import { DocsLead, DocsP, DocsH2, DocsH3, DocsUl } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { BasicExample, basicCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Prompt Area Component',
  description:
    'The PromptArea component: a controlled, contentEditable rich text input with trigger-based chips, inline markdown, attachments, and an imperative handle.',
  alternates: { canonical: `${SITE_URL}/docs/components/prompt-area` },
}

export default function PromptAreaComponentPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Prompt Area</h1>
      <DocsLead>
        The core component — a controlled, contentEditable input that renders text and immutable
        chip segments, with triggers, inline markdown, attachments, undo/redo, and an imperative
        handle.
      </DocsLead>

      <DocsH2 id="basic-usage">Basic usage</DocsH2>
      <DocsP>
        PromptArea is a controlled component: you own an array of{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Segment</code> values and
        pass <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">value</code> /{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">onChange</code>. In
        practice the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">usePromptAreaState</code>{' '}
        hook handles that for you.
      </DocsP>
      <CodeBlock
        code={`import { PromptArea } from '@/components/prompt-area/prompt-area'
import { usePromptAreaState } from '@/components/prompt-area/use-prompt-area-state'

const { bind } = usePromptAreaState()

<PromptArea {...bind} placeholder="Type a message…" autoGrow />`}
      />

      <DocsExample
        id="live-demo"
        title="Live demo"
        description="A plain input with Enter to submit — toggle to the Code tab to see the source."
        code={basicCode}>
        <BasicExample />
      </DocsExample>

      <DocsH2 id="segments">Segments</DocsH2>
      <DocsP>
        Content is an array of segments rather than a string. A segment is either a{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">TextSegment</code> or a{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">ChipSegment</code>. Chips
        are immutable, typed, and carry the data behind a mention, command, or tag — so you read
        structured values instead of parsing markup.
      </DocsP>

      <DocsH2 id="triggers">Triggers</DocsH2>
      <DocsP>
        A trigger maps a character (
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">@</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">/</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">#</code>, or a custom one)
        to a dropdown or callback. Selections resolve into chips. Use the presets for the common
        cases:
      </DocsP>
      <DocsUl
        items={[
          'mentionTrigger() — @ dropdown for users, agents, or documents',
          'commandTrigger() — / dropdown with start-of-line detection',
          'hashtagTrigger() — # tags that auto-resolve on space',
          'callbackTrigger() — fire a callback (e.g. open a file picker) instead of a dropdown',
        ]}
      />
      <DocsP>
        See{' '}
        <Link
          href="/docs/api/hooks"
          className="text-foreground font-medium underline underline-offset-4">
          Hooks &amp; Helpers
        </Link>{' '}
        for the preset signatures, and{' '}
        <Link
          href="/docs/api/prompt-area"
          className="text-foreground font-medium underline underline-offset-4">
          PromptArea Props
        </Link>{' '}
        for the full prop list.
      </DocsP>

      <DocsH2 id="imperative-handle">Imperative handle</DocsH2>
      <DocsP>
        The component exposes a ref handle for programmatic control:{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">focus()</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">blur()</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">insertChip()</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">getPlainText()</code>, and{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">clear()</code>. The state
        hook re-exposes these as convenient methods.
      </DocsP>

      <DocsH3 id="companions">Companion components</DocsH3>
      <DocsP>
        Compose PromptArea with the Action Bar, Status Bar, Compact variant, and Chat Prompt Layout
        to assemble full chat composers. Each is installed separately — see{' '}
        <Link
          href="/docs/installation"
          className="text-foreground font-medium underline underline-offset-4">
          Installation
        </Link>
        .
      </DocsP>
    </>
  )
}

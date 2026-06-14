import type { Metadata } from 'next'
import { DocsLead, DocsP, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import {
  MentionsExample,
  mentionsCode,
  CommandsExample,
  commandsCode,
  TagsExample,
  tagsCode,
  CallbackExample,
  callbackCode,
  AsyncSearchExample,
  asyncSearchCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Triggers',
  description:
    'Live examples of Prompt Area triggers: @mentions with a dropdown, /commands with start-of-line detection, #tags that auto-resolve, callback triggers, and debounced async search.',
  alternates: { canonical: `${SITE_URL}/docs/examples/triggers` },
}

export default function TriggersExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Triggers</h1>
      <DocsLead>
        Triggers turn characters into structured chips. Each preset opens a dropdown or fires a
        callback, and selections resolve into immutable, typed segments.
      </DocsLead>

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="mentions"
        title="@Mentions"
        description="Type @ followed by a name to search users."
        code={mentionsCode}>
        <MentionsExample />
      </DocsExample>
      <DocsExample
        id="commands"
        title="/Commands (start of line)"
        description="Type / at the beginning of a line to open the command menu."
        code={commandsCode}>
        <CommandsExample />
      </DocsExample>
      <DocsExample
        id="tags"
        title="#Tags (auto-resolve on space)"
        description="Type #tag and press space to auto-create a chip. Backspace reverts it."
        code={tagsCode}>
        <TagsExample />
      </DocsExample>
      <DocsExample
        id="callback"
        title="Callback mode"
        description="Fire a callback that programmatically inserts a chip — e.g. open a file picker."
        code={callbackCode}>
        <CallbackExample />
      </DocsExample>
      <DocsExample
        id="async-search"
        title="Async search"
        description="Debounced async search with AbortSignal cancellation and an empty state."
        code={asyncSearchCode}>
        <AsyncSearchExample />
      </DocsExample>

      <DocsP>
        See the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">trigger-presets</code>{' '}
        signatures in Hooks &amp; Helpers for the full options.
      </DocsP>
    </>
  )
}

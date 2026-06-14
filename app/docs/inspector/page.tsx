import type { Metadata } from 'next'
import { DocsLead, DocsP } from '@/components/docs/docs-primitives'
import { InspectorSection } from '@/app/sections/inspector-section'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Inspector',
  description:
    'An interactive playground for Prompt Area — inspect every event, segment, and API method in real time, and toggle disabled, markdown, and autoGrow.',
  alternates: { canonical: `${SITE_URL}/docs/inspector` },
}

export default function InspectorPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Inspector</h1>
      <DocsLead>
        A live playground. Inspect every event, segment, and API method in real time, and toggle{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">disabled</code>,{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">markdown</code>, and{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">autoGrow</code>.
      </DocsLead>
      <DocsP>
        All four trigger types (<code className="font-mono">/</code>,{' '}
        <code className="font-mono">@</code>, <code className="font-mono">#</code>,{' '}
        <code className="font-mono">!</code>) and every callback log to the event panel. Imperative
        handle methods are wired to the buttons below the input.
      </DocsP>

      <div className="mt-2">
        <InspectorSection />
      </div>
    </>
  )
}

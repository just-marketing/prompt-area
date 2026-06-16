import type { Metadata } from 'next'
import { InstallTabs } from '@/components/docs/install-tabs'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { CompactPromptAreaExample, compactPromptAreaCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Compact Prompt Area',
  description:
    'The Compact Prompt Area — a pill-shaped single-row input that expands downward on focus, with circular plus and submit buttons and a slot for extras like a microphone.',
  alternates: { canonical: `${SITE_URL}/docs/components/compact-prompt-area` },
}

export default function CompactPromptAreaPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Compact Prompt Area</h1>
      <DocsLead>
        A pill-shaped prompt input that expands downward on focus. Circular plus and submit buttons
        with a customizable slot for extras like a microphone. Independently installable.
      </DocsLead>

      <DocsH2 id="install">Install</DocsH2>
      <InstallTabs exportName="CompactPromptArea" block="compact-prompt-area" />

      <DocsH2 id="example">Example</DocsH2>
      <DocsExample
        id="demo"
        title="Demo"
        description="Compact single-row input with circular plus and submit buttons. Expands downward on focus with a microphone slot before the submit button."
        code={compactPromptAreaCode}>
        <CompactPromptAreaExample />
      </DocsExample>
    </>
  )
}

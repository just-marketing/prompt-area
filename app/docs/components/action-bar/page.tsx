import type { Metadata } from 'next'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { InstallTabs } from '@/components/docs/install-tabs'
import {
  ActionBarFullExample,
  actionBarFullCode,
  ActionBarMinimalExample,
  actionBarMinimalCode,
  ActionBarDisabledExample,
  actionBarDisabledCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Action Bar',
  description:
    'The Action Bar — a horizontal toolbar with left and right slots for buttons like attach, mention, mic, and send. Pairs below Prompt Area for a complete chat composer.',
  alternates: { canonical: `${SITE_URL}/docs/components/action-bar` },
}

export default function ActionBarPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Action Bar</h1>
      <DocsLead>
        A horizontal toolbar with left and right slots for buttons like attach, mention, command,
        mic, and send. It pairs below Prompt Area to form a complete chat input — and is
        independently installable.
      </DocsLead>

      <DocsH2 id="install">Install</DocsH2>
      <InstallTabs exportName="ActionBar" block="action-bar" />

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="full-featured"
        title="Full-featured"
        description="Left slot with an attach menu, @mention, /command, and #tag buttons; right slot with markdown toggle, microphone, and send."
        code={actionBarFullCode}>
        <ActionBarFullExample />
      </DocsExample>
      <DocsExample
        id="minimal"
        title="Minimal"
        description="Just a send button on the right — the simplest composition."
        code={actionBarMinimalCode}>
        <ActionBarMinimalExample />
      </DocsExample>
      <DocsExample
        id="disabled"
        title="Disabled"
        description="Both Prompt Area and Action Bar in a disabled state."
        code={actionBarDisabledCode}>
        <ActionBarDisabledExample />
      </DocsExample>
    </>
  )
}

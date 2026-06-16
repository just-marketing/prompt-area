import type { Metadata } from 'next'
import { InstallTabs } from '@/components/docs/install-tabs'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import {
  StatusBarAboveExample,
  statusBarAboveCode,
  StatusBarBelowExample,
  statusBarBelowCode,
  StatusBarBothExample,
  statusBarBothCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Status Bar',
  description:
    'The Status Bar — a compact info bar with left and right slots for contextual metadata like model name, branch, or project. Sits above or below Prompt Area.',
  alternates: { canonical: `${SITE_URL}/docs/components/status-bar` },
}

export default function StatusBarPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Status Bar</h1>
      <DocsLead>
        A compact bar with left and right slots for contextual information — model selector, branch
        name, or project context. Sits above or below Prompt Area, and is independently installable.
      </DocsLead>

      <DocsH2 id="install">Install</DocsH2>
      <InstallTabs exportName="StatusBar" block="status-bar" />

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="above-input"
        title="Above input"
        description="Status bar above the prompt area showing project context and settings."
        code={statusBarAboveCode}>
        <StatusBarAboveExample />
      </DocsExample>
      <DocsExample
        id="below-input"
        title="Below input"
        description="Status bar below the prompt area with action shortcuts and a model selector."
        code={statusBarBelowCode}>
        <StatusBarBelowExample />
      </DocsExample>
      <DocsExample
        id="combined"
        title="Combined with Action Bar"
        description="Status bar on top with an action bar below the input for a full-featured layout."
        code={statusBarBothCode}>
        <StatusBarBothExample />
      </DocsExample>
    </>
  )
}

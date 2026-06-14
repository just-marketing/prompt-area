import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { DxHelpersExample, dxHelpersCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'DX Helpers',
  description:
    'Live example of the Prompt Area developer-experience layer: usePromptAreaState, the trigger presets, and getChipsByTrigger working together.',
  alternates: { canonical: `${SITE_URL}/docs/examples/dx-helpers` },
}

export default function DxHelpersExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">DX Helpers</h1>
      <DocsLead>
        The convenience layer that removes boilerplate: a state hook, one-liner trigger presets, and
        helpers to read structured data back out.
      </DocsLead>

      <DocsH2 id="example">Example</DocsH2>
      <DocsExample
        id="demo"
        title="usePromptAreaState + presets + getChipsByTrigger"
        description="Manage state with usePromptAreaState(), wire triggers with mentionTrigger() / commandTrigger() / hashtagTrigger(), and inspect segments with getChipsByTrigger()."
        code={dxHelpersCode}>
        <DxHelpersExample />
      </DocsExample>

      <DocsP>
        Full signatures live in the{' '}
        <Link
          href="/docs/api/hooks"
          className="text-foreground font-medium underline underline-offset-4">
          Hooks &amp; Helpers
        </Link>{' '}
        reference.
      </DocsP>
    </>
  )
}

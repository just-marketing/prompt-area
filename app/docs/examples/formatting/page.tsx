import type { Metadata } from 'next'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import {
  MarkdownExample,
  markdownCode,
  MarkdownModeExample,
  markdownModeCode,
  RichPasteExample,
  richPasteCode,
  RotatingPlaceholdersExample,
  rotatingPlaceholdersCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Formatting',
  description:
    'Live examples of inline markdown formatting (bold, italic, URLs, lists), a markdown / plain-text toggle with useMarkdownMode, rich paste to markdown from Slack / Notion / Google Docs, and animated rotating placeholders in Prompt Area.',
  alternates: { canonical: `${SITE_URL}/docs/examples/formatting` },
}

export default function FormattingExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Formatting</h1>
      <DocsLead>Inline markdown and placeholder animation, built into the input.</DocsLead>

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="markdown"
        title="Inline markdown"
        description="Wrap text in **bold**, *italic*, or ***both***, use Cmd+B / Cmd+I, and start a line with - or * for auto-formatted lists."
        code={markdownCode}>
        <MarkdownExample />
      </DocsExample>
      <DocsExample
        id="markdown-mode"
        title="Markdown / plain-text toggle"
        description="Switch the input between its markdown and plain-text variants with useMarkdownMode. Toggling is non-destructive — the text is kept, only its rendering changes (decoration on, list bullets normalize to •). The a-large-small (ALargeSmall) icon is the conventional control."
        code={markdownModeCode}>
        <MarkdownModeExample />
      </DocsExample>
      <DocsExample
        id="rich-paste"
        title="Rich paste to markdown"
        description="With markdown on, paste from Slack, Notion, Google Docs, GitHub, or any web page and it converts to clean markdown source — nested lists, bold, italic, links, and code. Bullets normalize to •, and Slack's text/markdown (with proper nesting) is preferred over its flattened plain text."
        code={richPasteCode}>
        <RichPasteExample />
      </DocsExample>
      <DocsExample
        id="rotating-placeholders"
        title="Rotating placeholders"
        description="Pass an array of strings to placeholder to cycle through them with a smooth animation."
        code={rotatingPlaceholdersCode}>
        <RotatingPlaceholdersExample />
      </DocsExample>
    </>
  )
}

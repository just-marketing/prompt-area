import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, PropTable } from '@/components/docs/docs-primitives'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'PromptArea Props',
  description:
    'Full prop reference for the PromptArea component — value/onChange, triggers, placeholder, markdown, attachments, sizing, and the full event callback surface.',
  alternates: { canonical: `${SITE_URL}/docs/api/prompt-area` },
}

export default function PromptAreaApiPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">PromptArea Props</h1>
      <DocsLead>
        Complete reference for <code className="font-mono">PromptAreaProps</code>. The component is
        controlled — <code className="font-mono">value</code> and{' '}
        <code className="font-mono">onChange</code> are required (the{' '}
        <Link
          href="/docs/api/hooks"
          className="text-foreground font-medium underline underline-offset-4">
          state hook
        </Link>{' '}
        provides both via <code className="font-mono">bind</code>).
      </DocsLead>

      <DocsH2 id="core">Core</DocsH2>
      <PropTable
        rows={[
          { name: 'value', type: 'Segment[]', description: 'The document segments (controlled).' },
          {
            name: 'onChange',
            type: '(segments: Segment[]) => void',
            description: 'Called when the content changes.',
          },
          {
            name: 'triggers',
            type: 'TriggerConfig[]',
            description: 'Trigger configurations for @mentions, /commands, #tags, and callbacks.',
          },
          {
            name: 'placeholder',
            type: 'string | string[]',
            description: 'Placeholder text. Pass an array to animate between several.',
          },
          {
            name: 'markdown',
            type: 'boolean',
            description:
              'Render inline markdown (bold, italic, URLs, lists). Also enables rich paste: content from Slack, Notion, Google Docs, GitHub, or the web is converted to markdown source (preferring text/markdown, then text/html), and pasted list bullets normalize to •.',
          },
          {
            name: 'normalizeBullets',
            type: 'boolean',
            default: 'true',
            description:
              'When markdown is on, rewrite list markers ("- ") to the "•" glyph in the value, for typed and pasted lists alike. Set false to keep "- " in the value (e.g. when the host renders the output as real markdown).',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Whether the input is disabled.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Additional CSS class for the container.',
          },
        ]}
      />

      <DocsH2 id="sizing">Sizing &amp; focus</DocsH2>
      <PropTable
        rows={[
          {
            name: 'minHeight',
            type: 'number',
            default: '80',
            description: 'Minimum height in pixels.',
          },
          { name: 'maxHeight', type: 'number', description: 'Maximum height in pixels.' },
          {
            name: 'autoGrow',
            type: 'boolean',
            default: 'false',
            description: 'Grow to fit content on focus, shrink on blur.',
          },
          { name: 'autoFocus', type: 'boolean', description: 'Auto-focus on mount.' },
          { name: "'aria-label'", type: 'string', description: 'Accessible label for the input.' },
        ]}
      />

      <DocsH2 id="callbacks">Event callbacks</DocsH2>
      <PropTable
        rows={[
          {
            name: 'onSubmit',
            type: '(segments: Segment[]) => void',
            description: 'Enter pressed without Shift.',
          },
          { name: 'onEscape', type: '() => void', description: 'Escape pressed.' },
          {
            name: 'onChipClick',
            type: '(chip: ChipSegment) => void',
            description: 'A chip element was clicked.',
          },
          {
            name: 'onChipAdd',
            type: '(chip: ChipSegment) => void',
            description: 'A chip was added (selection, auto-resolve, paste, or insert).',
          },
          {
            name: 'onChipDelete',
            type: '(chip: ChipSegment) => void',
            description: 'A chip was deleted (backspace or forward delete).',
          },
          {
            name: 'onLinkClick',
            type: '(url: string) => void',
            description: 'A URL link was clicked.',
          },
          {
            name: 'onPaste',
            type: '(data: { segments; source }) => void',
            description: "Content pasted; source is 'internal' | 'external'.",
          },
          {
            name: 'onUndo / onRedo',
            type: '(segments: Segment[]) => void',
            description: 'After an undo or redo, with the restored segments.',
          },
        ]}
      />

      <DocsH2 id="attachments">Attachments</DocsH2>
      <PropTable
        rows={[
          {
            name: 'images',
            type: 'PromptAreaImage[]',
            description: 'Image attachments to display.',
          },
          {
            name: 'imagePosition',
            type: "'above' | 'below'",
            default: "'above'",
            description: 'Where the image strip renders.',
          },
          {
            name: 'onImagePaste',
            type: '(file: File) => void',
            description: 'An image was pasted from the clipboard.',
          },
          { name: 'files', type: 'PromptAreaFile[]', description: 'File attachments to display.' },
          {
            name: 'filePosition',
            type: "'above' | 'below'",
            default: "'above'",
            description: 'Where the file strip renders.',
          },
          {
            name: 'onImageRemove / onFileRemove',
            type: '(item) => void',
            description: 'The remove button on an attachment was clicked.',
          },
        ]}
      />

      <DocsH2 id="handle">Imperative handle</DocsH2>
      <DocsP>
        Attach a ref to access <code className="font-mono">PromptAreaHandle</code>:
      </DocsP>
      <PropTable
        rows={[
          { name: 'focus()', type: '() => void', description: 'Focus the editable area.' },
          { name: 'blur()', type: '() => void', description: 'Blur the editable area.' },
          {
            name: 'insertChip()',
            type: "(chip: Omit<ChipSegment, 'type'>) => void",
            description: 'Insert a chip at the cursor.',
          },
          { name: 'getPlainText()', type: '() => string', description: 'Current plain text.' },
          { name: 'clear()', type: '() => void', description: 'Clear all content.' },
        ]}
      />
    </>
  )
}

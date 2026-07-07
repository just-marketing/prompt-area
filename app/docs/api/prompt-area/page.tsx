import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, PropTable } from '@/components/docs/docs-primitives'
import { CodeBlock } from '@/components/code-block'

const analyticsExampleCode = `import posthog from 'posthog-js'
import { PromptArea, promptAreaEventName } from 'prompt-area'
import type { PromptAreaAnalyticsEvent } from 'prompt-area'

function handleAnalyticsEvent(event: PromptAreaAnalyticsEvent) {
  // PostHog — events arrive as prompt_area_submit, prompt_area_chip_add, …
  posthog.capture(promptAreaEventName(event), event)
  // Google Analytics 4
  window.gtag?.('event', promptAreaEventName(event), event)
}

<PromptArea value={value} onChange={setValue} onSubmit={send}
  onAnalyticsEvent={handleAnalyticsEvent} />`

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
            description: 'Render inline markdown (bold, italic, URLs, lists).',
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

      <DocsH2 id="analytics">Usage analytics</DocsH2>
      <DocsP>
        Pipe a typed, content-free event stream into your own analytics tool. Payloads carry
        metadata only — counts, lengths, trigger characters, and interaction methods — never the
        text your users type. The package makes no network calls; events exist only inside your
        callback, and a throwing handler is caught and logged without breaking the editor.
      </DocsP>
      <PropTable
        rows={[
          {
            name: 'onAnalyticsEvent',
            type: '(event: PromptAreaAnalyticsEvent) => void',
            description:
              'Called for notable usage interactions. Forward with promptAreaEventName(event) for conventional prompt_area_* names.',
          },
        ]}
      />
      <DocsP>
        The <code className="font-mono">PromptAreaAnalyticsEvent</code> union — new event types
        arrive in minor releases, so keep a default branch instead of exhaustive matching:
      </DocsP>
      <PropTable
        rows={[
          {
            name: 'input_start',
            type: '—',
            description:
              'First input of a compose session (typing or paste). Re-arms after submit, clear(), or the value resetting to empty.',
          },
          {
            name: 'submit',
            type: 'method, textLength, chipCount, chipCountByTrigger, imageCount, fileCount, msSinceInputStart',
            description:
              "A submit gesture — 'enter' or 'button'. May fire with an empty value; filter on textLength downstream.",
          },
          {
            name: 'trigger_activate',
            type: 'trigger, mode',
            description:
              'A trigger became active (dropdown opened, callback or launch fired). Once per activation.',
          },
          {
            name: 'chip_add',
            type: 'trigger, method, value?, index?, queryLength?',
            description:
              'A chip was added: select, auto_resolve, activate, paste, or programmatic. value is your suggestion ID — omitted for auto-resolved chips (user-typed text).',
          },
          {
            name: 'chip_delete',
            type: 'trigger, method, value?',
            description: "A chip was removed — 'delete', or 'revert' back to plain text.",
          },
          {
            name: 'search_empty / search_error',
            type: 'trigger, queryLength?',
            description: 'A suggestion search returned no results (once per activation) or failed.',
          },
          {
            name: 'paste',
            type: 'source, textLength',
            description: 'Content pasted; length of the pasted content, not the document.',
          },
          {
            name: 'undo / redo',
            type: '—',
            description: 'A history snapshot was applied (no-op presses are not emitted).',
          },
          {
            name: 'max_length_reached',
            type: 'maxLength',
            description: 'Typing hit the maxLength cap. Once per at-cap episode.',
          },
          {
            name: 'image_paste / image_remove / file_remove',
            type: '—',
            description: 'Attachment interactions owned by the component.',
          },
        ]}
      />
      <DocsP>
        Wiring it up — <code className="font-mono">buildSubmitEvent</code> is also exported for
        emitting <code className="font-mono">method: &apos;button&apos;</code> submits from your own
        send button:
      </DocsP>
      <CodeBlock code={analyticsExampleCode} lang="tsx" />

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

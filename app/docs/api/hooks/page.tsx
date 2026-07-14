import type { Metadata } from 'next'
import { CodeBlock } from '@/components/code-block'
import { DocsLead, DocsP, DocsH2, PropTable } from '@/components/docs/docs-primitives'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Hooks & Helpers',
  description:
    'API reference for usePromptAreaState, useMarkdownMode (markdown / plain-text toggle), the trigger presets (mentionTrigger, commandTrigger, hashtagTrigger, callbackTrigger), and segment helpers like getChipsByTrigger.',
  alternates: { canonical: `${SITE_URL}/docs/api/hooks` },
}

export default function HooksApiPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Hooks &amp; Helpers</h1>
      <DocsLead>
        The developer-experience layer: a state hook, trigger preset factories, and segment helpers
        that remove boilerplate.
      </DocsLead>

      <DocsH2 id="use-prompt-area-state">usePromptAreaState()</DocsH2>
      <DocsP>
        Manages the segment value, ref, and derived state. Call it once and spread{' '}
        <code className="font-mono">bind</code> onto the component.
      </DocsP>
      <CodeBlock
        code={`const { bind, plainText, isEmpty, hasChips, chips, clear, focus } =
  usePromptAreaState()

<PromptArea {...bind} />`}
      />
      <PropTable
        rows={[
          {
            name: 'bind',
            type: '{ ref, value, onChange }',
            description: 'Spread onto <PromptArea {...bind} />.',
          },
          {
            name: 'plainText',
            type: 'string',
            description: 'Derived plain text of the current value.',
          },
          { name: 'isEmpty', type: 'boolean', description: 'True when empty or whitespace-only.' },
          {
            name: 'hasChips',
            type: 'boolean',
            description: 'True when the value contains a chip.',
          },
          { name: 'chips', type: 'ChipSegment[]', description: 'All chip segments in the value.' },
          { name: 'clear()', type: '() => void', description: 'Clear all content.' },
          { name: 'focus() / blur()', type: '() => void', description: 'Focus or blur the input.' },
          {
            name: 'insertChip()',
            type: "(chip: Omit<ChipSegment, 'type'>) => void",
            description: 'Insert a chip imperatively.',
          },
        ]}
      />

      <DocsH2 id="use-markdown-mode">useMarkdownMode()</DocsH2>
      <DocsP>
        Owns the markdown / plain-text variant as a named mode and returns a{' '}
        <code className="font-mono">markdown</code> boolean to spread onto the component, plus{' '}
        <code className="font-mono">toggle</code>. Switching is non-destructive — the text is kept,
        only its rendering changes. The <code className="font-mono">a-large-small</code> (
        <code className="font-mono">ALargeSmall</code>) icon is the conventional toggle control.
      </DocsP>
      <CodeBlock
        code={`const { bind } = usePromptAreaState()
const { markdown, mode, toggle } = useMarkdownMode()

<PromptArea {...bind} markdown={markdown} />
<button onClick={toggle} aria-pressed={markdown}>
  <ALargeSmall className="size-4" />
</button>`}
      />
      <PropTable
        rows={[
          {
            name: 'mode',
            type: "'markdown' | 'plain'",
            description: 'The active variant.',
          },
          {
            name: 'markdown',
            type: 'boolean',
            description: 'True in markdown mode — spread as the markdown prop.',
          },
          {
            name: 'isPlainText',
            type: 'boolean',
            description: 'True in plain-text mode (inverse of markdown).',
          },
          {
            name: 'toggle()',
            type: '() => void',
            description: 'Flip between markdown and plain text.',
          },
          {
            name: 'setMode(mode)',
            type: "(mode: 'markdown' | 'plain') => void",
            description: 'Switch to an explicit mode.',
          },
        ]}
      />
      <DocsP>
        Options: <code className="font-mono">initialMode</code> (default{' '}
        <code className="font-mono">&apos;markdown&apos;</code>),{' '}
        <code className="font-mono">mode</code> for controlled use, and{' '}
        <code className="font-mono">onModeChange</code>. The pure{' '}
        <code className="font-mono">oppositeMode(mode)</code> helper is exported for custom toggles.
      </DocsP>

      <DocsH2 id="trigger-presets">Trigger presets</DocsH2>
      <DocsP>
        Each returns a <code className="font-mono">TriggerConfig</code> for the{' '}
        <code className="font-mono">triggers</code> prop. Pass{' '}
        <code className="font-mono">onSearch</code> to supply items, plus optional styling.
      </DocsP>
      <PropTable
        rows={[
          {
            name: 'mentionTrigger(opts?)',
            type: '(opts) => TriggerConfig',
            description: '@ dropdown for users, agents, or documents.',
          },
          {
            name: 'commandTrigger(opts?)',
            type: '(opts) => TriggerConfig',
            description:
              '/ dropdown anywhere in the input. Pass position: "start" to limit it to the start of a line.',
          },
          {
            name: 'hashtagTrigger(opts?)',
            type: '(opts) => TriggerConfig',
            description: '# tags that auto-resolve on space.',
          },
          {
            name: 'callbackTrigger(opts)',
            type: '(opts) => TriggerConfig',
            description: 'Fire a callback (e.g. file picker) instead of a dropdown.',
          },
        ]}
      />

      <DocsH2 id="segment-helpers">Segment helpers</DocsH2>
      <DocsP>Pure functions for building and reading segment arrays:</DocsP>
      <PropTable
        rows={[
          {
            name: 'text(value)',
            type: '(string) => TextSegment',
            description: 'Create a text segment.',
          },
          {
            name: 'chip(opts)',
            type: "(Omit<ChipSegment,'type'>) => ChipSegment",
            description: 'Create a chip segment.',
          },
          {
            name: 'getChips(segments)',
            type: '(Segment[]) => ChipSegment[]',
            description: 'All chips in a segment array.',
          },
          {
            name: 'getChipsByTrigger(segments, trigger)',
            type: '(Segment[], string) => ChipSegment[]',
            description: "Chips for one trigger, e.g. '@' or '/'.",
          },
          {
            name: 'isSegmentsEmpty(segments)',
            type: '(Segment[]) => boolean',
            description: 'True when empty or whitespace-only.',
          },
          {
            name: 'hasChips(segments)',
            type: '(Segment[]) => boolean',
            description: 'True when at least one chip is present.',
          },
        ]}
      />
      <CodeBlock
        code={`import { getChipsByTrigger } from '@/components/segment-helpers'

const mentions = getChipsByTrigger(bind.value, '@').map((c) => c.value)`}
      />
    </>
  )
}

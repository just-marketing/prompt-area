import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/code-block'
import { DocsLead, DocsP, DocsH2, Callout } from '@/components/docs/docs-primitives'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Installation',
  description:
    'Install Prompt Area from the shadcn registry with a single command. Zero extra dependencies — just React and your existing Tailwind/shadcn setup.',
  alternates: { canonical: `${SITE_URL}/docs/installation` },
}

// HowTo structured data for the install flow — eligible for rich results and
// commonly surfaced verbatim in AI answers and voice assistants.
function howToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Install Prompt Area in a React project',
    description:
      'Add the Prompt Area React component to a Tailwind + shadcn/ui project from the shadcn registry with a single command. Zero extra dependencies.',
    totalTime: 'PT2M',
    tool: [
      { '@type': 'HowToTool', name: 'shadcn CLI' },
      { '@type': 'HowToTool', name: 'npx' },
    ],
    supply: [{ '@type': 'HowToSupply', name: 'A React project using Tailwind CSS and shadcn/ui' }],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Prerequisites',
        text: 'Use a React project with Tailwind CSS and shadcn/ui. If shadcn is not set up yet, run npx shadcn@latest init first.',
        url: `${SITE_URL}/docs/installation#prerequisites`,
      },
      {
        '@type': 'HowToStep',
        name: 'Install the component',
        text: 'Run npx shadcn@latest add https://prompt-area.com/r/prompt-area.json to copy the PromptArea component, its types, the usePromptAreaState hook, trigger presets, and segment helpers into your project.',
        url: `${SITE_URL}/docs/installation#install`,
      },
      {
        '@type': 'HowToStep',
        name: 'Add companion components',
        text: 'Optionally install Action Bar, Status Bar, Compact Prompt Area, or Chat Prompt Layout from the same registry to compose a full chat input.',
        url: `${SITE_URL}/docs/installation#companion-components`,
      },
    ],
  }
}

export default function InstallationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema()) }}
      />
      <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
      <DocsLead>
        Prompt Area installs through the shadcn registry. One command copies the component, its
        types, helpers, and the segment engine into your project.
      </DocsLead>

      <DocsH2 id="prerequisites">Prerequisites</DocsH2>
      <DocsP>
        A React project using Tailwind CSS and shadcn/ui. If you do not have shadcn set up yet, run{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          npx shadcn@latest init
        </code>{' '}
        first.
      </DocsP>

      <DocsH2 id="install">Install the component</DocsH2>
      <CodeBlock
        lang="bash"
        code="npx shadcn@latest add https://prompt-area.com/r/prompt-area.json"
      />
      <DocsP>
        This adds the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">PromptArea</code> component
        along with its types, the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">usePromptAreaState</code>{' '}
        hook, trigger presets, and segment helpers.
      </DocsP>

      <DocsH2 id="companion-components">Companion components</DocsH2>
      <DocsP>Each companion is independently installable from the same registry:</DocsP>
      <CodeBlock
        lang="bash"
        code={`# Action Bar — toolbar with attach, mic, send
npx shadcn@latest add https://prompt-area.com/r/action-bar.json

# Status Bar — contextual info bar (model, branch, ...)
npx shadcn@latest add https://prompt-area.com/r/status-bar.json

# Compact Prompt Area — pill-shaped expanding input
npx shadcn@latest add https://prompt-area.com/r/compact-prompt-area.json

# Chat Prompt Layout — full-height chat layout
npx shadcn@latest add https://prompt-area.com/r/chat-prompt-layout.json`}
      />

      <DocsH2 id="install-with-ai">Install with an AI agent</DocsH2>
      <DocsP>
        Prompt Area ships machine-readable docs at{' '}
        <a
          href="/llms-full.txt"
          className="text-foreground font-medium underline underline-offset-4">
          /llms-full.txt
        </a>
        . Give your coding agent (Claude Code, Cursor, Codex) this prompt:
      </DocsP>
      <CodeBlock
        lang="bash"
        code={`Fetch https://prompt-area.com/llms-full.txt and read the full
documentation. Install the prompt-area component by running:
npx shadcn@latest add https://prompt-area.com/r/prompt-area.json
then add the required CSS classes to globals.css and help me
build a prompt input.`}
      />

      <Callout>
        Next:{' '}
        <Link
          href="/docs/quick-start"
          className="text-foreground font-medium underline underline-offset-4">
          Quick Start
        </Link>{' '}
        — render your first input with state, mentions, and commands.
      </Callout>
    </>
  )
}

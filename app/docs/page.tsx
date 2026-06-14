import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, DocsUl, Callout } from '@/components/docs/docs-primitives'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Introduction',
  description:
    'Prompt Area is a production-grade React textarea for AI chat interfaces — @mentions, /commands, #tags, markdown, and file attachments in one zero-dependency shadcn registry component.',
  alternates: { canonical: `${SITE_URL}/docs` },
}

export default function DocsIntroPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
      <DocsLead>
        Prompt Area is a production-grade React textarea built for AI chat interfaces. It brings
        @mentions, /commands, #tags, inline markdown, and file attachments together in a single
        contentEditable component — with zero extra dependencies.
      </DocsLead>

      <DocsH2 id="why">Why Prompt Area</DocsH2>
      <DocsP>
        Most textarea components handle plain text. The moment you need structured input — mentions,
        slash commands, tags — you end up stitching together several libraries or building on a
        heavy editor framework like ProseMirror or Slate. Prompt Area gives you all of it in one
        package, designed specifically for prompt and chat composers rather than document editing.
      </DocsP>
      <DocsUl
        items={[
          'Trigger-based chips: @mentions, /commands, #tags, and custom callbacks',
          'Inline markdown, file & image attachments, and undo/redo',
          'Structured segment output — read typed chips, not a parsed string',
          'Companion components: Action Bar, Status Bar, Compact, and Chat Prompt Layout',
          'Zero extra dependencies — distributed through the shadcn registry',
        ]}
      />

      <DocsH2 id="how-its-distributed">How it’s distributed</DocsH2>
      <DocsP>
        Prompt Area is a shadcn registry component, not an npm package. You install the source
        directly into your project, so you own and can customize every line. It needs only React and
        your existing Tailwind/shadcn setup.
      </DocsP>
      <Callout>
        New here? Start with{' '}
        <Link
          href="/docs/installation"
          className="text-foreground font-medium underline underline-offset-4">
          Installation
        </Link>
        , then build your first input in the{' '}
        <Link
          href="/docs/quick-start"
          className="text-foreground font-medium underline underline-offset-4">
          Quick Start
        </Link>
        .
      </Callout>

      <DocsH2 id="when-to-use-something-else">When to use something else</DocsH2>
      <DocsP>
        Prompt Area is purpose-built for chat and prompt inputs. If you need full document editing —
        blocks, tables, columns, or real-time collaboration — a framework like Tiptap, Lexical, or
        Plate.js is the better fit. See the{' '}
        <Link href="/compare" className="text-foreground font-medium underline underline-offset-4">
          comparison pages
        </Link>{' '}
        for an honest breakdown.
      </DocsP>
    </>
  )
}

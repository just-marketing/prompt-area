import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Prompt Area is an open-source React textarea component built by Juma. Learn about the project and the team behind it.',
  alternates: { canonical: 'https://prompt-area.com/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground">The project, the team, and how to get involved.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">The Project</h2>
        <p className="text-muted-foreground">
          Prompt Area is an open-source React component for building rich text inputs in AI and chat
          interfaces. It supports @mentions, /commands, #tags, inline markdown, file attachments,
          undo/redo, and more &mdash; all in a single contentEditable textarea distributed through
          the{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          with zero extra dependencies.
        </p>
        <p className="text-muted-foreground">
          The goal is to give developers a production-ready prompt input they can drop into any
          Next.js or React project without pulling in a full rich-text framework.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Built by Juma</h2>
        <p className="text-muted-foreground">
          Prompt Area is built and maintained by{' '}
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            Juma
          </a>{' '}
          (formerly Team-GPT), an AI workspace for marketing teams. The component grew out of the
          team&apos;s own need for a flexible, reliable prompt input while building collaborative AI
          tools.
        </p>
        <p className="text-muted-foreground">
          If you&apos;re curious about how marketing teams use AI day-to-day, check out{' '}
          <a
            href="https://juma.ai/flows"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            Juma Flows
          </a>{' '}
          &mdash; a growing collection of end-to-end AI chat workflows for things like campaign
          analysis, brand voice guides, and channel ROI comparison.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Open Source</h2>
        <p className="text-muted-foreground">
          Prompt Area is released under the MIT license. Contributions, bug reports, and feature
          requests are welcome on{' '}
          <a
            href="https://github.com/team-gpt/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            GitHub
          </a>
          . See the{' '}
          <a
            href="https://github.com/team-gpt/prompt-area/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            contributing guide
          </a>{' '}
          to get started.
        </p>
      </div>
    </div>
  )
}

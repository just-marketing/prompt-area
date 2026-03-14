import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Press',
  description: 'Press resources and media information for Prompt Area and Juma.',
  alternates: { canonical: 'https://prompt-area.com/press' },
}

export default function PressPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Press</h1>
        <p className="text-muted-foreground">
          Media resources and information about Prompt Area and Juma.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">About Prompt Area</h2>
        <p className="text-muted-foreground">
          Prompt Area is an open-source React component that provides a production-grade rich text
          input for AI and chat interfaces. It supports @mentions, /commands, #tags, inline
          markdown, file attachments, and more. Distributed as a{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          component with zero extra dependencies, it can be installed in any Next.js or React
          project with a single command.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">About Juma</h2>
        <p className="text-muted-foreground">
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            Juma
          </a>{' '}
          (formerly Team-GPT) is an AI workspace for marketing teams. The team builds collaborative
          AI tools that help marketers work with models like GPT, Claude, and Gemini from a single
          interface. Prompt Area was created as part of that effort and open-sourced for the
          community.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Media Contact</h2>
        <p className="text-muted-foreground">
          For press inquiries, please reach out through{' '}
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            juma.ai
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Resources</h2>
        <ul className="text-muted-foreground list-inside list-disc space-y-1">
          <li>
            <a
              href="https://github.com/team-gpt/prompt-area"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4">
              GitHub Repository
            </a>
          </li>
          <li>
            <Link href="/" className="font-medium underline underline-offset-4">
              Interactive Demo
            </Link>
          </li>
          <li>
            <a
              href="https://juma.ai/flows"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4">
              Juma Flows
            </a>{' '}
            &mdash; end-to-end AI chat workflows for marketing
          </li>
        </ul>
      </div>
    </div>
  )
}

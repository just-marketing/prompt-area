import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'Partnership opportunities with Prompt Area and Juma. Integrate the rich textarea component into your product.',
  alternates: { canonical: 'https://prompt-area.com/partners' },
}

export default function PartnersPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
        <p className="text-muted-foreground">
          Interested in integrating Prompt Area or partnering with Juma?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Integration Partners</h2>
        <p className="text-muted-foreground">
          If you&apos;re building AI-powered chat products and need a production-grade prompt input,
          Prompt Area is available as a{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          component. Install it with a single command and customize it to fit your product.
        </p>
        <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm">
          npx shadcn@latest add https://prompt-area.com/r/prompt-area.json
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Technology Partners</h2>
        <p className="text-muted-foreground">
          We&apos;re open to collaborations with component libraries, design systems, and AI
          frameworks. If Prompt Area fits into your ecosystem, let&apos;s talk.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Get in Touch</h2>
        <p className="text-muted-foreground">
          For partnership inquiries, reach out through{' '}
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            juma.ai
          </a>{' '}
          or open a discussion on{' '}
          <a
            href="https://github.com/team-gpt/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  )
}

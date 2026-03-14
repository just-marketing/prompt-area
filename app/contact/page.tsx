import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the Prompt Area team. Report bugs, request features, or reach out to Juma for business inquiries.',
  alternates: { canonical: 'https://prompt-area.com/contact' },
}

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="text-muted-foreground">
          Have a question, bug report, or feature request? Here&apos;s how to reach us.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Bug Reports &amp; Feature Requests</h2>
        <p className="text-muted-foreground">
          The best way to report a bug or request a feature is through{' '}
          <a
            href="https://github.com/team-gpt/prompt-area/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            GitHub Issues
          </a>
          . Please include a clear description and steps to reproduce if you&apos;re reporting a
          bug.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Business Inquiries</h2>
        <p className="text-muted-foreground">
          For partnerships, enterprise support, or other business inquiries, reach out through{' '}
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            Juma
          </a>
          .
        </p>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowUpRight,
  Boxes,
  FileText,
  Hash,
  Moon,
  Package,
  PlayCircle,
  Layers,
} from 'lucide-react'
import { InstallMethodTabs } from '@/components/install-method-tabs'
import { ProductHuntBadge } from '@/components/product-hunt-badge'
import { GithubIcon } from '@/components/github-icon'
import { PRODUCT_HUNT, hasOfficialBadge, productHuntUrl } from '@/lib/product-hunt'

const SITE_URL = 'https://prompt-area.com'
const REPO_URL = 'https://github.com/just-marketing/prompt-area'

export const metadata: Metadata = {
  title: 'Prompt Area: Live on Product Hunt',
  description:
    'Welcome, Product Hunt! Prompt Area is the open-source React textarea for AI chat UIs: @mentions, /commands, #tags, markdown, and file attachments in one component. Install from npm or shadcn.',
  alternates: { canonical: `${SITE_URL}/launch` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/launch`,
    title: 'Prompt Area: Live on Product Hunt',
    description:
      'The open-source React textarea built for AI chat UIs. @mentions, /commands, #tags, markdown & files in one component. Install from npm or shadcn.',
  },
}

const FEATURES = [
  {
    icon: Layers,
    title: 'One component, not five',
    text: 'Stop stitching a mention library, command palette, tag input, markdown editor, and upload widget. It’s all one typed API.',
  },
  {
    icon: Package,
    title: 'Install two ways',
    text: 'npm install prompt-area (ships its own CSS, no Tailwind needed) or copy the source in via the shadcn registry. Your call.',
  },
  {
    icon: Hash,
    title: 'Triggers that map to your model',
    text: '@mentions, /commands, #tags and inline markdown resolve into typed chips you can send straight to your LLM.',
  },
  {
    icon: FileText,
    title: 'Files & images built in',
    text: 'Paste screenshots or attach PDFs and CSVs right in the composer: thumbnails, loading states, remove buttons, no extra widget.',
  },
  {
    icon: Moon,
    title: 'Production-grade by default',
    text: 'Undo/redo, IME (CJK) composition, copy/paste chip preservation, ARIA accessibility, and dark mode, out of the box.',
  },
  {
    icon: Boxes,
    title: 'Composable companions',
    text: 'Action Bar, Status Bar, Compact and Chat Prompt Layout let you recreate the inputs in Claude Code, Codex, ChatGPT or Slack.',
  },
]

export default function LaunchPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16 sm:py-20">
      {/* Hero */}
      <header className="flex flex-col items-center gap-6 text-center">
        <span className="border-ph/30 bg-ph/10 text-ph inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
          <span aria-hidden>👋</span>
          Hello, Product Hunt
        </span>

        {hasOfficialBadge ? (
          <ProductHuntBadge />
        ) : (
          <p className="text-muted-foreground text-sm">
            We launch on Product Hunt on{' '}
            <span className="text-foreground font-medium">{PRODUCT_HUNT.launchDate}</span>.
          </p>
        )}

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          The open-source textarea built for AI chat UIs
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-balance">
          Every AI chat box needs @mentions, /commands, #tags, markdown, and file uploads. The usual
          way means stitching together five libraries. Prompt Area is all of it in one React
          component. Install from npm or copy it in via shadcn, with no heavy dependencies and no
          required Tailwind setup.
        </p>

        <div className="w-full max-w-xl">
          <InstallMethodTabs />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href={productHuntUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ph inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            Support us on Product Hunt
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            href="/docs/try-it-live"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90">
            <PlayCircle className="size-4" />
            Try it live
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
            <GithubIcon className="size-4" />
            Star on GitHub
          </a>
        </div>
      </header>

      {/* What it is */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card flex flex-col gap-2 rounded-lg border p-5">
            <f.icon className="text-foreground size-5" />
            <h2 className="text-base font-semibold">{f.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Maker note */}
      <section className="flex flex-col gap-4 rounded-xl border p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Why we built it</h2>
        <p className="text-muted-foreground leading-relaxed">
          Building AI chat interfaces, we kept rebuilding the same input box. Every prompt box needs
          mentions, commands, tags, markdown, and attachments, but the only way to get them was to
          bolt together five dependencies. Most “rich text editors” are document editors crammed
          into a chat box; we wanted the opposite. So we built Prompt Area and open-sourced it under
          MIT.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Built by the team at{' '}
          <a
            href="https://juma.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4">
            Juma
          </a>{' '}
          (formerly Team-GPT). We’d genuinely love your feedback on Product Hunt: what’s missing,
          and what would make it a drop-in for your stack.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {hasOfficialBadge && <ProductHuntBadge />}
          <Link
            href={productHuntUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ph inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
            Join the conversation on Product Hunt
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Keep exploring */}
      <section className="flex flex-col gap-3 border-t pt-8">
        <h2 className="text-sm font-semibold">Keep exploring</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
            <ArrowUpRight className="size-3.5" />
            See the live demo on the homepage
          </Link>
          <Link
            href="/docs"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
            <ArrowUpRight className="size-3.5" />
            Read the docs &amp; quick start
          </Link>
        </div>
      </section>
    </div>
  )
}

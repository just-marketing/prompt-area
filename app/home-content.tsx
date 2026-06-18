'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { InstallMethodTabs } from '@/components/install-method-tabs'
import { FeaturesGrid } from './sections/features-grid'
import { USERS, COMMANDS, TAGS } from './sections/mock-data'
import { type Segment, type TriggerConfig, type PromptAreaFile } from 'prompt-area'

const CodexInputExample = dynamic(() =>
  import('./examples/codex-input').then((m) => ({ default: m.CodexInputExample })),
)

const ClaudeCodeInputExample = dynamic(() =>
  import('./examples/claude-code-input').then((m) => ({ default: m.ClaudeCodeInputExample })),
)

// Seed the hero composer with a realistic prompt so it shows off mentions,
// commands, tags, markdown, and a file attachment — fully interactive.
const HERO_SEGMENTS: Segment[] = [
  { type: 'chip', trigger: '/', value: 'summarize', displayText: 'summarize' },
  { type: 'text', text: ' the brief from ' },
  { type: 'chip', trigger: '@', value: 'strategist', displayText: 'Strategist' },
  { type: 'text', text: ' and ' },
  { type: 'chip', trigger: '@', value: 'copywriter', displayText: 'Copywriter' },
  { type: 'text', text: ', tag anything ' },
  { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
  { type: 'text', text: ', and return **key messages** with *action items*.' },
]

const HERO_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accessibilityLabel: 'mention',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    accessibilityLabel: 'command',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    accessibilityLabel: 'tag',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const HERO_FILES: PromptAreaFile[] = [
  {
    id: 'hero-file-1',
    name: 'Q4-2025-campaign-brief.pdf',
    size: 3_420_000,
    type: 'application/pdf',
  },
]

const COMPONENTS = [
  { href: '/docs/components/prompt-area', title: 'Prompt Area', desc: 'The core rich-text input.' },
  {
    href: '/docs/components/action-bar',
    title: 'Action Bar',
    desc: 'Toolbar with attach, mic, send.',
  },
  { href: '/docs/components/status-bar', title: 'Status Bar', desc: 'Contextual info bar.' },
  {
    href: '/docs/components/compact-prompt-area',
    title: 'Compact Prompt Area',
    desc: 'Pill-shaped expanding input.',
  },
  {
    href: '/docs/components/chat-prompt-layout',
    title: 'Chat Prompt Layout',
    desc: 'Full-height chat layout.',
  },
  { href: '/docs/inspector', title: 'Inspector', desc: 'Live event & API playground.' },
]

export default function HomeContent() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pt-16 pb-12 text-center sm:pt-24">
        <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
          npm + shadcn · zero dependencies
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
          The shadcn chat input for React
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-balance">
          A production-grade textarea for AI chat interfaces — @mentions, /commands, #tags, inline
          markdown, and file attachments in one contentEditable component.
        </p>
        <div className="w-full max-w-xl">
          <InstallMethodTabs />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href="/docs"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90">
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="https://github.com/just-marketing/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
            Star on GitHub
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>

      {/* Live demo — Codex-style composer seeded with real content */}
      <section id="demo" className="mx-auto w-full max-w-2xl scroll-mt-20 px-4 pb-16">
        <CodexInputExample
          initialSegments={HERO_SEGMENTS}
          triggers={HERO_TRIGGERS}
          initialFiles={HERO_FILES}
          markdown
          minHeight={76}
        />
      </section>

      {/* Features */}
      <section className="bg-muted/20 border-y">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Everything in one input</h2>
            <p className="text-muted-foreground">
              One component replaces five libraries — no ProseMirror, Slate, or Lexical.
            </p>
          </div>
          <FeaturesGrid />
        </div>
      </section>

      {/* Components */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Components &amp; layouts</h2>
          <p className="text-muted-foreground">
            Compose the input with companions to build full chat experiences.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMPONENTS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group hover:bg-accent/40 flex items-start justify-between gap-3 rounded-lg border p-5 transition-colors">
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{c.title}</span>
                <span className="text-muted-foreground text-sm leading-relaxed">{c.desc}</span>
              </span>
              <ArrowRight className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {/* Built-in styles */}
      <section className="bg-muted/20 border-y">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Built-in agent styles</h2>
            <p className="text-muted-foreground">
              Real, copy-paste compositions modeled on the agent UIs you already know.
            </p>
          </div>
          <div className="mx-auto w-full max-w-2xl">
            <ClaudeCodeInputExample />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/styles#chatgpt"
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
              ChatGPT style
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/styles#claude"
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
              Claude style
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/styles#claude-code"
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
              Claude Code style
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/styles#codex"
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
              Codex style
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/styles#perplexity"
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
              Perplexity style
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison teaser */}
      <section className="border-y">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">A modern alternative</h2>
          <p className="text-muted-foreground max-w-2xl">
            Lighter than Tiptap, Lexical, or Plate for chat inputs — and a drop-in upgrade from
            react-mentions. See the honest, side-by-side breakdowns.
          </p>
          <Link
            href="/compare"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
            Compare alternatives
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Drop it into your app</h2>
        <p className="text-muted-foreground max-w-xl">
          Install from npm, or copy the source via the shadcn registry. Zero extra dependencies.
        </p>
        <div className="w-full max-w-xl">
          <InstallMethodTabs />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90">
            Read the docs
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/quick-start"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
            Quick start
          </Link>
        </div>
      </section>
    </div>
  )
}

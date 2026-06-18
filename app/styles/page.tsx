import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ExampleShowcase } from '@/components/example-showcase'
import { ClaudeInputExample, claudeInputCode } from '@/app/examples/claude-input'
import { ClaudeCodeInputExample, claudeCodeInputCode } from '@/app/examples/claude-code-input'
import { CodexInputExample, codexInputCode } from '@/app/examples/codex-input'
import { ChatGptInputExample, chatgptInputCode } from '@/app/examples/chatgpt-input'
import { PerplexityInputExample, perplexityInputCode } from '@/app/examples/perplexity-input'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Styles — ChatGPT, Claude, Claude Code, Codex & Perplexity Agent Inputs',
  description:
    'Ready-made agent-input styles built with Prompt Area: a ChatGPT-style composer, a Claude-style composer, a Claude Code–style composer, an OpenAI Codex–style composer, and a Perplexity-style composer, assembled from Prompt Area, Action Bar, and Status Bar.',
  alternates: { canonical: `${SITE_URL}/styles` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/styles`,
    title: 'Styles — ChatGPT, Claude, Claude Code, Codex & Perplexity Agent Inputs',
    description:
      'Ready-made agent-input styles built with Prompt Area — ChatGPT, Claude, Claude Code, OpenAI Codex, and Perplexity composers you can drop into your app.',
  },
}

export default function StylesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Styles</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Ready-made agent-input styles, assembled from Prompt Area and its companions. Each is a
          real, copy-paste composition modeled on the agent UIs you already know — toggle Preview
          and Code on any example.
        </p>
      </header>

      {/* ChatGPT */}
      <section id="chatgpt" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">ChatGPT</h2>
          <p className="text-muted-foreground leading-relaxed">
            A ChatGPT-style composer: a single-line rounded pill with the controls inline — a model
            selector that opens a menu above, a dictation button, and the blue voice affordance that
            swaps to a send arrow once there&apos;s text.
          </p>
        </div>
        <ExampleShowcase code={chatgptInputCode}>
          <ChatGptInputExample />
        </ExampleShowcase>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Composed from{' '}
          <Link
            href="/docs/components/prompt-area"
            className="text-foreground font-medium underline underline-offset-4">
            Prompt Area
          </Link>{' '}
          alone — the controls live inline around the input.
        </p>
      </section>

      {/* Claude */}
      <section id="claude" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Claude</h2>
          <p className="text-muted-foreground leading-relaxed">
            A Claude-style composer: a rounded card with the input stacked over an inline control
            row — a model selector whose menu lists each model over a one-line description with a
            blue check on the active one, a dictation button, and a voice affordance that swaps to a
            coral send button once there&apos;s text. A dismissible notice peeks out above the card,
            and suggested-prompt chips sit below.
          </p>
        </div>
        <ExampleShowcase code={claudeInputCode}>
          <ClaudeInputExample />
        </ExampleShowcase>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Composed from{' '}
          <Link
            href="/docs/components/prompt-area"
            className="text-foreground font-medium underline underline-offset-4">
            Prompt Area
          </Link>{' '}
          alone — the controls live inline around the input.
        </p>
      </section>

      {/* Claude Code */}
      <section id="claude-code" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Claude Code</h2>
          <p className="text-muted-foreground leading-relaxed">
            A Claude Code–style composer: environment and repository context above the input, an
            inline return-to-send arrow, and a control bar with a permission-mode menu, dictation,
            model and reasoning-effort selectors, and a plan-usage meter.
          </p>
        </div>
        <ExampleShowcase code={claudeCodeInputCode}>
          <ClaudeCodeInputExample />
        </ExampleShowcase>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Composed from{' '}
          <Link
            href="/docs/components/prompt-area"
            className="text-foreground font-medium underline underline-offset-4">
            Prompt Area
          </Link>
          ,{' '}
          <Link
            href="/docs/components/action-bar"
            className="text-foreground font-medium underline underline-offset-4">
            Action Bar
          </Link>
          , and{' '}
          <Link
            href="/docs/components/status-bar"
            className="text-foreground font-medium underline underline-offset-4">
            Status Bar
          </Link>
          .
        </p>
      </section>

      {/* Codex */}
      <section id="codex" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Codex</h2>
          <p className="text-muted-foreground leading-relaxed">
            An OpenAI Codex–style cloud-agent composer: a rounded card with a permissions menu and
            reasoning-effort model selector, layered over a peeking repository/environment/branch
            context tray.
          </p>
        </div>
        <ExampleShowcase code={codexInputCode}>
          <CodexInputExample />
        </ExampleShowcase>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Composed from{' '}
          <Link
            href="/docs/components/prompt-area"
            className="text-foreground font-medium underline underline-offset-4">
            Prompt Area
          </Link>{' '}
          and{' '}
          <Link
            href="/docs/components/action-bar"
            className="text-foreground font-medium underline underline-offset-4">
            Action Bar
          </Link>
          .
        </p>
      </section>

      {/* Perplexity */}
      <section id="perplexity" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Perplexity</h2>
          <p className="text-muted-foreground leading-relaxed">
            A Perplexity-style composer: a rounded card with a turquoise focus glow, the input
            stacked over a control row with a segmented Search/Computer mode toggle, a gated model
            picker whose list and label switch with the mode, and an add menu with a Connectors
            fly-out. A fade-masked rail of starter cards with a shuffle sits below.
          </p>
        </div>
        <ExampleShowcase code={perplexityInputCode}>
          <PerplexityInputExample />
        </ExampleShowcase>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Composed from{' '}
          <Link
            href="/docs/components/prompt-area"
            className="text-foreground font-medium underline underline-offset-4">
            Prompt Area
          </Link>{' '}
          alone — the controls live inline around the input.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 flex flex-col gap-3 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Build your own</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Every style is just Prompt Area plus companions. Start from the docs to compose your own
          agent input.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            Read the docs
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/docs/components/prompt-area"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Components
          </Link>
        </div>
      </section>
    </div>
  )
}

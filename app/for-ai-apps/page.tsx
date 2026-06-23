import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Bot, Boxes, Code2, Plug, ShieldCheck, Zap } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { InstallMethodTabs } from '@/components/install-method-tabs'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'React Input for AI Chatbots & LLM Apps — Prompt Area',
  description:
    'Prompt Area is a React chat input built for AI and LLM apps: @mentions, /commands, file attachments, and structured output that drops into any OpenAI, Anthropic, or Vercel AI SDK chatbot.',
  keywords: [
    'react input for AI chatbot',
    'chat textarea for LLM apps',
    'LLM chat UI component',
    'OpenAI chat UI component',
    'AI UI component react',
    'vercel ai sdk chat input',
  ],
  alternates: { canonical: `${SITE_URL}/for-ai-apps` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/for-ai-apps`,
    title: 'React Input for AI Chatbots & LLM Apps — Prompt Area',
    description:
      'A React chat input built for AI and LLM apps: mentions, commands, attachments, and structured output for any model provider.',
  },
}

const FEATURES = [
  {
    icon: Bot,
    title: 'Built for AI chat, not documents',
    text: 'Mentions, slash commands, and tags map cleanly to context, actions, and metadata — the primitives every AI composer needs.',
  },
  {
    icon: Code2,
    title: 'Structured output for your model',
    text: 'Read typed chips with getChipsByTrigger() and plain text together. Send exactly what your prompt needs without parsing strings.',
  },
  {
    icon: Plug,
    title: 'Provider-agnostic',
    text: 'Works with OpenAI, Anthropic, the Vercel AI SDK, LangChain, or your own backend. Prompt Area owns the input, not your runtime.',
  },
  {
    icon: Zap,
    title: 'Zero dependencies',
    text: 'No ProseMirror, Slate, or Lexical. Just React and the shadcn registry — a small bundle and a fast integration.',
  },
  {
    icon: Boxes,
    title: 'Composable chat UI',
    text: 'Pair the input with Action Bar, Status Bar, Compact, and Chat Prompt Layout companions to assemble a full composer.',
  },
  {
    icon: ShieldCheck,
    title: 'Accessible & i18n-ready',
    text: 'ARIA roles, keyboard navigation, and IME/CJK composition handling so your chat works for everyone, in any language.',
  },
]

const FAQ = [
  {
    question: 'What is the best React input component for an AI chatbot?',
    answer:
      'Prompt Area is a React chat input built specifically for AI and LLM apps. It provides @mentions, /commands, #tags, inline markdown, and file attachments in a single zero-dependency component, and returns structured data you can send straight to your model.',
  },
  {
    question: 'Does Prompt Area work with the Vercel AI SDK?',
    answer:
      'Yes. Prompt Area is the input layer only, so it drops into any chat stack. Read the plain text (and structured chips) from the composer and pass them to the Vercel AI SDK, OpenAI, Anthropic, or any provider.',
  },
  {
    question: 'Can I use Prompt Area as a ChatGPT- or Claude-style input?',
    answer:
      'Yes. The component ships example compositions for Claude Code–style and Codex-style inputs, including model selectors and context trays, that you can adapt to your own LLM app.',
  },
  {
    question: 'How do I send mentions and commands to my LLM?',
    answer:
      'Call getChipsByTrigger(value, "@") for mentions and getChipsByTrigger(value, "/") for commands to get typed values, then include them in your prompt or tool call alongside the message text.',
  },
]

function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export default function ForAiAppsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          For AI & LLM apps
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The React chat input built for AI apps
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Prompt Area is a zero-dependency React composer for LLM chatbots and AI products. It
          brings @mentions, /commands, #tags, and file attachments to your input, and hands your
          model clean structured data — no editor framework, no lock-in.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            View the demo
          </Link>
          <a
            href="https://github.com/just-marketing/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Star on GitHub
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-2 rounded-lg border p-5">
            <f.icon className="text-foreground size-5" />
            <h2 className="text-base font-semibold">{f.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Drop it into your LLM stack</h2>
        <p className="text-muted-foreground leading-relaxed">
          Install the component, read the message and any structured chips, and send them to your
          provider. The input does not care which model or framework you use.
        </p>
        <CodeBlock
          code={`const { bind, plainText } = usePromptAreaState()
const mentions = getChipsByTrigger(bind.value, '@').map((c) => c.value)
const command = getChipsByTrigger(bind.value, '/')[0]?.value

await streamChat({
  messages: [{ role: 'user', content: plainText }],
  context: mentions,
  command,
})`}
        />
        <div className="max-w-xl">
          <InstallMethodTabs location="for_ai_apps" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{f.question}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t pt-8">
        <h2 className="text-sm font-semibold">Keep exploring</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/blog/build-ai-chat-textarea-react-mentions"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
            <ArrowUpRight className="size-3.5" />
            How to build an AI chat textarea in React
          </Link>
          <Link
            href="/compare"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
            <ArrowUpRight className="size-3.5" />
            Compare Prompt Area vs other libraries
          </Link>
        </div>
      </section>
    </div>
  )
}

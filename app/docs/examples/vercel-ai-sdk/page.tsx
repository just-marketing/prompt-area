import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, Callout } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { CodeBlock } from '@/components/code-block'
import { VercelAiSdkExample, vercelAiSdkCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Vercel AI SDK',
  description:
    'Integrate Prompt Area with the Vercel AI SDK: wire onSubmit to useChat’s sendMessage, stream responses, and drive a status-aware send/stop button — chips flatten to plain text for your model.',
  alternates: { canonical: `${SITE_URL}/docs/examples/vercel-ai-sdk` },
}

const INSTALL_CMD = 'npm install ai @ai-sdk/react @ai-sdk/anthropic'

export default function VercelAiSdkExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Vercel AI SDK</h1>
      <DocsLead>
        Drop Prompt Area into a{' '}
        <a
          href="https://ai-sdk.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-4">
          Vercel AI SDK
        </a>{' '}
        chatbot. PromptArea owns the input; <code>useChat</code> owns the stream. They meet at one
        line: <code>sendMessage(&#123; text: segmentsToPlainText(segments) &#125;)</code>.
      </DocsLead>

      <DocsH2 id="install">Install</DocsH2>
      <DocsP>
        Add the AI SDK alongside Prompt Area. This example streams from Claude, so it uses the
        Anthropic provider — swap in any other provider package if you prefer.
      </DocsP>
      <CodeBlock code={INSTALL_CMD} lang="bash" />

      <DocsH2 id="example">Example</DocsH2>
      <DocsExample
        id="demo"
        title="Streaming chat with useChat"
        description="Type a message and submit. The demo simulates the AI SDK stream so it runs without a backend; the Code tab shows the real useChat + Claude wiring. The send button becomes a stop button while a response streams."
        code={vercelAiSdkCode}>
        <VercelAiSdkExample />
      </DocsExample>

      <Callout>
        The live preview swaps the real <code>useChat()</code> for a small simulated hook so it can
        run in the browser with no API key. Everything else — the <code>onSubmit</code> wiring,{' '}
        <code>segmentsToPlainText()</code>, the status-aware send/stop button, and rendering{' '}
        <code>message.parts</code> — is identical to the production code in the Code tab.
      </Callout>

      <DocsH2 id="how-it-works">How it works</DocsH2>
      <DocsP>
        Prompt Area is provider-agnostic — it produces structured segments, and you decide what to
        send. To feed the AI SDK, flatten the segments to a string with{' '}
        <code>segmentsToPlainText()</code> and pass it to <code>sendMessage</code>. Mentions,
        commands, and tags resolve to their display text, so a model-friendly prompt falls out for
        free. Need the structured data too? Read chips with <code>getChipsByTrigger()</code> and
        attach them via the request <code>body</code>.
      </DocsP>
      <DocsP>
        The AI SDK&apos;s <code>status</code> (<code>ready</code>, <code>submitted</code>,{' '}
        <code>streaming</code>, <code>error</code>) drives the action bar: while a response streams,
        the send button becomes a stop button wired to <code>stop()</code>. See the{' '}
        <Link
          href="/docs/components/action-bar"
          className="text-foreground font-medium underline underline-offset-4">
          Action Bar
        </Link>{' '}
        and{' '}
        <Link
          href="/docs/api/hooks"
          className="text-foreground font-medium underline underline-offset-4">
          Hooks &amp; Helpers
        </Link>{' '}
        references for the pieces used here.
      </DocsP>
    </>
  )
}

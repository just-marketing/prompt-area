import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, DocsUl, Callout } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { CodeBlock } from '@/components/code-block'
import { VercelAiSdkExample, vercelAiSdkCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Vercel AI SDK',
  description:
    'Integrate Prompt Area with the Vercel AI SDK: wire onSubmit to useChat’s sendMessage, stream responses, drive a status-aware send/stop button, and pass typed chips as request metadata — chips flatten to plain text for your model.',
  alternates: { canonical: `${SITE_URL}/docs/examples/vercel-ai-sdk` },
}

const INSTALL_CMD = 'npm install ai @ai-sdk/react @ai-sdk/anthropic zod'

const STRUCTURED_CONTEXT_CODE = `import { getChipsByTrigger, segmentsToPlainText } from '@/components/segment-helpers'

function handleSubmit() {
  const mentions = getChipsByTrigger(segments, '@')
  const commands = getChipsByTrigger(segments, '/')

  sendMessage(
    { text: segmentsToPlainText(segments) },
    {
      // Anything in \`body\` is merged into the POST to /api/chat,
      // so typed chips travel alongside the prompt — no string parsing.
      body: {
        mentions: mentions.map((c) => c.value),
        command: commands[0]?.value,
        model: 'claude-opus-4-8',
      },
    },
  )
  setSegments([])
}`

const SERVER_CONTEXT_CODE = `import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { z } from 'zod'

// Allowlist everything you accept — the request body is untrusted input.
const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  model: z.enum(['claude-opus-4-8', 'claude-haiku-4-5']).default('claude-opus-4-8'),
  command: z.enum(['summarize', 'translate']).optional(),
  mentions: z.array(z.string().max(64)).max(10).default([]),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  const { messages, model, command, mentions } = parsed.data

  const system = [
    command
      ? \`The user invoked the "\${command}" command. Follow its conventions.\`
      : 'You are a helpful assistant.',
    mentions.length ? \`People referenced: \${mentions.join(', ')}.\` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const result = streamText({
    model: anthropic(model),
    system,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}`

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

      <DocsP>
        The AI SDK gives you transport, streaming, and message state for free. Prompt Area gives you
        a rich composer — mentions, slash commands, tags, inline markdown, and attachments — that
        most chat starters skip. Because Prompt Area is just a controlled <code>Segment[]</code>{' '}
        value, it sits cleanly between the two: you keep the AI SDK&apos;s runtime and add a real
        input on top.
      </DocsP>

      <DocsUl
        items={[
          <>
            <strong>One integration seam.</strong> Flatten segments with{' '}
            <code>segmentsToPlainText()</code> and hand them to <code>sendMessage</code>. No bespoke
            serialization.
          </>,
          <>
            <strong>Status-aware controls.</strong> The AI SDK&apos;s <code>status</code> drives the
            action bar — the send button becomes a stop button while a response streams.
          </>,
          <>
            <strong>Structured metadata.</strong> Read typed chips with{' '}
            <code>getChipsByTrigger()</code> and ship them in the request <code>body</code> next to
            the prompt.
          </>,
          <>
            <strong>Provider-agnostic.</strong> Swap <code>@ai-sdk/anthropic</code> for any other
            provider package — the component code is identical.
          </>,
        ]}
      />

      <DocsH2 id="install">Install</DocsH2>
      <DocsP>
        Add the AI SDK alongside Prompt Area. This example streams from Claude, so it uses the
        Anthropic provider — swap in another provider package (<code>@ai-sdk/openai</code>,{' '}
        <code>@ai-sdk/google</code>, …) if you prefer.
      </DocsP>
      <CodeBlock code={INSTALL_CMD} lang="bash" />
      <DocsP>
        The Anthropic provider reads <code>ANTHROPIC_API_KEY</code> from the environment. Set it in{' '}
        <code>.env.local</code> before calling the route.
      </DocsP>

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
        On submit, flatten the segments to a string with <code>segmentsToPlainText()</code> and pass
        it to <code>sendMessage</code>. Mentions, commands, and tags resolve to their display text,
        so a model-friendly prompt falls out for free; <code>useChat</code> appends it to{' '}
        <code>messages</code> and POSTs to your route.
      </DocsP>
      <DocsP>
        The AI SDK&apos;s <code>status</code> (<code>ready</code>, <code>submitted</code>,{' '}
        <code>streaming</code>, <code>error</code>) drives the action bar: while a response streams,
        the send button becomes a stop button wired to <code>stop()</code>. Guard{' '}
        <code>handleSubmit</code> on both <code>isSegmentsEmpty(segments)</code> and the streaming
        state so a press during generation is a no-op rather than a second request.
      </DocsP>
      <DocsP>
        On the server, <code>convertToModelMessages()</code> turns the UI message history into the
        provider format, <code>streamText()</code> calls the model, and{' '}
        <code>toUIMessageStreamResponse()</code> streams it back in the shape <code>useChat</code>{' '}
        expects. Render each assistant reply by mapping over <code>message.parts</code> and picking
        the <code>text</code> parts.
      </DocsP>

      <DocsH2 id="structured-context">Send structured context</DocsH2>
      <DocsP>
        Flattening to text is enough for a plain chatbot, but the whole point of chips is keeping
        structure. Read them back with <code>getChipsByTrigger()</code> and attach them to the
        request <code>body</code> — the AI SDK merges <code>body</code> into the POST, so your route
        receives them next to <code>messages</code>.
      </DocsP>
      <CodeBlock code={STRUCTURED_CONTEXT_CODE} lang="tsx" />
      <DocsP>
        Then validate the body with a Zod schema in your route handler and shape the call from the
        parsed, allowlisted values:
      </DocsP>
      <CodeBlock code={SERVER_CONTEXT_CODE} lang="tsx" />
      <Callout variant="warning">
        Request <code>body</code> is untrusted input. Parse it with a Zod schema and{' '}
        <code>safeParse</code> on the server — allowlist <code>model</code> IDs and{' '}
        <code>command</code> values with <code>z.enum()</code> and bound array sizes rather than
        passing anything straight through to the model.
      </Callout>

      <DocsH2 id="attachments">Attachments</DocsH2>
      <DocsP>
        Prompt Area handles the attachment UI — pasted screenshots and picked files render as
        thumbnails with loading and remove states. The AI SDK accepts files on the same call: hand
        the underlying <code>File</code> objects to{' '}
        <code>sendMessage(&#123; text, files &#125;)</code>. See{' '}
        <Link
          href="/docs/examples/attachments"
          className="text-foreground font-medium underline underline-offset-4">
          Attachments
        </Link>{' '}
        for the image and file props.
      </DocsP>

      <DocsH2 id="next-steps">Next steps</DocsH2>
      <DocsUl
        items={[
          <>
            <Link
              href="/docs/components/action-bar"
              className="text-foreground font-medium underline underline-offset-4">
              Action Bar
            </Link>{' '}
            — the toolbar that hosts the send/stop button and any extra controls.
          </>,
          <>
            <Link
              href="/docs/examples/dx-helpers"
              className="text-foreground font-medium underline underline-offset-4">
              DX Helpers
            </Link>{' '}
            — <code>usePromptAreaState()</code>, trigger presets, and{' '}
            <code>getChipsByTrigger()</code>.
          </>,
          <>
            <Link
              href="/docs/components/chat-prompt-layout"
              className="text-foreground font-medium underline underline-offset-4">
              Chat Prompt Layout
            </Link>{' '}
            — a scrollable message list with a pinned composer to wrap this example.
          </>,
          <>
            <Link
              href="/docs/api/hooks"
              className="text-foreground font-medium underline underline-offset-4">
              Hooks &amp; Helpers
            </Link>{' '}
            — full signatures for the helpers used here.
          </>,
        ]}
      />
    </>
  )
}

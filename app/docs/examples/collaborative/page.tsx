import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2, Callout } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { CodeBlock } from '@/components/code-block'
import { CollaborativeExample, collaborativeCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'
const REPO = 'https://github.com/just-marketing/prompt-area/blob/main'

export const metadata: Metadata = {
  title: 'Collaborative',
  description:
    'A multiplayer PromptArea over Vercel WebSockets — live presence, typing indicators, and a shared document, all on the same Segment[] model.',
  alternates: { canonical: `${SITE_URL}/docs/examples/collaborative` },
}

// A trimmed version of app/api/collab/route.ts — the WebSocket-specific parts.
const routeCode = `// app/api/collab/route.ts
import { experimental_upgradeWebSocket, type WebSocketData } from '@vercel/functions'

// WebSockets run on a Node.js Function with Fluid compute; keep it dynamic.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const rooms = new Map<string, Set<WebSocket>>() // in-memory — see note below

export async function GET(request: Request) {
  const roomId = new URL(request.url).searchParams.get('room') ?? 'lobby'

  return experimental_upgradeWebSocket((ws) => {
    const room = rooms.get(roomId) ?? new Set()
    rooms.set(roomId, room.add(ws))

    ws.on('message', (data: WebSocketData) => {
      // Fan the edit out to everyone else in the room (last-writer-wins).
      for (const peer of room) if (peer !== ws) peer.send(data)
    })

    ws.on('close', () => room.delete(ws))
  })
}`

export default function CollaborativeExamplePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Collaborative</h1>
      <DocsLead>
        A multiplayer composer: two windows editing the same <code>PromptArea</code> with live
        presence and typing indicators. It runs on{' '}
        <a
          href="https://vercel.com/docs/functions/websockets"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-4">
          Vercel WebSockets
        </a>{' '}
        and syncs the same <code>Segment[]</code> document model you already use everywhere else.
      </DocsLead>

      <DocsH2 id="demo">Live demo</DocsH2>
      <DocsP>
        Click <strong>Open 2nd window</strong> (or copy the link into another tab) and type in both
        — edits, chips, presence, and typing all sync in real time.
      </DocsP>
      <DocsExample
        id="collaborative-composer"
        title="Multiplayer composer"
        description="Open this page in two windows to see the shared document and presence update live."
        code={collaborativeCode}>
        <CollaborativeExample />
      </DocsExample>

      <Callout variant="note">
        Realtime is served by the deployed Vercel runtime. In local{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">next dev</code> the upgrade
        isn&apos;t available, so the hook reports{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          status: &apos;unsupported&apos;
        </code>{' '}
        and the editor falls back to a normal single-user input.
      </Callout>

      <DocsH2 id="how-it-works">How it works</DocsH2>
      <DocsP>
        Because the document is a plain serializable{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Segment[]</code> array,
        syncing is just broadcasting that array. The component stays unchanged — only the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">value</code>/
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">onChange</code> wiring is
        swapped for a hook that reads from and writes to a WebSocket.
      </DocsP>

      <DocsH2 id="route">The Vercel WebSocket route</DocsH2>
      <DocsP>
        Next.js has no native upgrade API, so Vercel exposes{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          experimental_upgradeWebSocket()
        </code>{' '}
        from{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">@vercel/functions</code>{' '}
        (it needs the <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">ws</code>{' '}
        package installed and Fluid compute enabled):
      </DocsP>
      <CodeBlock code={routeCode} lang="tsx" />
      <DocsP>
        The full implementation — room registry, presence, and the{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          useCollaborativePromptArea
        </code>{' '}
        client hook — lives in{' '}
        <a
          href={`${REPO}/app/api/collab/route.ts`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-4">
          app/api/collab/route.ts
        </a>{' '}
        and{' '}
        <a
          href={`${REPO}/lib/use-collaborative-prompt-area.ts`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-4">
          lib/use-collaborative-prompt-area.ts
        </a>
        .
      </DocsP>

      <DocsH2 id="production">Production notes</DocsH2>
      <Callout variant="warning">
        This demo keeps rooms in a single function&apos;s memory and resolves conflicts with
        last-writer-wins — fine for a shared scratchpad, not for heavy concurrent editing. WebSocket
        connections aren&apos;t guaranteed to reach the same instance, so for real multiplayer move
        presence and the document into a shared store (e.g.{' '}
        <a
          href="https://vercel.com/docs/functions/websockets#manage-persistent-state"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-4">
          Redis pub/sub
        </a>
        ) and layer in a CRDT if you need conflict-free merges.
      </Callout>

      <DocsP>
        New to the document model? See{' '}
        <Link
          href="/docs/api/prompt-area"
          className="text-foreground font-medium underline underline-offset-4">
          PromptArea Props
        </Link>{' '}
        and the{' '}
        <Link
          href="/docs/examples/vercel-ai-sdk"
          className="text-foreground font-medium underline underline-offset-4">
          Vercel AI SDK
        </Link>{' '}
        example for another realtime integration.
      </DocsP>
    </>
  )
}

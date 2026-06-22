'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { PromptArea } from 'prompt-area'
import { useCollaborativePromptArea } from '@/lib/use-collaborative-prompt-area'

const COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
]

const USERS = [
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'strategist', label: 'Strategist' },
  { value: 'designer', label: 'Designer' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({ name, color, ring }: { name: string; color: string; ring?: boolean }) {
  return (
    <span
      title={name}
      className={`flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
        ring ? 'ring-background ring-2' : ''
      }`}
      style={{ backgroundColor: color }}>
      {initials(name)}
    </span>
  )
}

type Session = { room: string; me: { name: string; color: string } }

export function CollaborativeExample() {
  const [session, setSession] = useState<Session | null>(null)
  const [copied, setCopied] = useState(false)

  // Derive room + identity on the client only — the random values would
  // otherwise cause a hydration mismatch against the server HTML.
  useEffect(() => {
    const url = new URL(window.location.href)
    let room = url.searchParams.get('room')
    if (!room) {
      room = Math.random().toString(36).slice(2, 8)
      url.searchParams.set('room', room)
      window.history.replaceState(null, '', url)
    }
    const me = {
      name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only session, derived once on mount
    setSession({ room, me })
  }, [])

  const { segments, onChange, peers, status } = useCollaborativePromptArea({
    room: session?.room ?? '',
    user: session?.me ?? { name: 'Guest', color: COLORS[0] },
  })

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!session) {
    return (
      <div className="text-muted-foreground flex h-[180px] items-center justify-center rounded-lg border text-sm">
        Starting session…
      </div>
    )
  }

  const statusLabel =
    status === 'open'
      ? `${peers.length + 1} here`
      : status === 'connecting'
        ? 'Connecting…'
        : status === 'unsupported'
          ? 'Local preview'
          : 'Reconnecting…'

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      {/* Presence + room controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar name={session.me.name} color={session.me.color} ring />
            {peers.map((p) => (
              <Avatar key={p.id} name={p.name} color={p.color} ring />
            ))}
          </div>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              className={`size-2 rounded-full ${status === 'open' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
            />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={() => window.open(window.location.href, '_blank', 'width=540,height=640')}
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors">
            <ExternalLink className="size-3.5" />
            Open 2nd window
          </button>
        </div>
      </div>

      {/* Typing indicators */}
      <div className="text-muted-foreground h-4 text-xs">
        {peers
          .filter((p) => p.typing)
          .map((p) => p.name)
          .join(', ')
          .replace(/^(.+)$/, '$1 typing…')}
      </div>

      <PromptArea
        value={segments}
        onChange={onChange}
        triggers={[
          {
            char: '@',
            position: 'any',
            mode: 'dropdown',
            chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type here, then open a second window — edits sync live…"
        minHeight={72}
      />

      {status === 'unsupported' && (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Realtime runs on Vercel WebSockets, which aren&apos;t available in local{' '}
          <code className="bg-muted rounded px-1 py-0.5 font-mono">next dev</code>. On the deployed
          site this composer syncs across every open window. The editor still works locally as a
          normal single-user input.
        </p>
      )}
    </div>
  )
}

export const collaborativeCode = `'use client'

import { PromptArea } from 'prompt-area'
import { useCollaborativePromptArea } from '@/lib/use-collaborative-prompt-area'

function CollaborativeComposer({ room }: { room: string }) {
  const { segments, onChange, peers, status } = useCollaborativePromptArea({
    room,
    user: { name: 'Guest 4821', color: '#6366f1' },
  })

  return (
    <>
      {/* Live presence — everyone else in the room */}
      <div className="presence">
        {peers.map((p) => (
          <span key={p.id} style={{ color: p.color }}>
            {p.name}
            {p.typing ? ' is typing…' : ''}
          </span>
        ))}
      </div>

      {/* Same Segment[] model as any PromptArea — onChange broadcasts the edit */}
      <PromptArea value={segments} onChange={onChange} placeholder="Type together…" />

      <p>{status === 'open' ? 'Live' : status}</p>
    </>
  )
}`

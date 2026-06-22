import { experimental_upgradeWebSocket, type WebSocketData } from '@vercel/functions'
import type { WebSocket } from 'ws'

// Vercel serves WebSockets from a Node.js Function on Fluid compute (the
// default for projects created after 2025-04-23). A connection is a long-lived
// invocation, so the route must be dynamic — never prerendered or cached.
// Docs: https://vercel.com/docs/functions/websockets
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ROOM_SIZE = 24
const MAX_ROOM_ID = 64

type User = { name: string; color: string }
type Client = { id: string; ws: WebSocket; user: User; typing: boolean }
type Room = { clients: Map<string, Client>; doc: unknown }

// In-memory room registry.
//
// CAVEAT — read before using beyond a demo: this lives in the memory of a single
// Vercel Function instance. Fluid compute lets one instance serve many sockets,
// so a small shared demo works, but reconnects and other clients are NOT
// guaranteed to land on the same instance, and a new deployment starts cold.
// For real multiplayer, move rooms / presence / the doc into a shared store
// (e.g. Redis pub/sub):
// https://vercel.com/docs/functions/websockets#manage-persistent-state
const rooms = new Map<string, Room>()

function getRoom(id: string): Room {
  let room = rooms.get(id)
  if (!room) {
    room = { clients: new Map(), doc: null }
    rooms.set(id, room)
  }
  return room
}

function decode(data: WebSocketData): string {
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8')
  return Buffer.from(data).toString('utf8')
}

function parse(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function sanitizeUser(value: unknown): User {
  const o = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const name = (typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Guest').slice(0, 24)
  const color =
    typeof o.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(o.color) ? o.color : '#6366f1'
  return { name, color }
}

function peerList(room: Room, exceptId: string | null) {
  return [...room.clients.values()]
    .filter((c) => c.id !== exceptId)
    .map((c) => ({ id: c.id, name: c.user.name, color: c.user.color, typing: c.typing }))
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload))
}

function broadcast(room: Room, exceptId: string | null, payload: unknown) {
  const msg = JSON.stringify(payload)
  for (const c of room.clients.values()) {
    if (c.id === exceptId) continue
    if (c.ws.readyState === c.ws.OPEN) c.ws.send(msg)
  }
}

export async function GET(request: Request) {
  const roomId =
    new URL(request.url).searchParams.get('room')?.slice(0, MAX_ROOM_ID).trim() || 'lobby'

  return experimental_upgradeWebSocket(
    (ws: WebSocket) => {
      const id = crypto.randomUUID()
      let room: Room | null = null

      ws.on('message', (data: WebSocketData) => {
        const msg = parse(decode(data))
        if (!msg) return

        switch (msg.t) {
          // First message from a client: register presence and hand back the
          // current document + everyone already in the room.
          case 'hello': {
            if (room) return // already joined
            const target = getRoom(roomId)
            if (target.clients.size >= MAX_ROOM_SIZE) {
              send(ws, { t: 'error', reason: 'room-full' })
              ws.close(1013, 'room full')
              return
            }
            room = target
            const user = sanitizeUser(msg.user)
            room.clients.set(id, { id, ws, user, typing: false })
            send(ws, { t: 'welcome', id, doc: room.doc, peers: peerList(room, id) })
            broadcast(room, id, {
              t: 'peer-join',
              peer: { id, name: user.name, color: user.color, typing: false },
            })
            return
          }

          // Whole-document sync. Last-writer-wins: we store and fan out the
          // latest Segment[] as-is (no merge / CRDT). Good enough for a demo,
          // not for concurrent heavy editing.
          case 'doc': {
            if (!room) return
            room.doc = msg.doc
            broadcast(room, id, { t: 'doc', doc: msg.doc })
            return
          }

          // Typing indicator.
          case 'presence': {
            if (!room) return
            const client = room.clients.get(id)
            if (!client) return
            client.typing = msg.typing === true
            broadcast(room, id, { t: 'presence', id, typing: client.typing })
            return
          }
        }
      })

      const leave = () => {
        if (!room) return
        room.clients.delete(id)
        broadcast(room, id, { t: 'peer-leave', id })
        if (room.clients.size === 0) rooms.delete(roomId)
        room = null
      }

      ws.on('close', leave)
      ws.on('error', leave)
    },
    { maxPayload: 64 * 1024 },
  )
}

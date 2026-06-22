'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Segment } from 'prompt-area'

export type Peer = { id: string; name: string; color: string; typing: boolean }

export type CollabStatus = 'connecting' | 'open' | 'closed' | 'unsupported'

export type UseCollaborativePromptAreaOptions = {
  /** Room id — everyone on the same room shares one document. Empty disables the connection. */
  room: string
  /** This client's presence identity. */
  user: { name: string; color: string }
  /** Override the WebSocket URL. Defaults to `/api/collab` on the current origin. */
  url?: string
}

export type CollaborativePromptArea = {
  /** Current document — wire into `<PromptArea value>`. */
  segments: Segment[]
  /** Wire into `<PromptArea onChange>` — updates local state and broadcasts the edit. */
  onChange: (segments: Segment[]) => void
  /** Everyone else in the room (self excluded). */
  peers: Peer[]
  /** This client's server-assigned id, once connected. */
  selfId: string | null
  status: CollabStatus
}

const isSegmentArray = (value: unknown): value is Segment[] => Array.isArray(value)

/**
 * Connects a `PromptArea` to the `/api/collab` Vercel WebSocket so multiple
 * windows share one document (last-writer-wins) plus live presence/typing.
 *
 * Realtime requires the deployed Vercel runtime; in local `next dev` the upgrade
 * isn't available, so the hook reports `status: 'unsupported'` and the component
 * still works as a normal local editor.
 */
export function useCollaborativePromptArea({
  room,
  user,
  url,
}: UseCollaborativePromptAreaOptions): CollaborativePromptArea {
  const [segments, setSegments] = useState<Segment[]>([])
  const [peers, setPeers] = useState<Peer[]>([])
  const [selfId, setSelfId] = useState<string | null>(null)
  const [status, setStatus] = useState<CollabStatus>('connecting')

  // Refs so the long-lived socket effect never goes stale.
  const socketRef = useRef<WebSocket | null>(null)
  const docRef = useRef<Segment[]>([])
  const userRef = useRef(user)
  // Keep the latest identity available to the long-lived socket without
  // forcing a reconnect when it changes.
  useEffect(() => {
    userRef.current = user
  }, [user])

  const send = useCallback((payload: unknown) => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
  }, [])

  // Typing indicator: announce on edit, retract after a short idle.
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signalTyping = useCallback(() => {
    send({ t: 'presence', typing: true })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => send({ t: 'presence', typing: false }), 1500)
  }, [send])

  const onChange = useCallback(
    (next: Segment[]) => {
      docRef.current = next
      setSegments(next)
      send({ t: 'doc', doc: next })
      signalTyping()
    },
    [send, signalTyping],
  )

  useEffect(() => {
    if (!room || typeof window === 'undefined') return

    const target =
      url ??
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}` +
        `/api/collab?room=${encodeURIComponent(room)}`

    let closed = false
    let everOpened = false
    let failedAttempts = 0
    let reconnectDelay = 1000
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      setStatus('connecting')
      const socket = new WebSocket(target)
      socketRef.current = socket

      socket.addEventListener('open', () => {
        everOpened = true
        failedAttempts = 0
        reconnectDelay = 1000
        setStatus('open')
        socket.send(JSON.stringify({ t: 'hello', user: userRef.current }))
        // Re-share our latest local doc so a reconnect doesn't lose edits.
        if (docRef.current.length) socket.send(JSON.stringify({ t: 'doc', doc: docRef.current }))
      })

      socket.addEventListener('message', (event) => {
        let msg: Record<string, unknown>
        try {
          const parsed: unknown = JSON.parse(String(event.data))
          if (!parsed || typeof parsed !== 'object') return
          msg = parsed as Record<string, unknown>
        } catch {
          return
        }

        switch (msg.t) {
          case 'welcome': {
            setSelfId(typeof msg.id === 'string' ? msg.id : null)
            if (Array.isArray(msg.peers)) setPeers(msg.peers as Peer[])
            // Adopt the room's existing doc only if we haven't typed yet.
            if (isSegmentArray(msg.doc) && docRef.current.length === 0) {
              docRef.current = msg.doc
              setSegments(msg.doc)
            }
            return
          }
          case 'doc': {
            // Remote edit — apply without rebroadcasting (PromptArea won't fire
            // onChange for an external value change).
            if (isSegmentArray(msg.doc)) {
              docRef.current = msg.doc
              setSegments(msg.doc)
            }
            return
          }
          case 'peer-join': {
            const peer = msg.peer as Peer | undefined
            if (peer?.id) setPeers((prev) => [...prev.filter((p) => p.id !== peer.id), peer])
            return
          }
          case 'peer-leave': {
            if (typeof msg.id === 'string') setPeers((prev) => prev.filter((p) => p.id !== msg.id))
            return
          }
          case 'presence': {
            if (typeof msg.id === 'string')
              setPeers((prev) =>
                prev.map((p) => (p.id === msg.id ? { ...p, typing: msg.typing === true } : p)),
              )
            return
          }
        }
      })

      socket.addEventListener('close', () => {
        socketRef.current = null
        if (closed) return
        // Never opened after a few tries → runtime doesn't support the upgrade
        // (e.g. local dev). Stop retrying and degrade to a local editor.
        if (!everOpened && ++failedAttempts >= 3) {
          setStatus('unsupported')
          return
        }
        setStatus('closed')
        reconnectTimer = setTimeout(connect, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 30000)
      })

      socket.addEventListener('error', () => socket.close())
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      socketRef.current?.close()
      socketRef.current = null
    }
    // Reconnect when the room or URL changes. `user` updates flow through userRef.
  }, [room, url])

  return { segments, onChange, peers, selfId, status }
}

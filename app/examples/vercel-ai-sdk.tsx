'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import {
  PromptArea,
  ActionBar,
  segmentsToPlainText,
  isSegmentsEmpty,
  type Segment,
  type PromptAreaHandle,
} from 'prompt-area'

// --- Simulated AI SDK chat ------------------------------------------------
// The docs run in the browser with no backend or API key, so this example
// ships a tiny stand-in for the AI SDK's `useChat`. It mirrors the real hook's
// surface — `messages` (with `parts`), `status`, `sendMessage`, and `stop` — so
// the wiring shown in the live demo matches the production code below verbatim.
// In your app you swap `useSimulatedChat()` for `useChat()` from `@ai-sdk/react`
// and delete everything in this section.

type UIPart = { type: 'text'; text: string }
type UIMessage = { id: string; role: 'user' | 'assistant'; parts: UIPart[] }
type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

const CANNED_REPLY =
  'PromptArea hands the AI SDK plain text via segmentsToPlainText(), and the AI SDK streams the response back token by token. Try @mentions, /commands, or **markdown** — chips resolve to text before they reach your model.'

function useSimulatedChat() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('ready')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const stop = useCallback(() => {
    clearTimers()
    setStatus('ready')
  }, [clearTimers])

  const sendMessage = useCallback(({ text }: { text: string }) => {
    const userMessage: UIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    }
    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', parts: [{ type: 'text', text: '' }] },
    ])
    setStatus('submitted')

    const words = CANNED_REPLY.split(' ')
    timers.current.push(
      setTimeout(() => {
        setStatus('streaming')
        words.forEach((word, i) => {
          timers.current.push(
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, parts: [{ type: 'text', text: words.slice(0, i + 1).join(' ') }] }
                    : m,
                ),
              )
              if (i === words.length - 1) setStatus('ready')
            }, i * 45),
          )
        })
      }, 400),
    )
  }, [])

  return { messages, status, sendMessage, stop }
}

// --- Example --------------------------------------------------------------

const SEND_BUTTON_CLASS =
  'rounded-lg bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
const STOP_BUTTON_CLASS = 'rounded-lg border p-1.5 transition-colors hover:bg-muted'

export function VercelAiSdkExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, status, sendMessage, stop } = useSimulatedChat()

  const isStreaming = status === 'submitted' || status === 'streaming'
  const isEmpty = isSegmentsEmpty(segments)

  const handleSubmit = useCallback(() => {
    if (isSegmentsEmpty(segments) || isStreaming) return
    sendMessage({ text: segmentsToPlainText(segments) })
    promptRef.current?.clear()
    setSegments([])
  }, [segments, isStreaming, sendMessage])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-[460px] flex-col rounded-lg border">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Send a message to start streaming a response.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                {message.parts.map((part, i) =>
                  part.type === 'text' ? <span key={i}>{part.text}</span> : null,
                )}
                {message.role === 'assistant' &&
                  isStreaming &&
                  message.id === messages[messages.length - 1]?.id && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          placeholder="Send a message..."
          onSubmit={handleSubmit}
          autoGrow
          minHeight={44}
          maxHeight={160}
        />
        <ActionBar
          right={
            isStreaming ? (
              <button
                type="button"
                className={STOP_BUTTON_CLASS}
                aria-label="Stop generating"
                onClick={stop}>
                <Square className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                className={SEND_BUTTON_CLASS}
                aria-label="Send message"
                disabled={isEmpty}
                onClick={handleSubmit}>
                <ArrowUp className="size-4" />
              </button>
            )
          }
        />
      </div>
    </div>
  )
}

export const vercelAiSdkCode = `// app/api/chat/route.ts — stream completions from Claude via the AI SDK
import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

// Validate the request body — never trust what the client POSTs.
const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }

  const result = streamText({
    model: anthropic('claude-opus-4-8'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(parsed.data.messages),
  })

  return result.toUIMessageStreamResponse()
}

// chat.tsx — PromptArea wired to useChat
'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Square } from 'lucide-react'
import { PromptArea } from '@/components/prompt-area'
import { ActionBar } from '@/components/action-bar'
import { segmentsToPlainText, isSegmentsEmpty } from '@/components/segment-helpers'
import type { Segment } from '@/components/types'

export function Chat() {
  const [segments, setSegments] = useState<Segment[]>([])
  const { messages, status, sendMessage, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isStreaming = status === 'submitted' || status === 'streaming'

  const handleSubmit = () => {
    if (isSegmentsEmpty(segments) || isStreaming) return
    // Chips (mentions, commands, tags) flatten to plain text for the model.
    sendMessage({ text: segmentsToPlainText(segments) })
    setSegments([])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            {message.parts.map((part, i) =>
              part.type === 'text' ? <span key={i}>{part.text}</span> : null,
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-3">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Send a message..."
          onSubmit={handleSubmit}
          autoGrow
          minHeight={44}
        />
        <ActionBar
          right={
            isStreaming ? (
              <button type="button" onClick={stop} aria-label="Stop generating">
                <Square className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSegmentsEmpty(segments)}
                aria-label="Send message">
                <ArrowUp className="size-4" />
              </button>
            )
          }
        />
      </div>
    </div>
  )
}`

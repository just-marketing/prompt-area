'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import {
  PromptArea,
  ActionBar,
  ChatPromptLayout,
  segmentsToPlainText,
  type Segment,
  type PromptAreaHandle,
} from 'prompt-area'

type Message = { id: number; role: 'user' | 'assistant'; content: string }

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'user',
    content: 'Hey, can you help me understand how React Server Components work?',
  },
  {
    id: 2,
    role: 'assistant',
    content:
      'Sure! React Server Components (RSC) let you render components on the server. They can directly access backend resources like databases and file systems without an API layer. The key difference from traditional SSR is that RSC never ship their JavaScript to the client — they render once on the server and send HTML.',
  },
  { id: 3, role: 'user', content: 'How do they differ from Client Components?' },
  {
    id: 4,
    role: 'assistant',
    content:
      'Client Components are the traditional React components you\'re used to. They run in the browser, can use hooks like useState and useEffect, and handle interactivity. You mark them with "use client" at the top. Server Components are the default in Next.js App Router — they can\'t use browser APIs or hooks, but they reduce the JavaScript bundle sent to the client.',
  },
  { id: 5, role: 'user', content: 'Can I mix them together?' },
  {
    id: 6,
    role: 'assistant',
    content:
      "Absolutely! That's the whole idea. You can import Client Components into Server Components. The Server Component handles data fetching and layout, while Client Components handle interactive parts. Think of it as a tree where Server Components are the branches and Client Components are the interactive leaves.",
  },
  { id: 7, role: 'user', content: 'What about data fetching patterns?' },
  {
    id: 8,
    role: 'assistant',
    content:
      'In Server Components, you can use async/await directly — just make the component async and fetch data at the top level. No need for useEffect or state management for server data. For Client Components, you can pass data as props from a parent Server Component, or use traditional patterns like SWR or React Query for client-side fetching.',
  },
  { id: 9, role: 'user', content: 'That makes a lot of sense. What about caching?' },
  {
    id: 10,
    role: 'assistant',
    content:
      'Next.js extends fetch with automatic caching and revalidation. You can set cache behavior per-request with options like { cache: "force-cache" } or { next: { revalidate: 60 } }. There\'s also the unstable_cache API for caching non-fetch operations like database queries. The App Router also has built-in route segment caching.',
  },
]

function isSegmentsEmpty(segments: Segment[]): boolean {
  return (
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')
  )
}

const SEND_BUTTON_CLASS =
  'rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50'

export function ChatPromptLayoutExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const handleSubmit = useCallback(() => {
    if (isSegmentsEmpty(segments)) return
    const text = segmentsToPlainText(segments)
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }])
    promptRef.current?.clear()
    setSegments([])
  }, [segments])

  return (
    <ChatPromptLayout
      className="h-[600px] rounded-lg border"
      prompt={
        <div className="bg-background border-t p-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border p-4">
              <PromptArea
                ref={promptRef}
                value={segments}
                onChange={setSegments}
                placeholder="Type a message..."
                onSubmit={handleSubmit}
                autoGrow
                minHeight={48}
                maxHeight={200}
              />
              <ActionBar
                right={
                  <button
                    type="button"
                    className={SEND_BUTTON_CLASS}
                    aria-label="Send message"
                    disabled={isEmpty}
                    onClick={handleSubmit}>
                    <ArrowUp className="size-4" />
                  </button>
                }
              />
            </div>
          </div>
        </div>
      }>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </ChatPromptLayout>
  )
}

export const chatPromptLayoutCode = `import { useCallback, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { PromptArea } from '@/components/prompt-area'
import { ActionBar } from '@/components/action-bar'
import { ChatPromptLayout } from '@/components/chat-prompt-layout'
import { segmentsToPlainText } from '@/components/prompt-area-engine'
import type { Segment, PromptAreaHandle } from '@/components/types'

type Message = { id: number; role: 'user' | 'assistant'; content: string }

function ChatPromptLayoutExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  const handleSubmit = useCallback(() => {
    if (isEmpty) return
    const text = segmentsToPlainText(segments)
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }])
    promptRef.current?.clear()
    setSegments([])
  }, [isEmpty, segments])

  return (
    <ChatPromptLayout
      className="h-[600px]"
      prompt={
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl rounded-lg border p-4">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              placeholder="Type a message..."
              onSubmit={handleSubmit}
              autoGrow
              minHeight={48}
              maxHeight={200}
            />
            <ActionBar
              right={
                <button aria-label="Send" disabled={isEmpty} onClick={handleSubmit}>
                  <ArrowUp className="size-4" />
                </button>
              }
            />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {messages.map(msg => (
          <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm \${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }\`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </ChatPromptLayout>
  )
}`

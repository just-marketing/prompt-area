'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import type { Segment, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

function isSegmentsEmpty(segments: Segment[]): boolean {
  return (
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')
  )
}

const SEND_BUTTON_CLASS =
  'rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50'

export function ActionBarMinimalExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const handleSubmit = useCallback(() => {
    if (isSegmentsEmpty(segments)) return
    promptRef.current?.clear()
    setSegments([])
  }, [segments])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        ref={promptRef}
        value={segments}
        onChange={setSegments}
        placeholder="Type a message..."
        onSubmit={handleSubmit}
        minHeight={48}
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
  )
}

export const actionBarMinimalCode = `import { useCallback, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { PromptArea } from '@/components/prompt-area'
import { ActionBar } from '@/components/action-bar'
import type { Segment, PromptAreaHandle } from '@/components/types'

function ActionBarMinimalExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  const handleSubmit = useCallback(() => {
    if (isEmpty) return
    promptRef.current?.clear()
    setSegments([])
  }, [isEmpty])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        ref={promptRef}
        value={segments}
        onChange={setSegments}
        placeholder="Type a message..."
        onSubmit={handleSubmit}
        minHeight={48}
      />
      <ActionBar
        right={
          <button
            aria-label="Send message"
            disabled={isEmpty}
            onClick={handleSubmit}>
            <ArrowUp className="size-4" />
          </button>
        }
      />
    </div>
  )
}`

'use client'

import { useCallback, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { CompactPromptArea } from '@/registry/new-york/blocks/compact-prompt-area/compact-prompt-area'
import { segmentsToPlainText } from '@/registry/new-york/blocks/prompt-area/prompt-area-engine'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'

const USERS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'strategist', label: 'Strategist', description: 'Campaign planning' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
]

const COMMANDS = [
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
]

const TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const MIC_BUTTON_CLASS =
  'flex items-center justify-center rounded-full size-8 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'

export function CompactPromptAreaExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [submitted, setSubmitted] = useState('')
  const promptRef = useRef<PromptAreaHandle>(null)

  const handleSubmit = useCallback((segs: Segment[]) => {
    const text = segmentsToPlainText(segs)
    if (!text.trim()) return
    setSubmitted(text)
    promptRef.current?.clear()
    setSegments([])
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <CompactPromptArea
        ref={promptRef}
        value={segments}
        onChange={setSegments}
        triggers={TRIGGERS}
        placeholder="Ask anything..."
        onSubmit={handleSubmit}
        onPlusClick={() => alert('Plus clicked')}
        beforeSubmitSlot={
          <button type="button" className={MIC_BUTTON_CLASS} aria-label="Voice input">
            <Mic className="size-4" />
          </button>
        }
      />
      {submitted && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}
    </div>
  )
}

export const compactPromptAreaCode = `import { useCallback, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { CompactPromptArea } from '@/registry/new-york/blocks/compact-prompt-area/compact-prompt-area'
import type { Segment, TriggerConfig, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

const triggers: TriggerConfig[] = [
  { char: '@', position: 'any', mode: 'dropdown', onSearch: (q) => USERS.filter(...) },
  { char: '/', position: 'start', mode: 'dropdown', chipStyle: 'inline', onSearch: (q) => COMMANDS.filter(...) },
]

function CompactPromptAreaExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const handleSubmit = useCallback((segs: Segment[]) => {
    promptRef.current?.clear()
    setSegments([])
  }, [])

  return (
    <CompactPromptArea
      ref={promptRef}
      value={segments}
      onChange={setSegments}
      triggers={triggers}
      placeholder="Ask anything..."
      onSubmit={handleSubmit}
      onPlusClick={() => console.log('Plus clicked')}
      beforeSubmitSlot={
        <button aria-label="Voice input">
          <Mic className="size-4" />
        </button>
      }
    />
  )
}`

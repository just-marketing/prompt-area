'use client'

import { useState } from 'react'
import { PromptArea, type Segment } from 'prompt-area'

export function RotatingPlaceholdersExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        placeholder={[
          'Ask a question...',
          'Write a story...',
          'Summarize an article...',
          'Generate some code...',
        ]}
        onSubmit={() => {
          setSegments([])
        }}
        minHeight={48}
      />
    </div>
  )
}

export const rotatingPlaceholdersCode = `import { useState } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

function RotatingPlaceholdersExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      placeholder={[
        'Ask a question...',
        'Write a story...',
        'Summarize an article...',
        'Generate some code...',
      ]}
      onSubmit={() => { setSegments([]) }}
      minHeight={48}
    />
  )
}`

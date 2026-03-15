'use client'

import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

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
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

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

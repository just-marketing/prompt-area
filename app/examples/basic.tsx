'use client'

import { useState } from 'react'
import { PromptArea, type Segment } from 'prompt-area'

export function BasicExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        placeholder="Just a text input with Enter to submit..."
        onSubmit={() => {
          setSegments([])
        }}
        minHeight={48}
      />
    </div>
  )
}

export const basicCode = `import { useState } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

function BasicExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      placeholder="Just a text input with Enter to submit..."
      onSubmit={() => { setSegments([]) }}
      minHeight={48}
    />
  )
}`

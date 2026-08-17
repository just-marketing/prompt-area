'use client'

import { useState } from 'react'
import { PromptArea, type Segment } from 'prompt-area'

export function MarkdownExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        markdownHeadings
        placeholder="Try ## a heading, **bold**, *italic*, ***both***, or start a line with - for lists..."
        minHeight={80}
      />
    </div>
  )
}

export const markdownCode = `import { useState } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

function MarkdownExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      // Opt in to headings: "## " renders at heading size with the hashes
      // hidden. Off by default — a comment box is prose, not a document.
      markdownHeadings
      placeholder="Try ## a heading, **bold**, *italic*, ***both***, or start a line with - for lists..."
      minHeight={80}
    />
  )
}`

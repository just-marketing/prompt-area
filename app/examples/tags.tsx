'use client'

import { useState } from 'react'
import { PromptArea, type Segment } from 'prompt-area'

const TAGS = [
  { value: 'campaign', label: 'campaign', description: 'Marketing initiatives' },
  { value: 'lead-gen', label: 'lead-gen', description: 'Top-of-funnel capture' },
  { value: 'conversion', label: 'conversion', description: 'Funnel optimization' },
  { value: 'branding', label: 'branding', description: 'Brand & identity' },
  { value: 'outbound', label: 'outbound', description: 'Cold outreach' },
]

export function TagsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '#',
            position: 'any',
            mode: 'dropdown',
            resolveOnSpace: true,
            chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type # for tags (press space to auto-resolve)..."
        minHeight={48}
      />
    </div>
  )
}

export const tagsCode = `import { useState } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

const TAGS = [
  { value: 'campaign', label: 'campaign', description: 'Marketing initiatives' },
  { value: 'lead-gen', label: 'lead-gen', description: 'Top-of-funnel capture' },
  { value: 'conversion', label: 'conversion', description: 'Funnel optimization' },
  { value: 'branding', label: 'branding', description: 'Brand & identity' },
]

function TagsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      triggers={[
        {
          char: '#',
          position: 'any',
          mode: 'dropdown',
          resolveOnSpace: true,
          chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
          onSearch: (q) =>
            TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
        },
      ]}
      placeholder="Type # for tags (press space to auto-resolve)..."
      minHeight={48}
    />
  )
}`

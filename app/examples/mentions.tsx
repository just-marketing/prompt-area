'use client'

import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

const USERS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'strategist', label: 'Strategist', description: 'Campaign planning' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
  { value: 'outreach', label: 'Outreach', description: 'Sales prospecting' },
  { value: 'designer', label: 'Designer', description: 'Visual & brand assets' },
]

export function MentionsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '@',
            position: 'any',
            mode: 'dropdown',
            chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type @ to mention an agent..."
        minHeight={48}
      />
    </div>
  )
}

export const mentionsCode = `import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

const USERS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'strategist', label: 'Strategist', description: 'Campaign planning' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
]

function MentionsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      triggers={[
        {
          char: '@',
          position: 'any',
          mode: 'dropdown',
          chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
          onSearch: (q) =>
            USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
        },
      ]}
      placeholder="Type @ to mention an agent..."
      minHeight={48}
    />
  )
}`

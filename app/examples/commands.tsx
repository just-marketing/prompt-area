'use client'

import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

const COMMANDS = [
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'create-slides', label: 'create-slides', description: 'Generate a slide deck' },
  { value: 'draft-email', label: 'draft-email', description: 'Compose a sales email' },
  { value: 'analyze', label: 'analyze', description: 'Break down key metrics' },
]

export function CommandsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '/',
            position: 'start',
            mode: 'dropdown',
            chipStyle: 'inline',
            chipClassName: 'text-violet-700 dark:text-violet-400',
            onSearch: (q) =>
              COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type / at the start for commands..."
        minHeight={48}
      />
    </div>
  )
}

export const commandsCode = `import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

const COMMANDS = [
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'create-slides', label: 'create-slides', description: 'Generate a slide deck' },
]

function CommandsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      triggers={[
        {
          char: '/',
          position: 'start',
          mode: 'dropdown',
          chipStyle: 'inline',
          chipClassName: 'text-violet-700 dark:text-violet-400',
          onSearch: (q) =>
            COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
        },
      ]}
      placeholder="Type / at the start for commands..."
      minHeight={48}
    />
  )
}`

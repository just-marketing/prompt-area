'use client'

import { useState } from 'react'
import { PromptArea, type Segment } from 'prompt-area'

export function CallbackExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [lastCallback, setLastCallback] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          triggers={[
            {
              char: '!',
              position: 'any',
              mode: 'callback',
              onActivate: (ctx) => {
                setLastCallback(`Activated at position ${ctx.cursorPosition}`)
                ctx.insertChip({
                  trigger: '!',
                  value: 'alert',
                  displayText: 'alert',
                })
              },
            },
          ]}
          placeholder="Type ! to trigger a callback..."
          minHeight={48}
        />
      </div>
      {lastCallback && <div className="text-muted-foreground text-xs">{lastCallback}</div>}
    </div>
  )
}

export const callbackCode = `import { useState } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

function CallbackExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [lastCallback, setLastCallback] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '!',
            position: 'any',
            mode: 'callback',
            onActivate: (ctx) => {
              setLastCallback(\`Activated at position \${ctx.cursorPosition}\`)
              ctx.insertChip({
                trigger: '!',
                value: 'alert',
                displayText: 'alert',
              })
            },
          },
        ]}
        placeholder="Type ! to trigger a callback..."
        minHeight={48}
      />
      {lastCallback && (
        <div className="text-muted-foreground text-xs">{lastCallback}</div>
      )}
    </div>
  )
}`

'use client'

import { useState } from 'react'
import { PlusCircle, AtSign, ArrowUp } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

export function ActionBarDisabledExample() {
  const [segments] = useState<Segment[]>([{ type: 'text', text: 'This input is disabled...' }])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={() => {}}
        placeholder="Disabled..."
        disabled
        minHeight={48}
      />
      <ActionBar
        disabled
        left={
          <>
            <button
              type="button"
              className="text-muted-foreground rounded-md p-1.5"
              aria-label="Attach">
              <PlusCircle className="size-4" />
            </button>
            <button
              type="button"
              className="text-muted-foreground rounded-md p-1.5"
              aria-label="Mention">
              <AtSign className="size-4" />
            </button>
          </>
        }
        right={
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-lg p-1.5"
            disabled
            aria-label="Send message">
            <ArrowUp className="size-4" />
          </button>
        }
      />
    </div>
  )
}

export const actionBarDisabledCode = `import { useState } from 'react'
import { PlusCircle, AtSign, ArrowUp } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

function ActionBarDisabledExample() {
  const [segments] = useState<Segment[]>([
    { type: 'text', text: 'This input is disabled...' },
  ])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={() => {}}
        placeholder="Disabled..."
        disabled
        minHeight={48}
      />
      <ActionBar
        disabled
        left={
          <>
            <button className="text-muted-foreground rounded-md p-1.5" aria-label="Attach">
              <PlusCircle className="size-4" />
            </button>
            <button className="text-muted-foreground rounded-md p-1.5" aria-label="Mention">
              <AtSign className="size-4" />
            </button>
          </>
        }
        right={
          <button className="bg-primary text-primary-foreground rounded-lg p-1.5" disabled aria-label="Send message">
            <ArrowUp className="size-4" />
          </button>
        }
      />
    </div>
  )
}`

'use client'

import { useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment, TriggerConfig } from '@/registry/new-york/blocks/prompt-area/types'
import { USERS } from './mock-data'

export function DarkThemePreview() {
  const [lightSegments, setLightSegments] = useState<Segment[]>([])
  const [darkSegments, setDarkSegments] = useState<Segment[]>([])

  const triggers: TriggerConfig[] = [
    {
      char: '@',
      position: 'any',
      mode: 'dropdown',
      chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Light</p>
        <div
          className="rounded-lg border bg-white p-3 text-[oklch(0.145_0_0)]"
          style={
            {
              '--popover': 'oklch(1 0 0)',
              '--popover-foreground': 'oklch(0.145 0 0)',
              '--foreground': 'oklch(0.145 0 0)',
              '--accent': 'oklch(0.97 0 0)',
              '--accent-foreground': 'oklch(0.205 0 0)',
              '--muted-foreground': 'oklch(0.556 0 0)',
              '--border': 'oklch(0.922 0 0)',
              '--secondary': 'oklch(0.97 0 0)',
            } as React.CSSProperties
          }>
          <PromptArea
            value={lightSegments}
            onChange={setLightSegments}
            triggers={triggers}
            placeholder="Type @ to mention..."
            minHeight={48}
          />
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Dark</p>
        <div
          className="dark rounded-lg border border-[oklch(1_0_0/10%)] bg-[oklch(0.145_0_0)] p-3 text-[oklch(0.985_0_0)]"
          style={
            {
              '--popover': 'oklch(0.205 0 0)',
              '--popover-foreground': 'oklch(0.985 0 0)',
              '--foreground': 'oklch(0.985 0 0)',
              '--accent': 'oklch(0.269 0 0)',
              '--accent-foreground': 'oklch(0.985 0 0)',
              '--muted-foreground': 'oklch(0.708 0 0)',
              '--border': 'oklch(1 0 0 / 10%)',
              '--secondary': 'oklch(0.269 0 0)',
            } as React.CSSProperties
          }>
          <PromptArea
            value={darkSegments}
            onChange={setDarkSegments}
            triggers={triggers}
            placeholder="Type @ to mention..."
            minHeight={48}
          />
        </div>
      </div>
    </div>
  )
}

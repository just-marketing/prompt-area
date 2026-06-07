'use client'

import { useState } from 'react'
import { GitBranch, ChevronDown } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

export function StatusBarAboveExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <StatusBar
        className="border-b"
        left={
          <div className="flex items-center gap-1.5">
            <span className="bg-muted rounded px-1.5 py-0.5 font-medium">prompt-area</span>
            <GitBranch className="text-muted-foreground size-3" />
            <span className="text-muted-foreground">main</span>
          </div>
        }
        right={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            Default
            <ChevronDown className="size-3" />
          </button>
        }
      />
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Type a message..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
      </div>
    </div>
  )
}

export function StatusBarBelowExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Reply..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
      </div>
      <StatusBar
        className="border-t"
        left={
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">+</span>
            <span className="text-muted-foreground">&lt;/&gt; Auto accept edits</span>
          </div>
        }
        right={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            Opus 4.8
            <ChevronDown className="size-3" />
          </button>
        }
      />
    </div>
  )
}

export function StatusBarBothExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <StatusBar
        className="border-b"
        left={
          <div className="flex items-center gap-1.5">
            <span className="bg-muted rounded px-1.5 py-0.5 font-medium">prompt-area</span>
            <GitBranch className="text-muted-foreground size-3" />
            <span className="text-muted-foreground">main</span>
          </div>
        }
        right={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            Default
            <ChevronDown className="size-3" />
          </button>
        }
      />
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Reply..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
        <ActionBar
          left={
            <span className="text-muted-foreground text-xs">+ &lt;/&gt; Auto accept edits</span>
          }
          right={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
              Opus 4.8
              <ChevronDown className="size-3" />
            </button>
          }
        />
      </div>
    </div>
  )
}

export const statusBarAboveCode = `import { useState } from 'react'
import { GitBranch, ChevronDown } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

function StatusBarAboveExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <StatusBar
        className="border-b"
        left={
          <div className="flex items-center gap-1.5">
            <span className="bg-muted rounded px-1.5 py-0.5 font-medium">prompt-area</span>
            <GitBranch className="text-muted-foreground size-3" />
            <span className="text-muted-foreground">main</span>
          </div>
        }
        right={
          <button className="text-muted-foreground flex items-center gap-1">
            Default <ChevronDown className="size-3" />
          </button>
        }
      />
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Type a message..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
      </div>
    </div>
  )
}`

export const statusBarBelowCode = `import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

function StatusBarBelowExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Reply..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
      </div>
      <StatusBar
        className="border-t"
        left={<span className="text-muted-foreground">{"+ </> Auto accept edits"}</span>}
        right={
          <button className="text-muted-foreground flex items-center gap-1">
            Opus 4.8 <ChevronDown className="size-3" />
          </button>
        }
      />
    </div>
  )
}`

export const statusBarBothCode = `import { useState } from 'react'
import { GitBranch, ChevronDown } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'

function StatusBarBothExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border">
      <StatusBar
        className="border-b"
        left={
          <div className="flex items-center gap-1.5">
            <span className="bg-muted rounded px-1.5 py-0.5 font-medium">prompt-area</span>
            <GitBranch className="size-3" />
            <span className="text-muted-foreground">main</span>
          </div>
        }
        right={
          <button className="text-muted-foreground flex items-center gap-1">
            Default <ChevronDown className="size-3" />
          </button>
        }
      />
      <div className="p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Reply..."
          onSubmit={() => setSegments([])}
          minHeight={48}
        />
        <ActionBar
          left={<span className="text-muted-foreground text-xs">{"+ </> Auto accept edits"}</span>}
          right={
            <button className="text-muted-foreground flex items-center gap-1 text-xs">
              Opus 4.8 <ChevronDown className="size-3" />
            </button>
          }
        />
      </div>
    </div>
  )
}`

'use client'

import { ALargeSmall } from 'lucide-react'
import { PromptArea, usePromptAreaState, useMarkdownMode, text, type Segment } from 'prompt-area'

const SEED: Segment[] = [
  text('Ship **bold** ideas, *fast* — see https://prompt-area.com\n- draft\n- review\n- ship'),
]

export function MarkdownModeExample() {
  const { bind } = usePromptAreaState({ initialValue: SEED })
  const { markdown, mode, toggle } = useMarkdownMode()

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border p-4">
        <PromptArea
          {...bind}
          markdown={markdown}
          placeholder="Try **bold**, *italic*, a URL, or a - list…"
          minHeight={96}
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={markdown}
          title={markdown ? 'Switch to plain text' : 'Switch to markdown'}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm">
          <ALargeSmall className="size-4" />
          {markdown ? 'Markdown' : 'Plain text'}
        </button>
        <span className="text-muted-foreground text-xs">
          mode: <span className="font-mono">{mode}</span>
        </span>
      </div>
    </div>
  )
}

export const markdownModeCode = `import { ALargeSmall } from 'lucide-react'
import { PromptArea } from '@/components/prompt-area'
import { usePromptAreaState } from '@/components/use-prompt-area-state'
import { useMarkdownMode } from '@/components/use-markdown-mode'

function Composer() {
  const { bind } = usePromptAreaState()
  const { markdown, mode, toggle } = useMarkdownMode()

  return (
    <>
      <PromptArea {...bind} markdown={markdown} />

      <button
        type="button"
        onClick={toggle}
        aria-pressed={markdown}
        title={markdown ? 'Switch to plain text' : 'Switch to markdown'}>
        <ALargeSmall className="size-4" />
        {markdown ? 'Markdown' : 'Plain text'}
      </button>
    </>
  )
}`

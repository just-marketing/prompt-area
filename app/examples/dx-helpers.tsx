'use client'

import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { usePromptAreaState } from '@/registry/new-york/blocks/prompt-area/use-prompt-area-state'
import {
  mentionTrigger,
  commandTrigger,
  hashtagTrigger,
} from '@/registry/new-york/blocks/prompt-area/trigger-presets'
import { getChipsByTrigger } from '@/registry/new-york/blocks/prompt-area/segment-helpers'

const AGENTS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
  { value: 'designer', label: 'Designer', description: 'Visual & brand assets' },
]

const COMMANDS = [
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
]

const TAGS = [
  { value: 'campaign', label: 'campaign' },
  { value: 'branding', label: 'branding' },
]

const search =
  <T extends { label: string }>(items: T[]) =>
  (q: string) =>
    items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))

export function DxHelpersExample() {
  const { bind, isEmpty, chips, plainText, clear } = usePromptAreaState()

  const mentions = getChipsByTrigger(bind.value, '@')

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border p-4">
        <PromptArea
          {...bind}
          triggers={[
            mentionTrigger({
              chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              onSearch: search(AGENTS),
            }),
            commandTrigger({
              chipClassName: 'text-violet-700 dark:text-violet-400',
              onSearch: search(COMMANDS),
            }),
            hashtagTrigger({
              chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              onSearch: search(TAGS),
            }),
          ]}
          placeholder="Try @mention, /command, and #tags..."
          onSubmit={() => clear()}
          minHeight={48}
        />
      </div>
      <div className="text-muted-foreground flex gap-4 text-xs">
        <span>empty: {String(isEmpty)}</span>
        <span>chips: {chips.length}</span>
        <span>mentions: {mentions.length}</span>
        {plainText && <span className="max-w-48 truncate">text: {plainText}</span>}
      </div>
    </div>
  )
}

export const dxHelpersCode = `import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { usePromptAreaState } from '@/registry/new-york/blocks/prompt-area/use-prompt-area-state'
import { mentionTrigger, commandTrigger, hashtagTrigger } from '@/registry/new-york/blocks/prompt-area/trigger-presets'
import { getChipsByTrigger } from '@/registry/new-york/blocks/prompt-area/segment-helpers'

function ChatInput() {
  const { bind, plainText, isEmpty, chips, clear, focus } = usePromptAreaState()
  const mentions = getChipsByTrigger(bind.value, '@')

  return (
    <>
      <PromptArea
        {...bind}
        triggers={[
          mentionTrigger({ onSearch: searchAgents }),
          commandTrigger({ onSearch: searchCommands }),
          hashtagTrigger({ onSearch: searchTags }),
        ]}
        placeholder="Try @mention, /command, and #tags..."
        onSubmit={() => {
          sendMessage(plainText, mentions)
          clear()
        }}
      />
      <button disabled={isEmpty} onClick={() => focus()}>
        Send
      </button>
    </>
  )
}`

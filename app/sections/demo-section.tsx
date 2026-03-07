'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AtSign,
  Type,
  ArrowUp,
  PlusCircle,
  SquareSlash,
  Hash,
  Mic,
  Code,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { USERS, COMMANDS, TAGS } from './mock-data'

const DEMO_INITIAL_SEGMENTS: Segment[] = [
  { type: 'chip', trigger: '/', value: 'summarize', displayText: 'summarize' },
  { type: 'text', text: ' the meeting notes from ' },
  { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
  { type: 'text', text: ' and ' },
  { type: 'chip', trigger: '@', value: 'bob', displayText: 'Bob' },
  { type: 'text', text: '. Tag anything marked ' },
  { type: 'chip', trigger: '#', value: 'urgent', displayText: 'urgent' },
  {
    type: 'text',
    text: ' and format the output as:\n- **Key decisions** made during the meeting\n- *Action items* assigned to each team member\n- Open questions for follow-up',
  },
]

const DEMO_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accessibilityLabel: 'mention',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    accessibilityLabel: 'command',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    accessibilityLabel: 'tag',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const ICON_BTN = 'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'
const MENU_ITEM = 'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent'

export function DemoSection() {
  const [segments, setSegments] = useState<Segment[]>(DEMO_INITIAL_SEGMENTS)
  const [markdownEnabled, setMarkdownEnabled] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleSubmit = useCallback(() => {
    if (isEmpty) return
    promptRef.current?.clear()
    setSegments([])
  }, [isEmpty])

  const insertTrigger = useCallback((char: string) => {
    promptRef.current?.focus()
    requestAnimationFrame(() => {
      document.execCommand('insertText', false, char)
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border p-4 shadow-sm">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          triggers={DEMO_TRIGGERS}
          placeholder="Ask anything..."
          onSubmit={handleSubmit}
          markdown={markdownEnabled}
          autoGrow
          minHeight={72}
          maxHeight={280}
        />
        <ActionBar
          left={
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={ICON_BTN}
                  aria-label="Attach"
                  onClick={() => setMenuOpen((v) => !v)}>
                  <PlusCircle className="size-4" />
                </button>
                {menuOpen && (
                  <div className="bg-popover absolute top-full left-0 z-10 mt-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                    <button type="button" className={MENU_ITEM} onClick={() => setMenuOpen(false)}>
                      <Upload className="size-4" />
                      Upload file
                    </button>
                    <button type="button" className={MENU_ITEM} onClick={() => setMenuOpen(false)}>
                      <ImageIcon className="size-4" />
                      Upload image
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={ICON_BTN}
                aria-label="Mention"
                onClick={() => insertTrigger('@')}>
                <AtSign className="size-4" />
              </button>
              <button
                type="button"
                className={ICON_BTN}
                aria-label="Commands"
                onClick={() => {
                  promptRef.current?.focus()
                  requestAnimationFrame(() => {
                    const sel = window.getSelection()
                    const el = document.activeElement
                    if (sel && el) {
                      sel.collapse(el, 0)
                    }
                    document.execCommand('insertText', false, '/')
                  })
                }}>
                <SquareSlash className="size-4" />
              </button>
              <button
                type="button"
                className={ICON_BTN}
                aria-label="Tags"
                onClick={() => insertTrigger('#')}>
                <Hash className="size-4" />
              </button>
            </>
          }
          right={
            <>
              <button
                type="button"
                className={`rounded-md p-1.5 ${
                  markdownEnabled
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                aria-label="Toggle markdown"
                onClick={() => setMarkdownEnabled((v) => !v)}>
                {markdownEnabled ? <Code className="size-4" /> : <Type className="size-4" />}
              </button>
              <button type="button" className={ICON_BTN} aria-label="Voice input">
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-1.5 disabled:opacity-50"
                aria-label="Send message"
                disabled={isEmpty}
                onClick={handleSubmit}>
                <ArrowUp className="size-4" />
              </button>
            </>
          }
        />
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Try editing, type <code>@</code> to mention, <code>/</code> for commands, or just hit Enter
      </p>
    </div>
  )
}

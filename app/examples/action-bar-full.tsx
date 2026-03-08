'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PlusCircle,
  AtSign,
  SquareSlash,
  Hash,
  Mic,
  ArrowUp,
  Code,
  Type,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { segmentsToPlainText } from '@/registry/new-york/blocks/prompt-area/prompt-area-engine'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'

const USERS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'strategist', label: 'Strategist', description: 'Campaign planning' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
]

const COMMANDS = [
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'create-slides', label: 'create-slides', description: 'Generate a slide deck' },
]

const TAGS = [
  { value: 'campaign', label: 'campaign' },
  { value: 'lead-gen', label: 'lead-gen' },
  { value: 'conversion', label: 'conversion' },
]

function isSegmentsEmpty(segments: Segment[]): boolean {
  return (
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')
  )
}

const ICON_BUTTON_CLASS =
  'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'
const SEND_BUTTON_CLASS =
  'rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
const MENU_ITEM_CLASS = 'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent'

const ACTION_BAR_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

export function ActionBarFullExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [markdownEnabled, setMarkdownEnabled] = useState(false)
  const [submitted, setSubmitted] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

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
    if (isSegmentsEmpty(segments)) return
    setSubmitted(segmentsToPlainText(segments))
    promptRef.current?.clear()
    setSegments([])
  }, [segments])

  const insertTrigger = useCallback((char: string) => {
    promptRef.current?.focus()
    requestAnimationFrame(() => {
      document.execCommand('insertText', false, char)
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border p-4">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          triggers={ACTION_BAR_TRIGGERS}
          placeholder="Type a message..."
          onSubmit={handleSubmit}
          markdown={markdownEnabled}
          autoGrow
          minHeight={48}
          maxHeight={320}
        />
        <ActionBar
          left={
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  aria-label="Attach"
                  onClick={() => setMenuOpen((v) => !v)}>
                  <PlusCircle className="size-4" />
                </button>
                {menuOpen && (
                  <div className="bg-popover absolute top-full left-0 z-10 mt-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      onClick={() => setMenuOpen(false)}>
                      <Upload className="size-4" />
                      Upload file
                    </button>
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      onClick={() => setMenuOpen(false)}>
                      <ImageIcon className="size-4" />
                      Upload image
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={ICON_BUTTON_CLASS}
                aria-label="Mention"
                onClick={() => insertTrigger('@')}>
                <AtSign className="size-4" />
              </button>
              <button
                type="button"
                className={ICON_BUTTON_CLASS}
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
                className={ICON_BUTTON_CLASS}
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
              <button type="button" className={ICON_BUTTON_CLASS} aria-label="Voice input">
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                className={SEND_BUTTON_CLASS}
                aria-label="Send message"
                disabled={isEmpty}
                onClick={handleSubmit}>
                <ArrowUp className="size-4" />
              </button>
            </>
          }
        />
      </div>
      {submitted && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}
    </div>
  )
}

export const actionBarFullCode = `import { useCallback, useRef, useState } from 'react'
import { PlusCircle, AtSign, SquareSlash, Hash, Mic, ArrowUp, Code, Type } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import type { Segment, TriggerConfig, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

const triggers: TriggerConfig[] = [
  { char: '@', position: 'any', mode: 'dropdown', onSearch: (q) => USERS.filter(...) },
  { char: '/', position: 'start', mode: 'dropdown', chipStyle: 'inline', onSearch: (q) => COMMANDS.filter(...) },
  { char: '#', position: 'any', mode: 'dropdown', resolveOnSpace: true, onSearch: (q) => TAGS.filter(...) },
]

function ActionBarFullExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [markdownEnabled, setMarkdownEnabled] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  const handleSubmit = useCallback(() => {
    if (isEmpty) return
    promptRef.current?.clear()
    setSegments([])
  }, [isEmpty])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        ref={promptRef}
        value={segments}
        onChange={setSegments}
        triggers={triggers}
        placeholder="Type a message..."
        onSubmit={handleSubmit}
        markdown={markdownEnabled}
        autoGrow
        minHeight={48}
        maxHeight={320}
      />
      <ActionBar
        left={
          <>
            <button aria-label="Attach"><PlusCircle className="size-4" /></button>
            <button aria-label="Mention" onClick={() => insertTrigger('@')}><AtSign className="size-4" /></button>
            <button aria-label="Commands"><SquareSlash className="size-4" /></button>
            <button aria-label="Tags" onClick={() => insertTrigger('#')}><Hash className="size-4" /></button>
          </>
        }
        right={
          <>
            <button aria-label="Toggle markdown" onClick={() => setMarkdownEnabled((v) => !v)}>
              {markdownEnabled ? <Code className="size-4" /> : <Type className="size-4" />}
            </button>
            <button aria-label="Voice"><Mic className="size-4" /></button>
            <button aria-label="Send" disabled={isEmpty} onClick={handleSubmit}>
              <ArrowUp className="size-4" />
            </button>
          </>
        }
      />
    </div>
  )
}`

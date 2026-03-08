'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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
  ChevronDown,
  Map,
  Globe,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
  PromptAreaFile,
} from '@/registry/new-york/blocks/prompt-area/types'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import { USERS, COMMANDS, TAGS } from './mock-data'

const DEMO_INITIAL_SEGMENTS: Segment[] = [
  { type: 'chip', trigger: '/', value: 'summarize', displayText: 'summarize' },
  { type: 'text', text: ' the campaign brief from ' },
  { type: 'chip', trigger: '@', value: 'strategist', displayText: 'Strategist' },
  { type: 'text', text: ' and ' },
  { type: 'chip', trigger: '@', value: 'copywriter', displayText: 'Copywriter' },
  { type: 'text', text: '. Tag anything marked ' },
  { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
  {
    type: 'text',
    text: ' and format the output as:\n- **Key messages** for the target audience\n- *Action items* assigned to each agent\n- Open questions for follow-up',
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

const DEMO_FILES: PromptAreaFile[] = [
  {
    id: 'demo-file-1',
    name: 'Q4-2025-financial-report.pdf',
    size: 3_420_000,
    type: 'application/pdf',
  },
]

const MODELS = [
  { id: 'opus', label: 'Opus 4.6', icon: '/claude-icon.svg' },
  { id: 'gpt', label: 'GPT 5.4', icon: '/openai-icon.svg' },
] as const

const ICON_BTN = 'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'
const MENU_ITEM = 'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent'

export function DemoSection() {
  const [segments, setSegments] = useState<Segment[]>(DEMO_INITIAL_SEGMENTS)
  const [files, setFiles] = useState<PromptAreaFile[]>(DEMO_FILES)
  const [markdownEnabled, setMarkdownEnabled] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<(typeof MODELS)[number]>(MODELS[0])
  const promptRef = useRef<PromptAreaHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  useEffect(() => {
    if (!menuOpen && !modelMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (
        modelMenuOpen &&
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setModelMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, modelMenuOpen])

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
      <div className="rounded-xl border shadow-sm">
        <div className="p-4">
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
            files={files}
            filePosition="above"
            onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
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
                      <button
                        type="button"
                        className={MENU_ITEM}
                        onClick={() => setMenuOpen(false)}>
                        <Upload className="size-4" />
                        Upload file
                      </button>
                      <button
                        type="button"
                        className={MENU_ITEM}
                        onClick={() => setMenuOpen(false)}>
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
        <StatusBar
          className="rounded-b-xl border-t px-4 py-2"
          left={
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <Map className="size-3.5" />
                <span>Plan</span>
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <Globe className="size-3.5" />
                <span>WebSearch</span>
              </button>
            </div>
          }
          right={
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                onClick={() => setModelMenuOpen((v) => !v)}>
                <Image
                  src={selectedModel.icon}
                  alt=""
                  width={14}
                  height={14}
                  className="dark:invert"
                />
                <span>{selectedModel.label}</span>
                <ChevronDown className="size-3" />
              </button>
              {modelMenuOpen && (
                <div className="bg-popover absolute right-0 bottom-full z-10 mb-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      className={`${MENU_ITEM} ${model.id === selectedModel.id ? 'bg-accent' : ''}`}
                      onClick={() => {
                        setSelectedModel(model)
                        setModelMenuOpen(false)
                      }}>
                      <Image
                        src={model.icon}
                        alt=""
                        width={14}
                        height={14}
                        className="dark:invert"
                      />
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Try editing, type <code>@</code> to mention, <code>/</code> for commands, or just hit Enter
      </p>
    </div>
  )
}

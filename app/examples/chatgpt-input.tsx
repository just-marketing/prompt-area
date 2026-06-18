'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, Mic, AudioLines, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PromptArea,
  isSegmentsEmpty,
  type Segment,
  type TriggerConfig,
  type PromptAreaFile,
} from 'prompt-area'
import { useSubmittablePrompt } from './use-submittable-prompt'
import { SubmittedPreview } from './submitted-preview'

// ---------------------------------------------------------------------------
// Option data (representative placeholders)
// ---------------------------------------------------------------------------

const MODELS = ['Instant', 'Thinking', 'Pro'] as const
type Model = (typeof MODELS)[number]
const LATEST_VERSION = '5.5'

// The vivid blue ChatGPT uses for the voice / primary affordance.
const ACCENT = '#0b84ff'

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming
// convention used by the other style examples. Colors are pinned to ChatGPT's
// neutral palette (light + dark) rather than the docs theme so the composer
// reads as ChatGPT on any page.
const ICON_BTN =
  'flex size-9 shrink-0 items-center justify-center rounded-full text-[#5d5d5d] transition-colors hover:bg-black/6 dark:text-[#b4b4b4] dark:hover:bg-white/10'
const PILL =
  'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-[#5d5d5d] transition-colors hover:bg-black/6 dark:text-[#ececec] dark:hover:bg-white/10'
const MENU =
  'absolute right-0 bottom-full z-20 mb-2 flex min-w-[208px] flex-col rounded-2xl border border-black/8 bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#2f2f2f] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
const MENU_ITEM =
  'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#0d0d0d] transition-colors hover:bg-black/6 dark:text-[#ececec] dark:hover:bg-white/8'

// The model selector pill + its flyout. Opens above the composer (which sits at
// the bottom of the chat), mirroring ChatGPT: a muted "Latest • x.x" header, the
// model list, a divider, then "Configure…".
function ModelMenu({
  open,
  setOpen,
  selected,
  onSelect,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  selected: Model
  onSelect: (model: Model) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={PILL}>
        <span className="max-w-40 truncate">{selected}</span>
        <ChevronDown className="-me-0.5 size-3.5 text-[#b4b4b4] dark:text-[#8e8e8e]" />
      </button>
      {open && (
        <div role="menu" className={MENU}>
          <div className="px-3 pt-1.5 pb-1 text-xs text-[#8f8f8f] dark:text-[#8e8e8e]">
            Latest • {LATEST_VERSION}
          </div>
          {MODELS.map((model) => (
            <button
              key={model}
              type="button"
              role="menuitemradio"
              aria-checked={model === selected}
              className={MENU_ITEM}
              onClick={() => {
                onSelect(model)
                setOpen(false)
              }}>
              {model}
            </button>
          ))}
          <div className="mx-2 my-1 h-px bg-black/8 dark:bg-white/10" />
          <button type="button" className={MENU_ITEM} onClick={() => setOpen(false)}>
            Configure...
          </button>
        </div>
      )}
    </div>
  )
}

export function ChatGptInputExample({
  initialSegments = [],
  initialFiles = [],
  triggers,
  markdown = false,
}: {
  initialSegments?: Segment[]
  initialFiles?: PromptAreaFile[]
  triggers?: TriggerConfig[]
  markdown?: boolean
} = {}) {
  const { segments, setSegments, submitted, promptRef, submit, reset } =
    useSubmittablePrompt<PromptAreaFile>({ initialSegments, initialFiles })

  const [model, setModel] = useState<Model>(MODELS[0])
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  // Close the model menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const plusButton = (
    <button type="button" className={ICON_BTN} aria-label="Add files and more">
      <Plus className="size-5" />
    </button>
  )

  // Trailing cluster: model selector, dictation, and the primary button — a blue
  // voice affordance while empty, swapping to a send arrow once there's text.
  const trailing = (
    <div className="flex items-center gap-0.5">
      <ModelMenu open={menuOpen} setOpen={setMenuOpen} selected={model} onSelect={setModel} />
      <button type="button" className={ICON_BTN} aria-label="Dictate">
        <Mic className="size-5" />
      </button>
      {isEmpty ? (
        <button
          type="button"
          aria-label="Start voice mode"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: ACCENT }}>
          <AudioLines className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => submit(segments)}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  )

  // One row, controls inline around the input. The pill grows in height with the
  // content (autoGrow) but never reflows the controls — matching ChatGPT's
  // single-line composer, where the model menu can open over a still-collapsed pill.
  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      <div
        className={cn(
          'relative flex min-h-[52px] cursor-text items-center gap-1 rounded-[28px] py-[5px] ps-[7px] pe-2',
          'bg-white text-[#0d0d0d] transition-colors',
          'border border-black/8 shadow-[0_2px_10px_rgba(0,0,0,0.06)]',
          'dark:border-transparent dark:bg-[#303030] dark:text-[#ececec] dark:shadow-none',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#303030]',
          '[--prompt-area-placeholder:#8f8f8f] dark:[--prompt-area-placeholder:#9a9a9a]',
        )}>
        {plusButton}
        <div className="min-w-0 flex-1 px-1.5" onClick={() => promptRef.current?.focus()}>
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            triggers={triggers}
            placeholder="Ask anything"
            onSubmit={submit}
            markdown={markdown}
            autoGrow
            minHeight={24}
            maxHeight={160}
          />
        </div>
        {trailing}
      </div>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const chatgptInputCode = `import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, Mic, AudioLines, ArrowUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

const MODELS = ['Instant', 'Thinking', 'Pro'] as const
const LATEST_VERSION = '5.5'
const ACCENT = '#0b84ff'

const ICON_BTN = 'flex size-9 shrink-0 items-center justify-center rounded-full text-[#5d5d5d] transition-colors hover:bg-black/6 dark:text-[#b4b4b4] dark:hover:bg-white/10'
const PILL = 'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-[#5d5d5d] transition-colors hover:bg-black/6 dark:text-[#ececec] dark:hover:bg-white/10'
const MENU = 'absolute right-0 bottom-full z-20 mb-2 flex min-w-[208px] flex-col rounded-2xl border border-black/8 bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#2f2f2f]'
const MENU_ITEM = 'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#0d0d0d] transition-colors hover:bg-black/6 dark:text-[#ececec] dark:hover:bg-white/8'

function ChatGptInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<(typeof MODELS)[number]>('Instant')
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const submit = (segs: Segment[]) => {
    if (isSegmentsEmpty(segs)) return
    setSubmitted(segs)
    promptRef.current?.clear()
    setSegments([])
  }
  const reset = () => {
    if (submitted) setSegments(submitted)
    setSubmitted(null)
    promptRef.current?.focus()
  }

  // Close the model menu on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const plusButton = (
    <button className={ICON_BTN} aria-label="Add files and more"><Plus className="size-5" /></button>
  )

  const trailing = (
    <div className="flex items-center gap-0.5">
      {/* Model selector — opens above the composer */}
      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className={PILL}>
          <span className="max-w-40 truncate">{model}</span>
          <ChevronDown className="-me-0.5 size-3.5 text-[#b4b4b4] dark:text-[#8e8e8e]" />
        </button>
        {menuOpen && (
          <div role="menu" className={MENU}>
            <div className="px-3 pt-1.5 pb-1 text-xs text-[#8f8f8f] dark:text-[#8e8e8e]">
              Latest • {LATEST_VERSION}
            </div>
            {MODELS.map((m) => (
              <button key={m} className={MENU_ITEM} onClick={() => { setModel(m); setMenuOpen(false) }}>
                {m}
              </button>
            ))}
            <div className="mx-2 my-1 h-px bg-black/8 dark:bg-white/10" />
            <button className={MENU_ITEM} onClick={() => setMenuOpen(false)}>Configure...</button>
          </div>
        )}
      </div>

      <button className={ICON_BTN} aria-label="Dictate"><Mic className="size-5" /></button>

      {isEmpty ? (
        <button
          aria-label="Start voice mode"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: ACCENT }}>
          <AudioLines className="size-5" />
        </button>
      ) : (
        <button
          onClick={() => submit(segments)}
          aria-label="Send message"
          className="bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors">
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col" ref={rootRef}>
      <div
        className={cn(
          'relative flex min-h-[52px] cursor-text items-center gap-1 rounded-[28px] py-[5px] ps-[7px] pe-2',
          'bg-white text-[#0d0d0d] transition-colors',
          'border border-black/8 shadow-[0_2px_10px_rgba(0,0,0,0.06)]',
          'dark:border-transparent dark:bg-[#303030] dark:text-[#ececec] dark:shadow-none',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#303030]',
          '[--prompt-area-placeholder:#8f8f8f] dark:[--prompt-area-placeholder:#9a9a9a]',
        )}>
        {plusButton}
        <div className="min-w-0 flex-1 px-1.5" onClick={() => promptRef.current?.focus()}>
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            placeholder="Ask anything"
            onSubmit={submit}
            autoGrow
            minHeight={24}
            maxHeight={160}
          />
        </div>
        {trailing}
      </div>

      {submitted && (
        <div className="bg-muted/50 mt-2 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Submitted — clear to send again.</span>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs" aria-label="Reset">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  )
}`

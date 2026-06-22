'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  SlidersHorizontal,
  Telescope,
  SquarePen,
  Image as ImageIcon,
  Clapperboard,
  GraduationCap,
  Check,
  ChevronDown,
  Mic,
  AudioLines,
  ArrowUp,
  X,
  type LucideIcon,
} from 'lucide-react'
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

type GeminiModel = { id: string; name: string; desc: string }

const MODELS: GeminiModel[] = [
  { id: 'gemini-3-pro', name: '3 Pro', desc: 'Reasoning, math & code' },
  { id: 'gemini-3-flash', name: '3 Flash', desc: 'Fast help with everyday tasks' },
  { id: 'gemini-2.5-flash', name: '2.5 Flash', desc: 'Previous fast model' },
]

type Tool = { id: string; label: string; icon: LucideIcon }

const TOOLS: Tool[] = [
  { id: 'research', label: 'Deep Research', icon: Telescope },
  { id: 'canvas', label: 'Canvas', icon: SquarePen },
  { id: 'image', label: 'Create images', icon: ImageIcon },
  { id: 'video', label: 'Create videos', icon: Clapperboard },
  { id: 'learning', label: 'Guided Learning', icon: GraduationCap },
]

// Gemini's primary blue — the send button, the selected-model check, and the
// active-tool accent (lightened to #8ab4f8 in dark mode, matching the product).
const BLUE = '#1a73e8'
// Gemini's brand gradient (blue → purple → pink), used for the Live affordance.
const GEMINI_GRADIENT = 'linear-gradient(135deg, #4285f4 0%, #9168c0 50%, #d96570 100%)'

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming
// convention used by the other style examples. Colors are pinned to Gemini's
// Material palette (light + dark) rather than the docs theme so the composer
// reads as Gemini on any page.
const ICON_BTN =
  'flex size-9 shrink-0 items-center justify-center rounded-full text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const PILL =
  'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const MENU =
  'absolute z-30 flex min-w-[264px] flex-col rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#282a2c] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)]'
const ROW =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
// The blue-tinted chip an active tool collapses into, sitting beside the "+".
const TOOL_CHIP =
  'flex h-9 items-center gap-1.5 rounded-full border border-[#1a73e8]/30 bg-[#1a73e8]/[0.08] pr-1.5 pl-3 text-sm text-[#1a73e8] transition-colors dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/[0.12] dark:text-[#8ab4f8]'

// The "Tools" menu: a flat list of capabilities, each a toggle with a trailing
// check when on. Active tools also surface as chips beside the "+", so the menu
// and the chip row stay in sync.
function ToolsMenu({
  open,
  setOpen,
  active,
  toggle,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  active: Set<string>
  toggle: (id: string) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={PILL}>
        <SlidersHorizontal className="size-4 shrink-0" />
        Tools
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2')}>
          {TOOLS.map(({ id, label, icon: Icon }) => {
            const on = active.has(id)
            return (
              <button
                key={id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                className={ROW}
                onClick={() => toggle(id)}>
                <Icon className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
                <span className="min-w-0 flex-1 text-[14px] text-[#1f1f1f] dark:text-[#e3e3e3]">
                  {label}
                </span>
                {on && <Check className="size-4 shrink-0" style={{ color: BLUE }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// The model selector pill + its flyout, mirroring Gemini's switcher: each row is
// a model name over a muted one-line description, with a blue check on the
// active one.
function ModelMenu({
  open,
  setOpen,
  model,
  onSelect,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  model: GeminiModel
  onSelect: (model: GeminiModel) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-1 rounded-full pr-2.5 pl-3 text-sm text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]">
        <span className="max-w-40 truncate">{model.name}</span>
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'right-0 bottom-full mb-2')}>
          {MODELS.map((m) => {
            const active = m.id === model.id
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={ROW}
                onClick={() => {
                  onSelect(m)
                  setOpen(false)
                }}>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                    {m.name}
                  </div>
                  <div className="text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">{m.desc}</div>
                </div>
                {active && <Check className="size-4 shrink-0" style={{ color: BLUE }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function GeminiInputExample({
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

  const [model, setModel] = useState<GeminiModel>(MODELS[0])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<'tools' | 'model' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const toggleTool = (id: string) =>
    setActiveTools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Close any open menu on outside click or Escape — one root ref covers them all.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      {/* Composer — Gemini's filled, low-contrast surface with a large radius. */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-[28px] transition-colors',
          'bg-[#f0f4f9] text-[#1f1f1f]',
          'dark:bg-[#1e1f20] dark:text-[#e3e3e3]',
          '[--prompt-area-surface:#f0f4f9] dark:[--prompt-area-surface:#1e1f20]',
          '[--prompt-area-placeholder:#5e5e5e] dark:[--prompt-area-placeholder:#969ba1]',
        )}>
        <div className="flex flex-col gap-2 px-4 pt-3.5 pb-2.5">
          <div className="px-1 text-[16px] leading-6">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              triggers={triggers}
              placeholder="Ask Gemini"
              onSubmit={submit}
              markdown={markdown}
              autoGrow
              minHeight={44}
              maxHeight={280}
            />
          </div>

          {/* Controls: add + tools on the left, model + voice cluster on the right */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={ICON_BTN} aria-label="Add files and photos">
              <Plus className="size-5" />
            </button>

            {/* Active tools collapse into removable accent chips */}
            {TOOLS.filter((t) => activeTools.has(t.id)).map(({ id, label, icon: Icon }) => (
              <span key={id} className={TOOL_CHIP}>
                <Icon className="size-4 shrink-0" />
                {label}
                <button
                  type="button"
                  onClick={() => toggleTool(id)}
                  aria-label={`Turn off ${label}`}
                  className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-[#1a73e8]/15 dark:hover:bg-[#8ab4f8]/20">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}

            <ToolsMenu
              open={openMenu === 'tools'}
              setOpen={(next) => setOpenMenu(next ? 'tools' : null)}
              active={activeTools}
              toggle={toggleTool}
            />

            <div className="grow" />

            <ModelMenu
              open={openMenu === 'model'}
              setOpen={(next) => setOpenMenu(next ? 'model' : null)}
              model={model}
              onSelect={setModel}
            />

            <button type="button" className={ICON_BTN} aria-label="Use microphone">
              <Mic className="size-5" />
            </button>

            {/* Gemini Live (gradient) while empty; a blue send button once typing. */}
            {isEmpty ? (
              <button
                type="button"
                aria-label="Open Gemini Live"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                style={{ backgroundImage: GEMINI_GRADIENT }}>
                <AudioLines className="size-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => submit(segments)}
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BLUE }}>
                <ArrowUp className="size-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gemini's footer disclaimer sits under the composer. */}
      <p className="text-center text-xs text-[#5e5e5e] dark:text-[#969ba1]">
        Gemini can make mistakes, so double-check it
      </p>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const geminiInputCode = `import { useEffect, useRef, useState } from 'react'
import {
  Plus, SlidersHorizontal, Telescope, SquarePen, Image as ImageIcon, Clapperboard,
  GraduationCap, Check, ChevronDown, Mic, AudioLines, ArrowUp, X, RotateCcw, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

type GeminiModel = { id: string; name: string; desc: string }
const MODELS: GeminiModel[] = [
  { id: 'gemini-3-pro', name: '3 Pro', desc: 'Reasoning, math & code' },
  { id: 'gemini-3-flash', name: '3 Flash', desc: 'Fast help with everyday tasks' },
  { id: 'gemini-2.5-flash', name: '2.5 Flash', desc: 'Previous fast model' },
]
type Tool = { id: string; label: string; icon: LucideIcon }
const TOOLS: Tool[] = [
  { id: 'research', label: 'Deep Research', icon: Telescope },
  { id: 'canvas', label: 'Canvas', icon: SquarePen },
  { id: 'image', label: 'Create images', icon: ImageIcon },
  { id: 'video', label: 'Create videos', icon: Clapperboard },
  { id: 'learning', label: 'Guided Learning', icon: GraduationCap },
]
const BLUE = '#1a73e8' // send, selected check, active-tool accent
const GEMINI_GRADIENT = 'linear-gradient(135deg, #4285f4 0%, #9168c0 50%, #d96570 100%)'

const ICON_BTN = 'flex size-9 shrink-0 items-center justify-center rounded-full text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const PILL = 'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const MENU = 'absolute z-30 flex min-w-[264px] flex-col rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#282a2c]'
const ROW = 'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
const TOOL_CHIP = 'flex h-9 items-center gap-1.5 rounded-full border border-[#1a73e8]/30 bg-[#1a73e8]/[0.08] pl-3 pr-1.5 text-sm text-[#1a73e8] dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/[0.12] dark:text-[#8ab4f8]'

function GeminiInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<GeminiModel>(MODELS[0])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<'tools' | 'model' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)
  const toggleTool = (id: string) =>
    setActiveTools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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

  // Close any open menu on outside click — one root ref covers them all.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      {/* Composer — Gemini's filled, low-contrast surface with a large radius */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-[28px] transition-colors',
          'bg-[#f0f4f9] text-[#1f1f1f] dark:bg-[#1e1f20] dark:text-[#e3e3e3]',
          '[--prompt-area-surface:#f0f4f9] dark:[--prompt-area-surface:#1e1f20]',
          '[--prompt-area-placeholder:#5e5e5e] dark:[--prompt-area-placeholder:#969ba1]',
        )}>
        <div className="flex flex-col gap-2 px-4 pb-2.5 pt-3.5">
          <div className="px-1 text-[16px] leading-6">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              placeholder="Ask Gemini"
              onSubmit={submit}
              autoGrow
              minHeight={44}
              maxHeight={280}
            />
          </div>

          {/* Controls: add + tools on the left, model + voice cluster on the right */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button className={ICON_BTN} aria-label="Add files and photos"><Plus className="size-5" /></button>

            {/* Active tools collapse into removable accent chips */}
            {TOOLS.filter((t) => activeTools.has(t.id)).map(({ id, label, icon: Icon }) => (
              <span key={id} className={TOOL_CHIP}>
                <Icon className="size-4" />
                {label}
                <button onClick={() => toggleTool(id)} aria-label={\`Turn off \${label}\`} className="flex size-5 items-center justify-center rounded-full hover:bg-[#1a73e8]/15 dark:hover:bg-[#8ab4f8]/20">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}

            {/* Tools menu — toggleable capabilities */}
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')} className={PILL}>
                <SlidersHorizontal className="size-4" /> Tools
              </button>
              {openMenu === 'tools' && (
                <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2')}>
                  {TOOLS.map(({ id, label, icon: Icon }) => {
                    const on = activeTools.has(id)
                    return (
                      <button key={id} role="menuitemcheckbox" aria-checked={on} className={ROW} onClick={() => toggleTool(id)}>
                        <Icon className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" />
                        <span className="min-w-0 flex-1 text-[14px] text-[#1f1f1f] dark:text-[#e3e3e3]">{label}</span>
                        {on && <Check className="size-4" style={{ color: BLUE }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grow" />

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'model' ? null : 'model')}
                className="flex h-9 items-center gap-1 rounded-full pl-3 pr-2.5 text-sm text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]">
                <span className="max-w-40 truncate">{model.name}</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
              {openMenu === 'model' && (
                <div role="menu" className={cn(MENU, 'bottom-full right-0 mb-2')}>
                  {MODELS.map((m) => {
                    const active = m.id === model.id
                    return (
                      <button key={m.id} role="menuitemradio" aria-checked={active} className={ROW} onClick={() => { setModel(m); setOpenMenu(null) }}>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">{m.name}</div>
                          <div className="text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">{m.desc}</div>
                        </div>
                        {active && <Check className="size-4" style={{ color: BLUE }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button className={ICON_BTN} aria-label="Use microphone"><Mic className="size-5" /></button>

            {/* Gemini Live (gradient) while empty; a blue send button once typing */}
            {isEmpty ? (
              <button
                aria-label="Open Gemini Live"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                style={{ backgroundImage: GEMINI_GRADIENT }}>
                <AudioLines className="size-5" />
              </button>
            ) : (
              <button
                onClick={() => submit(segments)}
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BLUE }}>
                <ArrowUp className="size-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gemini's footer disclaimer */}
      <p className="text-center text-xs text-[#5e5e5e] dark:text-[#969ba1]">Gemini can make mistakes, so double-check it</p>

      {submitted && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Submitted — clear to send again.</span>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs" aria-label="Reset">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  )
}`

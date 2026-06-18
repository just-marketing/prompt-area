'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Mic,
  AudioLines,
  ArrowUp,
  X,
  Check,
  Info,
  Pencil,
  GraduationCap,
  Code,
  Coffee,
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

type ClaudeModel = {
  id: string
  name: string
  desc: string
  /** Greyed-out, non-selectable row (e.g. a model that's temporarily down). */
  unavailable?: boolean
}

const MODELS: ClaudeModel[] = [
  { id: 'fable-5', name: 'Fable 5', desc: 'For your toughest challenges', unavailable: true },
  { id: 'opus-4.8', name: 'Opus 4.8', desc: 'For complex tasks' },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', desc: 'Most efficient for everyday tasks' },
  { id: 'haiku-4.5', name: 'Haiku 4.5', desc: 'Fastest for quick answers' },
]

const EFFORTS = ['High', 'Medium', 'Low'] as const
type Effort = (typeof EFFORTS)[number]

const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: 'Write', icon: Pencil },
  { label: 'Learn', icon: GraduationCap },
  { label: 'Code', icon: Code },
  { label: 'Life stuff', icon: Coffee },
]

// The blue Claude uses for the selected-model check.
const ACCENT = '#2c7fff'
// Claude's coral send affordance.
const SEND = '#d97757'

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming
// convention used by the other style examples. Colors are pinned to Claude's
// warm neutral palette (light + dark) rather than the docs theme so the composer
// reads as Claude on any page.
const ICON_BTN =
  'flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5a5851] transition-colors hover:bg-black/[0.06] dark:text-[#c2c0b8] dark:hover:bg-white/[0.08]'
const MENU =
  'absolute right-0 top-full z-30 mt-2 flex w-[320px] flex-col rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#30302e] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)]'
const ROW =
  'flex w-full items-center rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'

// The Google Drive glyph for the "From Drive" chip — its multicolor logo, so it
// stays branded rather than inheriting the chip's text color like the others.
function DriveGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1.85 12.62l.64 1.11c.13.23.32.41.55.55l2.28-3.96H.75c0 .26.07.51.2.74l.9 1.56z"
        fill="#0066DA"
      />
      <path
        d="M8 5.67L5.72 1.72c-.23.13-.42.32-.55.55L.95 9.58c-.13.22-.2.48-.2.74h4.57L8 5.67z"
        fill="#00AC47"
      />
      <path
        d="M12.97 14.28c.22-.13.41-.32.55-.55l.27-.46 1.27-2.2c.13-.23.2-.48.2-.74h-4.57l.97 1.91 1.31 2.04z"
        fill="#EA4335"
      />
      <path
        d="M8 5.67L10.28 1.72c-.22-.13-.48-.2-.74-.2H6.46c-.27 0-.52.08-.74.2L8 5.67z"
        fill="#00832D"
      />
      <path
        d="M10.68 10.32H5.32l-2.28 3.96c.22.13.48.2.74.2h8.44c.27 0 .52-.08.74-.2l-2.28-3.96z"
        fill="#2684FC"
      />
      <path
        d="M12.94 5.92l-2.11-3.65c-.13-.23-.32-.42-.55-.55L8 5.67l2.68 4.65h4.56c0-.26-.07-.51-.2-.74l-2.1-3.66z"
        fill="#FFBA00"
      />
    </svg>
  )
}

// The model selector pill + its flyout. Opens below the pill, mirroring Claude
// in an empty chat: each row is a model name over a muted one-line description,
// with a blue check on the active one and a greyed, non-selectable row for an
// unavailable model. Below a divider sit a cycling "Effort" control and an inert
// "More models" row.
function ModelMenu({
  open,
  setOpen,
  model,
  onSelect,
  effort,
  cycleEffort,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  model: ClaudeModel
  onSelect: (model: ClaudeModel) => void
  effort: Effort
  cycleEffort: () => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1 rounded-lg pr-2 pl-2.5 text-[14px] text-[#1f1e1d] transition-colors hover:bg-black/[0.05] dark:text-[#f5f4ee] dark:hover:bg-white/[0.06]">
        <span className="max-w-40 truncate">
          {model.name}
          <span className="ml-1 text-[#8a887f] dark:text-[#92908a]">{effort}</span>
        </span>
        <ChevronDown className="size-3 opacity-70" />
      </button>
      {open && (
        <div role="menu" className={MENU}>
          {MODELS.map((m) => {
            const active = m.id === model.id
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-disabled={m.unavailable || undefined}
                disabled={m.unavailable}
                className={cn(ROW, 'gap-3', m.unavailable && 'opacity-45 hover:bg-transparent')}
                onClick={() => {
                  if (m.unavailable) return
                  onSelect(m)
                  setOpen(false)
                }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[15px] font-medium text-[#1f1e1d] dark:text-[#f5f4ee]">
                    {m.name}
                    {m.unavailable && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-normal text-[#8a887f] dark:text-[#92908a]">
                        <Info className="size-3" />
                        Currently unavailable
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#8a887f] dark:text-[#92908a]">{m.desc}</div>
                </div>
                {active && <Check className="size-4 shrink-0" style={{ color: ACCENT }} />}
              </button>
            )
          })}

          <div className="mx-2 my-1 h-px bg-black/[0.08] dark:bg-white/10" />

          <button
            type="button"
            className={cn(ROW, 'justify-between text-[14px] text-[#1f1e1d] dark:text-[#f5f4ee]')}
            onClick={cycleEffort}>
            Effort
            <span className="flex items-center gap-1 text-[#8a887f] dark:text-[#92908a]">
              {effort}
              <ChevronRight className="size-3.5" />
            </span>
          </button>

          <div className="mx-2 my-1 h-px bg-black/[0.08] dark:bg-white/10" />

          <button
            type="button"
            className={cn(ROW, 'justify-between text-[14px] text-[#1f1e1d] dark:text-[#f5f4ee]')}
            onClick={() => setOpen(false)}>
            More models
            <ChevronRight className="size-3.5 text-[#8a887f] dark:text-[#92908a]" />
          </button>
        </div>
      )}
    </div>
  )
}

export function ClaudeInputExample({
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

  const [model, setModel] = useState<ClaudeModel>(MODELS[1])
  const [effort, setEffort] = useState<Effort>('High')
  const [menuOpen, setMenuOpen] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)
  const cycleEffort = () =>
    setEffort((prev) => EFFORTS[(EFFORTS.indexOf(prev) + 1) % EFFORTS.length])

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

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      {/* Composer + the notice that peeks out above it */}
      <div className="relative flex flex-col">
        {/* Background notice — sticks up above the composer card, which overlaps
            its bottom edge. Dismissible via the X. */}
        {bannerOpen && (
          <div className="relative z-0 mx-2 -mb-5 flex items-center justify-between gap-3 rounded-t-[20px] border border-b-0 border-black/[0.06] bg-[#f5f3ec] px-4 pt-2.5 pb-7 dark:border-white/[0.07] dark:bg-[#262624]">
            <span className="text-sm font-bold text-[#1f1e1d] dark:text-[#f5f4ee]">
              Claude Fable 5 is currently unavailable.
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                className="text-sm text-[#1f1e1d] underline decoration-black/30 underline-offset-[3px] transition-colors hover:decoration-current dark:text-[#f5f4ee] dark:decoration-white/30">
                Learn more
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setBannerOpen(false)}
                className="flex size-6 items-center justify-center rounded-md text-[#5a5851] transition-colors hover:bg-black/[0.06] dark:text-[#c2c0b8] dark:hover:bg-white/[0.08]">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Foreground composer card */}
        <div
          onClick={() => promptRef.current?.focus()}
          className={cn(
            'relative z-10 cursor-text rounded-[20px] bg-white transition-shadow',
            'shadow-[0_4px_20px_rgba(0,0,0,0.035),0_0_0_0.5px_rgba(0,0,0,0.08)]',
            'hover:shadow-[0_4px_20px_rgba(0,0,0,0.05),0_0_0_0.5px_rgba(0,0,0,0.12)]',
            'focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.07),0_0_0_0.5px_rgba(0,0,0,0.15)]',
            'dark:bg-[#30302e] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]',
            'dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.14)]',
            'dark:focus-within:shadow-[0_0_0_0.5px_rgba(255,255,255,0.18)]',
            '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#30302e]',
            '[--prompt-area-placeholder:#8a887f] dark:[--prompt-area-placeholder:#92908a]',
          )}>
          <div className="flex flex-col gap-3 p-3.5">
            <div className="text-[16px] leading-6 text-[#1f1e1d] dark:text-[#f5f4ee]">
              <PromptArea
                ref={promptRef}
                value={segments}
                onChange={setSegments}
                triggers={triggers}
                placeholder="Paste a doc, an email, or a question to get started"
                onSubmit={submit}
                markdown={markdown}
                autoGrow
                minHeight={48}
                maxHeight={280}
              />
            </div>

            {/* Controls row: add on the left, model + voice cluster on the right */}
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                className={ICON_BTN}
                aria-label="Add files, connectors, and more">
                <Plus className="size-5" />
              </button>

              <div className="grow" />

              <ModelMenu
                open={menuOpen}
                setOpen={setMenuOpen}
                model={model}
                onSelect={setModel}
                effort={effort}
                cycleEffort={cycleEffort}
              />

              <button type="button" className={ICON_BTN} aria-label="Press and hold to record">
                <Mic className="size-5" />
              </button>

              {isEmpty ? (
                <button type="button" className={ICON_BTN} aria-label="Use voice mode">
                  <AudioLines className="size-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submit(segments)}
                  aria-label="Send message"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: SEND }}>
                  <ArrowUp className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested prompt categories */}
      <ul className="flex flex-wrap justify-center gap-2 pt-1" aria-label="Prompt categories">
        {CATEGORIES.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-[#1f1e1d] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#30302e] dark:text-[#f5f4ee] dark:shadow-none dark:hover:bg-white/[0.04]">
              <Icon className="size-[18px] text-[#8a887f] dark:text-[#92908a]" />
              {label}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-[#1f1e1d] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#30302e] dark:text-[#f5f4ee] dark:shadow-none dark:hover:bg-white/[0.04]">
            <DriveGlyph />
            From Drive
          </button>
        </li>
      </ul>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const claudeInputCode = `import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Mic, AudioLines, ArrowUp, X, Check, Info, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

type ClaudeModel = { id: string; name: string; desc: string; unavailable?: boolean }
const MODELS: ClaudeModel[] = [
  { id: 'fable-5', name: 'Fable 5', desc: 'For your toughest challenges', unavailable: true },
  { id: 'opus-4.8', name: 'Opus 4.8', desc: 'For complex tasks' },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', desc: 'Most efficient for everyday tasks' },
  { id: 'haiku-4.5', name: 'Haiku 4.5', desc: 'Fastest for quick answers' },
]
const EFFORTS = ['High', 'Medium', 'Low'] as const
const ACCENT = '#2c7fff' // selected-model check
const SEND = '#d97757'   // coral send affordance

const ICON_BTN = 'flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5a5851] transition-colors hover:bg-black/[0.06] dark:text-[#c2c0b8] dark:hover:bg-white/[0.08]'
const MENU = 'absolute right-0 top-full z-30 mt-2 flex w-[320px] flex-col rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#30302e]'
const ROW = 'flex w-full items-center rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'

function ClaudeInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<ClaudeModel>(MODELS[1])
  const [effort, setEffort] = useState<(typeof EFFORTS)[number]>('High')
  const [menuOpen, setMenuOpen] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)
  const cycleEffort = () => setEffort((p) => EFFORTS[(EFFORTS.indexOf(p) + 1) % EFFORTS.length])

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

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      <div className="relative flex flex-col">
        {/* Notice that peeks out above the composer card */}
        {bannerOpen && (
          <div className="relative z-0 mx-2 -mb-5 flex items-center justify-between gap-3 rounded-t-[20px] border border-b-0 border-black/[0.06] bg-[#f5f3ec] px-4 pb-7 pt-2.5 dark:border-white/[0.07] dark:bg-[#262624]">
            <span className="text-sm font-bold text-[#1f1e1d] dark:text-[#f5f4ee]">Claude Fable 5 is currently unavailable.</span>
            <div className="flex shrink-0 items-center gap-3">
              <button className="text-sm underline decoration-black/30 underline-offset-[3px] hover:decoration-current">Learn more</button>
              <button aria-label="Dismiss" onClick={() => setBannerOpen(false)} className="flex size-6 items-center justify-center rounded-md hover:bg-black/[0.06] dark:hover:bg-white/[0.08]">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Foreground composer card */}
        <div
          onClick={() => promptRef.current?.focus()}
          className={cn(
            'relative z-10 cursor-text rounded-[20px] bg-white transition-shadow',
            'shadow-[0_4px_20px_rgba(0,0,0,0.035),0_0_0_0.5px_rgba(0,0,0,0.08)]',
            'focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.07),0_0_0_0.5px_rgba(0,0,0,0.15)]',
            'dark:bg-[#30302e] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]',
            '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#30302e]',
            '[--prompt-area-placeholder:#8a887f] dark:[--prompt-area-placeholder:#92908a]',
          )}>
          <div className="flex flex-col gap-3 p-3.5">
            <div className="text-[16px] leading-6 text-[#1f1e1d] dark:text-[#f5f4ee]">
              <PromptArea
                ref={promptRef}
                value={segments}
                onChange={setSegments}
                placeholder="Paste a doc, an email, or a question to get started"
                onSubmit={submit}
                autoGrow
                minHeight={48}
                maxHeight={280}
              />
            </div>

            {/* Controls: add on the left, model + voice cluster on the right */}
            <div className="flex w-full items-center gap-2">
              <button className={ICON_BTN} aria-label="Add files, connectors, and more"><Plus className="size-5" /></button>
              <div className="grow" />

              {/* Model selector — opens below the pill */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-8 items-center gap-1 rounded-lg pl-2.5 pr-2 text-[14px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
                  <span className="max-w-40 truncate">{model.name}<span className="ml-1 text-[#8a887f] dark:text-[#92908a]">{effort}</span></span>
                  <ChevronDown className="size-3 opacity-70" />
                </button>
                {menuOpen && (
                  <div role="menu" className={MENU}>
                    {MODELS.map((m) => {
                      const active = m.id === model.id
                      return (
                        <button
                          key={m.id}
                          disabled={m.unavailable}
                          className={cn(ROW, 'gap-3', m.unavailable && 'opacity-45 hover:bg-transparent')}
                          onClick={() => { if (!m.unavailable) { setModel(m); setMenuOpen(false) } }}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[15px] font-medium">
                              {m.name}
                              {m.unavailable && (
                                <span className="inline-flex items-center gap-1 text-[12px] font-normal text-[#8a887f] dark:text-[#92908a]">
                                  <Info className="size-3" /> Currently unavailable
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] text-[#8a887f] dark:text-[#92908a]">{m.desc}</div>
                          </div>
                          {active && <Check className="size-4 shrink-0" style={{ color: ACCENT }} />}
                        </button>
                      )
                    })}
                    <div className="mx-2 my-1 h-px bg-black/[0.08] dark:bg-white/10" />
                    <button className={cn(ROW, 'justify-between text-[14px]')} onClick={() => setEffort((p) => EFFORTS[(EFFORTS.indexOf(p) + 1) % EFFORTS.length])}>
                      Effort
                      <span className="flex items-center gap-1 text-[#8a887f] dark:text-[#92908a]">{effort}<ChevronRight className="size-3.5" /></span>
                    </button>
                    <div className="mx-2 my-1 h-px bg-black/[0.08] dark:bg-white/10" />
                    <button className={cn(ROW, 'justify-between text-[14px]')} onClick={() => setMenuOpen(false)}>
                      More models <ChevronRight className="size-3.5 text-[#8a887f] dark:text-[#92908a]" />
                    </button>
                  </div>
                )}
              </div>

              <button className={ICON_BTN} aria-label="Press and hold to record"><Mic className="size-5" /></button>

              {isEmpty ? (
                <button className={ICON_BTN} aria-label="Use voice mode"><AudioLines className="size-5" /></button>
              ) : (
                <button
                  onClick={() => submit(segments)}
                  aria-label="Send message"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: SEND }}>
                  <ArrowUp className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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

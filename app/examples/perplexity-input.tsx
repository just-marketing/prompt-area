'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Monitor,
  ChevronDown,
  ChevronRight,
  Mic,
  AudioLines,
  ArrowUp,
  ArrowRight,
  Lock,
  Paperclip,
  Waypoints,
  Folder,
  Globe,
  Library,
  Check,
  Shuffle,
  Smartphone,
  Telescope,
  Bell,
  Presentation,
  Newspaper,
  CalendarRange,
  Radar,
  Atom,
  Sparkles,
  Asterisk,
  Hexagon,
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

type Mode = 'search' | 'computer'
type ModelRow = { id: string; name: string; icon: LucideIcon; badge?: 'Max' | 'New' }

// The gated "top AI models" list shown under the Search-mode Model picker. Each
// provider gets an evocative monochrome glyph; rows are locked behind an upgrade.
const SEARCH_MODELS: ModelRow[] = [
  { id: 'sonar-2', name: 'Sonar 2', icon: Radar },
  { id: 'gpt-5.4', name: 'GPT-5.4', icon: Atom },
  { id: 'gpt-5.5', name: 'GPT-5.5', icon: Atom, badge: 'Max' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', icon: Sparkles },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', icon: Asterisk },
  { id: 'claude-opus-4.8', name: 'Claude Opus 4.8', icon: Asterisk, badge: 'Max' },
  { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra', icon: Hexagon, badge: 'New' },
]

// The shorter Computer-mode list, surfaced under the "Orchestrator" picker.
const COMPUTER_MODELS: ModelRow[] = [
  { id: 'gpt-5.5', name: 'GPT-5.5', icon: Atom },
  { id: 'claude-opus-4.8', name: 'Claude Opus 4.8', icon: Asterisk },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', icon: Asterisk },
]

const STARTERS: { label: string; icon: LucideIcon }[] = [
  { label: 'Build an app', icon: Smartphone },
  { label: 'Run deep research', icon: Telescope },
  { label: 'Set a reminder', icon: Bell },
  { label: 'Create a slide deck', icon: Presentation },
  { label: 'Send a daily news digest', icon: Newspaper },
  { label: 'Build a Chief of Staff', icon: CalendarRange },
]

const CONNECTORS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'academic', label: 'Academic', icon: Library },
]

// Perplexity's turquoise "super" accent — used for the upgrade rows, the enabled
// connector check, the "New" badge, and the focus glow.
const SUPER = '#20b8cd'

// Shared class fragments, following the per-example ICON_BTN / MENU naming
// convention used by the other style examples. Colors are pinned to Perplexity's
// warm-neutral palette (light + dark) rather than the docs theme so the composer
// reads as Perplexity on any page.
const ICON_BTN =
  'flex h-8 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6b66] transition-colors hover:bg-black/[0.05] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f1]'
const PILL =
  'flex h-8 items-center gap-1 rounded-full px-3 text-sm text-[#6b6b66] transition-colors hover:bg-black/[0.05] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f1]'
const MENU =
  'absolute z-30 flex flex-col rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#1a1c1c] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)]'
const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-[#1f201e] transition-colors hover:bg-black/[0.04] dark:text-[#f3f4f1] dark:hover:bg-white/[0.05]'
// The teal "upgrade" row that headers a gated menu.
const UPSELL =
  'mb-1 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-[#1f201e] transition-colors dark:text-[#f3f4f1]'

// A single locked model row — a provider glyph, the name, an optional badge, and
// a trailing lock. Selecting is gated, so a click just dismisses the menu.
function ModelItem({ row, onSelect }: { row: ModelRow; onSelect: () => void }) {
  const Icon = row.icon
  return (
    <button type="button" role="menuitem" className={MENU_ITEM} onClick={onSelect}>
      <Icon className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
      <span className="min-w-0 flex-1 truncate text-[#8a8a85] dark:text-[#85877f]">{row.name}</span>
      {row.badge && (
        <span
          className={cn(
            'rounded px-1 text-[11px] font-medium',
            row.badge === 'New'
              ? 'text-[#13889a] dark:text-[#20b8cd]'
              : 'text-[#a3a39d] dark:text-[#76786f]',
          )}>
          {row.badge}
        </span>
      )}
      <Lock className="size-3.5 shrink-0 text-[#b4b4ae] dark:text-[#6a6c64]" />
    </button>
  )
}

// The Model / Orchestrator picker. The trigger label and the gated list both
// switch with the active mode (full provider list for Search, a short
// orchestrator list for Computer); only Search shows the upgrade header.
function ModelMenu({
  open,
  setOpen,
  mode,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  mode: Mode
}) {
  const models = mode === 'search' ? SEARCH_MODELS : COMPUTER_MODELS
  return (
    <div className="relative -mr-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={PILL}>
        {mode === 'search' ? 'Model' : 'Orchestrator'}
        <ChevronDown className="-mr-0.5 size-3.5 opacity-70" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'top-full right-0 mt-2 w-[280px]')}>
          {mode === 'search' && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                UPSELL,
                'border-[#20b8cd]/45 bg-[#20b8cd]/[0.07] hover:bg-[#20b8cd]/10',
              )}>
              Access the top AI models
              <ArrowRight className="size-4 shrink-0" style={{ color: SUPER }} />
            </button>
          )}
          {models.map((row) => (
            <ModelItem key={row.id} row={row} onSelect={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  )
}

// The "+" menu: upload, a Connectors fly-out (with its own upgrade row and
// toggleable sources), and Spaces. The submenu opens to the right on hover.
function AddMenu({
  open,
  setOpen,
  onUpload,
  enabled,
  toggleConnector,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  onUpload: () => void
  enabled: Set<string>
  toggleConnector: (id: string) => void
}) {
  // Reset the submenu on every toggle so each open starts collapsed.
  const [subOpen, setSubOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add files or tools"
        onClick={() => {
          setOpen(!open)
          setSubOpen(false)
        }}
        className={ICON_BTN}>
        <Plus className="size-5" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'top-full left-0 mt-2 w-[232px]')}>
          <button
            type="button"
            className={MENU_ITEM}
            onMouseEnter={() => setSubOpen(false)}
            onClick={() => {
              onUpload()
              setOpen(false)
            }}>
            <Paperclip className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
            Upload files or images
          </button>

          {/* Connectors — reveals the sources submenu to the right */}
          <div className="relative" onMouseEnter={() => setSubOpen(true)}>
            <button
              type="button"
              className={cn(
                MENU_ITEM,
                'justify-between',
                subOpen && 'bg-black/[0.04] dark:bg-white/[0.05]',
              )}>
              <span className="flex items-center gap-2.5">
                <Waypoints className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
                Connectors
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#9a9a94] dark:text-[#76786f]" />
            </button>
            {subOpen && (
              <div
                role="menu"
                className={cn(
                  MENU,
                  // Mobile: stack below the row (a side flyout would run off-screen).
                  'top-full left-0 mt-1.5 w-full',
                  // ≥sm: the desktop side flyout, with room to the right.
                  'sm:top-0 sm:left-full sm:mt-0 sm:ml-1.5 sm:w-[268px]',
                )}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={cn(
                    UPSELL,
                    'border-[#20b8cd]/45 bg-[#20b8cd]/[0.07] hover:bg-[#20b8cd]/10',
                  )}>
                  Upgrade to connect more sources
                  <ArrowRight className="size-4 shrink-0" style={{ color: SUPER }} />
                </button>
                {CONNECTORS.map(({ id, label, icon: Icon }) => {
                  const on = enabled.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={on}
                      className={cn(MENU_ITEM, 'justify-between')}
                      onClick={() => toggleConnector(id)}>
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
                        {label}
                      </span>
                      <span
                        className={cn(
                          'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                          on
                            ? 'border-transparent text-white'
                            : 'border-black/20 dark:border-white/25',
                        )}
                        style={on ? { backgroundColor: SUPER } : undefined}>
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            className={cn(MENU_ITEM, 'justify-between')}
            onMouseEnter={() => setSubOpen(false)}
            onClick={() => setOpen(false)}>
            <span className="flex items-center gap-2.5">
              <Folder className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
              Spaces
            </span>
            <ChevronRight className="size-4 shrink-0 text-[#9a9a94] dark:text-[#76786f]" />
          </button>
        </div>
      )}
    </div>
  )
}

export function PerplexityInputExample({
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

  const [mode, setMode] = useState<Mode>('search')
  const [openMenu, setOpenMenu] = useState<'add' | 'model' | null>(null)
  const [connectors, setConnectors] = useState<Set<string>>(new Set(['web']))
  const [starters, setStarters] = useState(STARTERS)
  const [shuffleKey, setShuffleKey] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const toggleConnector = (id: string) =>
    setConnectors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const shuffleStarters = () => {
    setStarters((prev) => [...prev].sort(() => Math.random() - 0.5))
    setShuffleKey((k) => k + 1)
  }

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
    <div className="flex flex-col gap-4" ref={rootRef}>
      <input ref={fileInputRef} type="file" multiple className="hidden" aria-hidden tabIndex={-1} />

      {/* Composer card */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-2xl bg-white transition-[box-shadow,border-color]',
          'border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
          'focus-within:border-[#20b8cd]/55 focus-within:shadow-[0_0_0_3px_rgba(32,184,205,0.10),0_2px_22px_rgba(32,184,205,0.10)]',
          'dark:border-white/[0.08] dark:bg-[#1f2121] dark:shadow-none',
          'dark:focus-within:border-[#20b8cd]/45 dark:focus-within:shadow-[0_0_0_3px_rgba(32,184,205,0.14),0_2px_24px_rgba(32,184,205,0.12)]',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#1f2121]',
          '[--prompt-area-placeholder:#9b9b95] dark:[--prompt-area-placeholder:#6c6e6c]',
        )}>
        <div className="flex flex-col gap-2.5 px-3.5 pt-3.5 pb-2.5">
          <div className="text-[15px] leading-relaxed text-[#1f201e] dark:text-[#f3f4f1]">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              triggers={triggers}
              placeholder={
                mode === 'search'
                  ? ['Ask anything…', 'Type @ for connectors and sources']
                  : 'What should we work on next?'
              }
              onSubmit={submit}
              markdown={markdown}
              minHeight={44}
              maxHeight={240}
            />
          </div>

          {/* Controls: add + mode toggle on the left, model + voice cluster right */}
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2">
              <AddMenu
                open={openMenu === 'add'}
                setOpen={(next) => setOpenMenu(next ? 'add' : null)}
                onUpload={() => fileInputRef.current?.click()}
                enabled={connectors}
                toggleConnector={toggleConnector}
              />

              {/* Segmented mode toggle — the active segment lifts onto a pill and
                  reveals its chevron; the other sits flat on the shared track. */}
              <div className="flex items-center rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                {(
                  [
                    { id: 'search', label: 'Search', icon: Search },
                    { id: 'computer', label: 'Computer', icon: Monitor },
                  ] as const
                ).map(({ id, label, icon: Icon }) => {
                  const active = mode === id
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMode(id)}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                        active
                          ? 'border-black/[0.08] bg-white text-[#1f201e] shadow-sm dark:border-white/10 dark:bg-[#2b2d2d] dark:text-[#f3f4f1]'
                          : 'border-transparent text-[#6b6b66] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:text-[#f3f4f1]',
                      )}>
                      <Icon className="size-3.5 shrink-0" />
                      {label}
                      {active && <ChevronDown className="-mr-1 size-3.5 opacity-70" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <ModelMenu
                open={openMenu === 'model'}
                setOpen={(next) => setOpenMenu(next ? 'model' : null)}
                mode={mode}
              />

              <button type="button" className={ICON_BTN} aria-label="Dictation">
                <Mic className="size-5" />
              </button>

              {/* Inverse-surface affordance: voice while empty, send once typing. */}
              {isEmpty ? (
                <button
                  type="button"
                  aria-label="Use voice mode"
                  className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f201e] text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-[#1f2121]">
                  <AudioLines className="size-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submit(segments)}
                  aria-label="Send message"
                  className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f201e] text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-[#1f2121]">
                  <ArrowUp className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Starter cards — a fade-masked, horizontally scrolling rail + shuffle. */}
      <div className="flex items-center gap-2 px-1">
        <div
          className="-my-1 min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)' }}>
          <div key={shuffleKey} className="flex w-max items-center gap-2">
            {starters.map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                type="button"
                className="animate-in fade-in slide-in-from-bottom-2 flex shrink-0 items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium whitespace-nowrap text-[#1f201e] transition-colors duration-300 hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#1f2121] dark:text-[#f3f4f1] dark:hover:bg-white/[0.04]"
                style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}>
                <Icon className="size-4 shrink-0 text-[#6b6b66] dark:text-[#9a9b98]" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={shuffleStarters}
          className={ICON_BTN}
          aria-label="Shuffle starter cards">
          <Shuffle className="size-4" />
        </button>
      </div>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const perplexityInputCode = `import { useEffect, useRef, useState } from 'react'
import {
  Plus, Search, Monitor, ChevronDown, ChevronRight, Mic, AudioLines, ArrowUp, ArrowRight,
  Lock, Paperclip, Waypoints, Folder, Globe, Library, Check, Shuffle,
  Smartphone, Telescope, Bell, Presentation, Newspaper, CalendarRange,
  Radar, Atom, Sparkles, Asterisk, Hexagon, RotateCcw, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

type Mode = 'search' | 'computer'
type ModelRow = { id: string; name: string; icon: LucideIcon; badge?: 'Max' | 'New' }

const SEARCH_MODELS: ModelRow[] = [
  { id: 'sonar-2', name: 'Sonar 2', icon: Radar },
  { id: 'gpt-5.4', name: 'GPT-5.4', icon: Atom },
  { id: 'gpt-5.5', name: 'GPT-5.5', icon: Atom, badge: 'Max' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', icon: Sparkles },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', icon: Asterisk },
  { id: 'claude-opus-4.8', name: 'Claude Opus 4.8', icon: Asterisk, badge: 'Max' },
  { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra', icon: Hexagon, badge: 'New' },
]
const COMPUTER_MODELS: ModelRow[] = [
  { id: 'gpt-5.5', name: 'GPT-5.5', icon: Atom },
  { id: 'claude-opus-4.8', name: 'Claude Opus 4.8', icon: Asterisk },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', icon: Asterisk },
]
const STARTERS: { label: string; icon: LucideIcon }[] = [
  { label: 'Build an app', icon: Smartphone },
  { label: 'Run deep research', icon: Telescope },
  { label: 'Set a reminder', icon: Bell },
  { label: 'Create a slide deck', icon: Presentation },
  { label: 'Send a daily news digest', icon: Newspaper },
  { label: 'Build a Chief of Staff', icon: CalendarRange },
]
const CONNECTORS = [
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'academic', label: 'Academic', icon: Library },
]
const SUPER = '#20b8cd' // Perplexity turquoise accent

const ICON_BTN = 'flex h-8 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6b66] transition-colors hover:bg-black/[0.05] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f1]'
const PILL = 'flex h-8 items-center gap-1 rounded-full px-3 text-sm text-[#6b6b66] transition-colors hover:bg-black/[0.05] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f1]'
const MENU = 'absolute z-30 flex flex-col rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#1a1c1c]'
const MENU_ITEM = 'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-[#1f201e] transition-colors hover:bg-black/[0.04] dark:text-[#f3f4f1] dark:hover:bg-white/[0.05]'
const UPSELL = 'mb-1 flex items-center justify-between gap-2 rounded-xl border border-[#20b8cd]/45 bg-[#20b8cd]/[0.07] px-3 py-2.5 text-sm font-medium hover:bg-[#20b8cd]/10'

function PerplexityInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [mode, setMode] = useState<Mode>('search')
  const [openMenu, setOpenMenu] = useState<'add' | 'model' | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [connectors, setConnectors] = useState<Set<string>>(new Set(['web']))
  const [starters, setStarters] = useState(STARTERS)
  const [shuffleKey, setShuffleKey] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)
  const models = mode === 'search' ? SEARCH_MODELS : COMPUTER_MODELS
  const toggleConnector = (id: string) =>
    setConnectors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const shuffle = () => {
    setStarters((prev) => [...prev].sort(() => Math.random() - 0.5))
    setShuffleKey((k) => k + 1)
  }

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

  // Close menus on outside click — one root ref covers them all.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  return (
    <div className="flex flex-col gap-4" ref={rootRef}>
      {/* Composer card */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-2xl bg-white transition-[box-shadow,border-color]',
          'border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
          'focus-within:border-[#20b8cd]/55 focus-within:shadow-[0_0_0_3px_rgba(32,184,205,0.10),0_2px_22px_rgba(32,184,205,0.10)]',
          'dark:border-white/[0.08] dark:bg-[#1f2121] dark:shadow-none',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#1f2121]',
          '[--prompt-area-placeholder:#9b9b95] dark:[--prompt-area-placeholder:#6c6e6c]',
        )}>
        <div className="flex flex-col gap-2.5 px-3.5 pt-3.5 pb-2.5">
          <div className="text-[15px] leading-relaxed text-[#1f201e] dark:text-[#f3f4f1]">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              placeholder={mode === 'search' ? ['Ask anything…', 'Type @ for connectors and sources'] : 'What should we work on next?'}
              onSubmit={submit}
              minHeight={44}
              maxHeight={240}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2">
              {/* "+" add menu with a Connectors fly-out */}
              <div className="relative">
                <button onClick={() => { setOpenMenu(openMenu === 'add' ? null : 'add'); setSubOpen(false) }} className={ICON_BTN} aria-label="Add files or tools">
                  <Plus className="size-5" />
                </button>
                {openMenu === 'add' && (
                  <div role="menu" className={cn(MENU, 'top-full left-0 mt-2 w-[232px]')}>
                    <button className={MENU_ITEM} onMouseEnter={() => setSubOpen(false)} onClick={() => setOpenMenu(null)}>
                      <Paperclip className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" /> Upload files or images
                    </button>
                    <div className="relative" onMouseEnter={() => setSubOpen(true)}>
                      <button className={cn(MENU_ITEM, 'justify-between')}>
                        <span className="flex items-center gap-2.5"><Waypoints className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" /> Connectors</span>
                        <ChevronRight className="size-4 text-[#9a9a94] dark:text-[#76786f]" />
                      </button>
                      {subOpen && (
                        <div role="menu" className={cn(MENU, 'top-full left-0 mt-1.5 w-full sm:top-0 sm:left-full sm:mt-0 sm:ml-1.5 sm:w-[268px]')}>
                          <button className={UPSELL} onClick={() => setOpenMenu(null)}>
                            Upgrade to connect more sources
                            <ArrowRight className="size-4" style={{ color: SUPER }} />
                          </button>
                          {CONNECTORS.map(({ id, label, icon: Icon }) => {
                            const on = connectors.has(id)
                            return (
                              <button key={id} className={cn(MENU_ITEM, 'justify-between')} onClick={() => toggleConnector(id)}>
                                <span className="flex items-center gap-2.5"><Icon className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" /> {label}</span>
                                <span className={cn('flex size-[18px] items-center justify-center rounded-[5px] border', on ? 'border-transparent text-white' : 'border-black/20 dark:border-white/25')} style={on ? { backgroundColor: SUPER } : undefined}>
                                  {on && <Check className="size-3" strokeWidth={3} />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <button className={cn(MENU_ITEM, 'justify-between')} onMouseEnter={() => setSubOpen(false)} onClick={() => setOpenMenu(null)}>
                      <span className="flex items-center gap-2.5"><Folder className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" /> Spaces</span>
                      <ChevronRight className="size-4 text-[#9a9a94] dark:text-[#76786f]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Segmented mode toggle */}
              <div className="flex items-center rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                {([{ id: 'search', label: 'Search', icon: Search }, { id: 'computer', label: 'Computer', icon: Monitor }] as const).map(({ id, label, icon: Icon }) => {
                  const active = mode === id
                  return (
                    <button
                      key={id}
                      aria-pressed={active}
                      onClick={() => setMode(id)}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                        active
                          ? 'border-black/[0.08] bg-white text-[#1f201e] shadow-sm dark:border-white/10 dark:bg-[#2b2d2d] dark:text-[#f3f4f1]'
                          : 'border-transparent text-[#6b6b66] hover:text-[#1f201e] dark:text-[#9a9b98] dark:hover:text-[#f3f4f1]',
                      )}>
                      <Icon className="size-3.5" />
                      {label}
                      {active && <ChevronDown className="-mr-1 size-3.5 opacity-70" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {/* Model / Orchestrator picker — gated list, switches with the mode */}
              <div className="relative -mr-1">
                <button onClick={() => setOpenMenu(openMenu === 'model' ? null : 'model')} className={PILL}>
                  {mode === 'search' ? 'Model' : 'Orchestrator'}
                  <ChevronDown className="-mr-0.5 size-3.5 opacity-70" />
                </button>
                {openMenu === 'model' && (
                  <div role="menu" className={cn(MENU, 'top-full right-0 mt-2 w-[280px]')}>
                    {mode === 'search' && (
                      <button className={UPSELL} onClick={() => setOpenMenu(null)}>
                        Access the top AI models
                        <ArrowRight className="size-4" style={{ color: SUPER }} />
                      </button>
                    )}
                    {models.map((row) => {
                      const Icon = row.icon
                      return (
                        <button key={row.id} className={MENU_ITEM} onClick={() => setOpenMenu(null)}>
                          <Icon className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" />
                          <span className="min-w-0 flex-1 truncate text-[#8a8a85] dark:text-[#85877f]">{row.name}</span>
                          {row.badge && (
                            <span className={cn('rounded px-1 text-[11px] font-medium', row.badge === 'New' ? 'text-[#13889a] dark:text-[#20b8cd]' : 'text-[#a3a39d] dark:text-[#76786f]')}>{row.badge}</span>
                          )}
                          <Lock className="size-3.5 text-[#b4b4ae] dark:text-[#6a6c64]" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button className={ICON_BTN} aria-label="Dictation"><Mic className="size-5" /></button>

              {/* Inverse-surface affordance: voice while empty, send once typing */}
              <button
                onClick={() => !isEmpty && submit(segments)}
                aria-label={isEmpty ? 'Use voice mode' : 'Send message'}
                className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f201e] text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-[#1f2121]">
                {isEmpty ? <AudioLines className="size-5" /> : <ArrowUp className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Starter cards — fade-masked scrolling rail + shuffle */}
      <div className="flex items-center gap-2 px-1">
        <div
          className="-my-1 min-w-0 flex-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)' }}>
          <div key={shuffleKey} className="flex w-max items-center gap-2">
            {starters.map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                className="animate-in fade-in slide-in-from-bottom-2 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-[#1f201e] transition-colors duration-300 hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#1f2121] dark:text-[#f3f4f1] dark:hover:bg-white/[0.04]"
                style={{ animationDelay: \`\${i * 75}ms\`, animationFillMode: 'backwards' }}>
                <Icon className="size-4 text-[#6b6b66] dark:text-[#9a9b98]" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={shuffle} className={ICON_BTN} aria-label="Shuffle starter cards"><Shuffle className="size-4" /></button>
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

'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Cloud,
  Plus,
  Mic,
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  Check,
  Settings,
  ExternalLink,
  HelpCircle,
  Laptop,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PromptArea,
  ActionBar,
  StatusBar,
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

type CcModel = { id: string; name: string; shortcut?: string; unavailable?: boolean }

const MODELS: CcModel[] = [
  { id: 'fable-5', name: 'Fable 5', unavailable: true },
  { id: 'opus-4.8', name: 'Opus 4.8', shortcut: '1' },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', shortcut: '2' },
  { id: 'haiku-4.5', name: 'Haiku 4.5', shortcut: '3' },
]

const PERMISSION_MODES = [
  'Ask each time',
  'Accept edits',
  'Plan mode',
  'Bypass permissions',
] as const
type Permission = (typeof PERMISSION_MODES)[number]

const EFFORTS = ['Low', 'Medium', 'High', 'Max'] as const
type Effort = (typeof EFFORTS)[number]

const CLOUD_ENVS = ['Automated Testing Env', 'Default'] as const

const USAGE: { label: string; meta: string; pct: number | null }[] = [
  { label: '5-hour limit', meta: 'Resets 10:00 PM', pct: 7 },
  { label: 'Weekly · all models', meta: 'Resets Jun 21', pct: 21 },
  { label: 'Sonnet only', meta: 'Resets Jun 21', pct: 2 },
  { label: 'Usage credits', meta: '$0.00 of $20.00', pct: null },
]
// Drives the usage donut in the control bar.
const PLAN_PCT = 21

// The blue Claude Code uses for usage meters and the dictation "recording" state.
const ACCENT = '#2c7fff'

// Shared class fragments, following the per-example naming convention. Colors are
// pinned to Claude's warm neutral palette (light + dark) rather than the docs theme
// so the composer reads as Claude Code on any page.
const MUTED = 'text-[#8a887f] dark:text-[#92908a]'
// Filled context chip (repo / environment row, above the input).
const CHIP =
  'inline-flex h-7 items-center gap-1.5 rounded-md bg-black/[0.05] px-2.5 text-[13px] text-[#37352f] transition-colors hover:bg-black/[0.08] aria-[expanded=true]:bg-black/[0.09] dark:bg-white/[0.07] dark:text-[#e8e6df] dark:hover:bg-white/[0.10] dark:aria-[expanded=true]:bg-white/[0.12]'
// Ghost text control (control bar, below the input).
const GHOST =
  'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-[#5a5851] transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] aria-[expanded=true]:bg-black/[0.06] aria-[expanded=true]:text-[#1f1e1d] dark:text-[#b3b1a8] dark:hover:bg-white/[0.07] dark:hover:text-[#f5f4ee] dark:aria-[expanded=true]:bg-white/[0.08] dark:aria-[expanded=true]:text-[#f5f4ee]'
// Ghost icon square.
const GHOST_SQ =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#5a5851] transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] dark:text-[#b3b1a8] dark:hover:bg-white/[0.07] dark:hover:text-[#f5f4ee]'
// Popover panel + menu row.
const PANEL =
  'absolute z-30 flex flex-col rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#30302e] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)]'
const ROW =
  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[14px] text-[#1f1e1d] transition-colors hover:bg-black/[0.05] dark:text-[#f5f4ee] dark:hover:bg-white/[0.06]'
const DIVIDER = 'mx-1 my-1 h-px bg-black/[0.08] dark:bg-white/10'

// One open-state wrapper for every popover so only one is open at a time. The
// `render` prop draws the trigger (each looks different); the panel shares chrome.
function Popover({
  id,
  openMenu,
  setOpenMenu,
  panelClass,
  render,
  children,
}: {
  id: string
  openMenu: string | null
  setOpenMenu: (next: string | null) => void
  panelClass: string
  render: (open: boolean, toggle: () => void) => React.ReactNode
  children: React.ReactNode
}) {
  const open = openMenu === id
  return (
    <div className="relative">
      {render(open, () => setOpenMenu(open ? null : id))}
      {open && (
        <div role="menu" className={cn(PANEL, panelClass)}>
          {children}
        </div>
      )}
    </div>
  )
}

// The small donut in the control bar — a faint track with an accent arc showing
// how much of the plan window is used.
function UsageRing({ pct }: { pct: number }) {
  const r = 5
  const c = 2 * Math.PI * r
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" className="-rotate-90" aria-hidden>
      <circle
        cx="6"
        cy="6"
        r={r}
        fill="none"
        strokeWidth="2"
        stroke="currentColor"
        className="text-black/15 dark:text-white/20"
      />
      <circle
        cx="6"
        cy="6"
        r={r}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ stroke: ACCENT }}
      />
    </svg>
  )
}

// The reasoning-effort control: a discrete Faster↔Smarter slider, mirroring
// Claude Code's popover. Click anywhere on the track or drag the handle — it
// snaps to the nearest level — and arrow keys nudge it for keyboard users.
function EffortSlider({ value, onChange }: { value: Effort; onChange: (next: Effort) => void }) {
  const idx = EFFORTS.indexOf(value)
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = (idx / (EFFORTS.length - 1)) * 100

  // Map a pointer x to the nearest step and commit it if it changed.
  const setFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const next = Math.round(ratio * (EFFORTS.length - 1))
    if (next !== idx) onChange(EFFORTS[next])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = idx
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, idx - 1)
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
      next = Math.min(EFFORTS.length - 1, idx + 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = EFFORTS.length - 1
    else return
    e.preventDefault()
    if (next !== idx) onChange(EFFORTS[next])
  }

  return (
    <div className="w-[232px] p-2">
      <div className="mb-2 flex items-center justify-between text-[14px] text-[#1f1e1d] dark:text-[#f5f4ee]">
        <span>
          Effort <span className="font-medium">{value}</span>
        </span>
        <HelpCircle className={cn('size-3.5', MUTED)} />
      </div>
      <div className={cn('mb-2 flex justify-between text-[12px]', MUTED)}>
        <span>Faster</span>
        <span>Smarter</span>
      </div>
      {/* Hit area is taller than the track so the handle is easy to grab. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Effort"
        aria-valuemin={0}
        aria-valuemax={EFFORTS.length - 1}
        aria-valuenow={idx}
        aria-valuetext={value}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
          setFromClientX(e.clientX)
        }}
        onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
        onPointerUp={(e) => {
          setDragging(false)
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        className="relative mx-1 flex h-5 cursor-pointer touch-none items-center outline-none">
        <div
          ref={trackRef}
          className="relative h-[3px] w-full rounded-full bg-black/12 dark:bg-white/15">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: ACCENT }}
          />
          {EFFORTS.map((e, i) => (
            <span
              key={e}
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 dark:bg-white/30"
              style={{ left: `${(i / (EFFORTS.length - 1)) * 100}%` }}
            />
          ))}
          <span
            className={cn(
              'absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm transition-transform dark:bg-[#30302e]',
              dragging && 'scale-110',
            )}
            style={{ left: `${pct}%`, borderColor: ACCENT }}
          />
        </div>
      </div>
    </div>
  )
}

export function ClaudeCodeInputExample({
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
  const { segments, setSegments, files, setFiles, submitted, promptRef, submit, reset } =
    useSubmittablePrompt<PromptAreaFile>({ initialSegments, initialFiles })

  const [model, setModel] = useState<CcModel>(MODELS[1])
  const [permission, setPermission] = useState<Permission>('Accept edits')
  const [effort, setEffort] = useState<Effort>('High')
  const [environment, setEnvironment] = useState<string>('Default')

  // Single source of truth for which popover is open — only one at a time.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  // Close the open popover on outside click or Escape.
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
    <div className="flex flex-col gap-2" ref={rootRef}>
      {/* Context row: environment + repository, above the input */}
      <StatusBar
        className="px-1 py-0"
        left={
          <div className="flex flex-wrap items-center gap-1.5">
            <Popover
              id="env"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              panelClass="top-full left-0 mt-1.5 w-[264px]"
              render={(open, toggle) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className={CHIP}>
                  <Cloud className="size-3.5" />
                  <span className="max-w-[160px] truncate">{environment}</span>
                </button>
              )}>
              <div className={cn(ROW, 'cursor-default opacity-45 hover:bg-transparent')}>
                <Laptop className="size-4" />
                <span className="flex-1">Local</span>
                <span className={cn('text-[12px]', MUTED)}>Desktop only</span>
              </div>
              <div className={DIVIDER} />
              <div className={cn('px-2.5 pt-1 pb-1 text-[12px]', MUTED)}>Cloud</div>
              {CLOUD_ENVS.map((env) => (
                <button
                  key={env}
                  type="button"
                  className={ROW}
                  onClick={() => {
                    setEnvironment(env)
                    setOpenMenu(null)
                  }}>
                  <Cloud className="size-4" />
                  <span className="flex-1 truncate">{env}</span>
                  {env === environment && <Check className="size-3.5" />}
                  <Settings className={cn('size-3.5', MUTED)} />
                </button>
              ))}
              <button type="button" className={cn(ROW, MUTED)}>
                <Plus className="size-4" />
                Add cloud environment…
              </button>
              <div className={DIVIDER} />
              <div className={cn('px-2.5 pt-1 pb-1 text-[12px]', MUTED)}>Remote Control</div>
              <div className="px-2.5 py-1.5">
                <div className="text-[14px] font-medium text-[#1f1e1d] dark:text-[#f5f4ee]">
                  Set up Remote Control
                </div>
                <div className={cn('mt-0.5 flex items-start gap-1.5 text-[12px]', MUTED)}>
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Run{' '}
                    <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[11px] dark:bg-white/[0.08]">
                      claude rc
                    </code>{' '}
                    on your machine to code from here.
                  </span>
                </div>
              </div>
            </Popover>

            <button type="button" className={CHIP}>
              <Plus className="size-3.5" />
              Select repo…
            </button>
          </div>
        }
      />

      {/* Input box with an inline return/send arrow */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'cursor-text rounded-2xl border border-black/[0.08] bg-white transition-colors',
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-black/[0.16]',
          'dark:border-white/[0.10] dark:bg-[#30302e] dark:shadow-none dark:focus-within:border-white/[0.18]',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#30302e]',
          '[--prompt-area-placeholder:#8a887f] dark:[--prompt-area-placeholder:#92908a]',
        )}>
        <div className="flex items-end gap-1 py-1.5 pr-1.5 pl-3.5">
          <div className="min-w-0 flex-1 py-1.5 text-[16px] leading-6 text-[#1f1e1d] dark:text-[#f5f4ee]">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              triggers={triggers}
              placeholder="Describe a task or ask a question"
              onSubmit={submit}
              markdown={markdown}
              autoGrow
              minHeight={28}
              maxHeight={216}
              files={files}
              filePosition="above"
              onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
            />
          </div>
          <button
            type="button"
            onClick={() => submit(segments)}
            disabled={isEmpty}
            aria-label="Send"
            className={cn(GHOST_SQ, 'self-end disabled:opacity-40 disabled:hover:bg-transparent')}>
            <CornerDownLeft className="size-4" />
          </button>
        </div>
      </div>

      {/* Control bar: permission + dictation on the left, model + effort + usage on the right */}
      <ActionBar
        className="px-1 pt-0"
        left={
          <div className="flex items-center gap-0.5">
            <Popover
              id="permission"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              panelClass="bottom-full left-0 mb-1.5 w-[208px]"
              render={(open, toggle) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className={GHOST}>
                  {permission}
                </button>
              )}>
              {PERMISSION_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={ROW}
                  onClick={() => {
                    setPermission(mode)
                    setOpenMenu(null)
                  }}>
                  <span className="flex-1">{mode}</span>
                  {mode === permission && <Check className="size-3.5" />}
                </button>
              ))}
            </Popover>

            <button type="button" className={GHOST_SQ} aria-label="Add">
              <Plus className="size-4" />
            </button>

            {/* Dictation: press-and-hold mic + a settings chevron, grouped as one pill */}
            <div className="inline-flex h-7 items-center text-[#5a5851] dark:text-[#b3b1a8]">
              <button
                type="button"
                aria-label="Press and hold to record"
                className="flex h-full items-center rounded-l-md pr-1 pl-2 transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] dark:hover:bg-white/[0.07] dark:hover:text-[#f5f4ee]">
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Dictation settings"
                className="flex h-full items-center rounded-r-md pr-1.5 pl-0.5 transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] dark:hover:bg-white/[0.07] dark:hover:text-[#f5f4ee]">
                <ChevronDown className="size-3 opacity-70" />
              </button>
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-0.5">
            <Popover
              id="model"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              panelClass="bottom-full right-0 mb-1.5 w-[236px]"
              render={(open, toggle) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className={GHOST}>
                  {model.name}
                </button>
              )}>
              <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
                <span className={cn('text-[12px]', MUTED)}>Models</span>
                <span className="flex items-center gap-0.5">
                  {['⇧', '⌘', 'I'].map((k) => (
                    <kbd
                      key={k}
                      className={cn(
                        'rounded bg-black/[0.06] px-1 py-0.5 text-[11px] dark:bg-white/[0.08]',
                        MUTED,
                      )}>
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={m.unavailable}
                  className={cn(ROW, m.unavailable && 'opacity-45 hover:bg-transparent')}
                  onClick={() => {
                    if (m.unavailable) return
                    setModel(m)
                    setOpenMenu(null)
                  }}>
                  <span className="flex-1">
                    {m.name}
                    {m.unavailable && (
                      <span className={cn('ml-1.5', MUTED)}>Currently unavailable</span>
                    )}
                  </span>
                  {m.id === model.id && <Check className="size-3.5" />}
                  {m.shortcut && (
                    <span className={cn('w-3 text-right text-[13px]', MUTED)}>{m.shortcut}</span>
                  )}
                </button>
              ))}
              <div className={DIVIDER} />
              <button type="button" className={ROW}>
                <span className="flex-1">More models</span>
                <ChevronRight className={cn('size-3.5', MUTED)} />
              </button>
            </Popover>

            <Popover
              id="effort"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              panelClass="bottom-full right-0 mb-1.5"
              render={(open, toggle) => (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  onClick={toggle}
                  className={GHOST}>
                  {effort}
                </button>
              )}>
              <EffortSlider value={effort} onChange={setEffort} />
            </Popover>

            <Popover
              id="usage"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              panelClass="bottom-full right-0 mb-1.5 w-[300px]"
              render={(open, toggle) => (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-label={`Usage: plan ${PLAN_PCT}%`}
                  onClick={toggle}
                  className={GHOST_SQ}>
                  <UsageRing pct={PLAN_PCT} />
                </button>
              )}>
              <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
                <span className={cn('text-[13px]', MUTED)}>Plan usage</span>
                <ArrowRight className={cn('size-3.5', MUTED)} />
              </div>
              {USAGE.map((u) => (
                <div key={u.label} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#1f1e1d] dark:text-[#f5f4ee]">{u.label}</span>
                    <span className={cn('flex items-center gap-3', MUTED)}>
                      <span>{u.meta}</span>
                      {u.pct != null && <span>{u.pct}%</span>}
                    </span>
                  </div>
                  {u.pct != null && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${u.pct}%`, background: ACCENT }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </Popover>
          </div>
        }
      />

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const claudeCodeInputCode = `import { useEffect, useRef, useState } from 'react'
import { Cloud, Plus, Mic, ChevronDown, ChevronRight, CornerDownLeft, Check, Settings, ExternalLink, HelpCircle, Laptop, ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, ActionBar, StatusBar, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

type CcModel = { id: string; name: string; shortcut?: string; unavailable?: boolean }
const MODELS: CcModel[] = [
  { id: 'fable-5', name: 'Fable 5', unavailable: true },
  { id: 'opus-4.8', name: 'Opus 4.8', shortcut: '1' },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', shortcut: '2' },
  { id: 'haiku-4.5', name: 'Haiku 4.5', shortcut: '3' },
]
const PERMISSION_MODES = ['Ask each time', 'Accept edits', 'Plan mode', 'Bypass permissions'] as const
const EFFORTS = ['Low', 'Medium', 'High', 'Max'] as const
const CLOUD_ENVS = ['Automated Testing Env', 'Default'] as const
const USAGE = [
  { label: '5-hour limit', meta: 'Resets 10:00 PM', pct: 7 },
  { label: 'Weekly · all models', meta: 'Resets Jun 21', pct: 21 },
  { label: 'Sonnet only', meta: 'Resets Jun 21', pct: 2 },
  { label: 'Usage credits', meta: '$0.00 of $20.00', pct: null as number | null },
]
const PLAN_PCT = 21
const ACCENT = '#2c7fff' // usage meters + recording state

const MUTED = 'text-[#8a887f] dark:text-[#92908a]'
const CHIP = 'inline-flex h-7 items-center gap-1.5 rounded-md bg-black/[0.05] px-2.5 text-[13px] text-[#37352f] transition-colors hover:bg-black/[0.08] dark:bg-white/[0.07] dark:text-[#e8e6df] dark:hover:bg-white/[0.10]'
const GHOST = 'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-[#5a5851] transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] aria-[expanded=true]:bg-black/[0.06] dark:text-[#b3b1a8] dark:hover:bg-white/[0.07]'
const GHOST_SQ = 'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#5a5851] transition-colors hover:bg-black/[0.05] hover:text-[#1f1e1d] dark:text-[#b3b1a8] dark:hover:bg-white/[0.07]'
const PANEL = 'absolute z-30 flex flex-col rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#30302e]'
const ROW = 'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[14px] text-[#1f1e1d] transition-colors hover:bg-black/[0.05] dark:text-[#f5f4ee] dark:hover:bg-white/[0.06]'
const DIVIDER = 'mx-1 my-1 h-px bg-black/[0.08] dark:bg-white/10'

// One open-state wrapper for every popover so only one is open at a time.
function Popover({ id, openMenu, setOpenMenu, panelClass, render, children }: {
  id: string; openMenu: string | null; setOpenMenu: (n: string | null) => void
  panelClass: string; render: (open: boolean, toggle: () => void) => React.ReactNode; children: React.ReactNode
}) {
  const open = openMenu === id
  return (
    <div className="relative">
      {render(open, () => setOpenMenu(open ? null : id))}
      {open && <div role="menu" className={cn(PANEL, panelClass)}>{children}</div>}
    </div>
  )
}

function UsageRing({ pct }: { pct: number }) {
  const r = 5, c = 2 * Math.PI * r
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" className="-rotate-90" aria-hidden>
      <circle cx="6" cy="6" r={r} fill="none" strokeWidth="2" stroke="currentColor" className="text-black/15 dark:text-white/20" />
      <circle cx="6" cy="6" r={r} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ stroke: ACCENT }} />
    </svg>
  )
}

// Reasoning-effort control: a discrete Faster↔Smarter slider. Click anywhere on
// the track or drag the handle (snaps to the nearest level); arrows nudge it.
function EffortSlider({ value, onChange }: { value: (typeof EFFORTS)[number]; onChange: (n: (typeof EFFORTS)[number]) => void }) {
  const idx = EFFORTS.indexOf(value)
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = (idx / (EFFORTS.length - 1)) * 100

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const ratio = Math.max(0, Math.min(1, (clientX - el.getBoundingClientRect().left) / el.clientWidth))
    const next = Math.round(ratio * (EFFORTS.length - 1))
    if (next !== idx) onChange(EFFORTS[next])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = idx
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, idx - 1)
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(EFFORTS.length - 1, idx + 1)
    else return
    e.preventDefault()
    if (next !== idx) onChange(EFFORTS[next])
  }

  return (
    <div className="w-[232px] p-2">
      <div className="mb-2 flex items-center justify-between text-[14px]">
        <span>Effort <span className="font-medium">{value}</span></span>
        <HelpCircle className={cn('size-3.5', MUTED)} />
      </div>
      <div className={cn('mb-2 flex justify-between text-[12px]', MUTED)}><span>Faster</span><span>Smarter</span></div>
      <div
        role="slider" tabIndex={0} aria-label="Effort"
        aria-valuemin={0} aria-valuemax={EFFORTS.length - 1} aria-valuenow={idx} aria-valuetext={value}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); setFromClientX(e.clientX) }}
        onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
        onPointerUp={(e) => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId) }}
        className="relative mx-1 flex h-5 cursor-pointer touch-none items-center outline-none">
        <div ref={trackRef} className="relative h-[3px] w-full rounded-full bg-black/12 dark:bg-white/15">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: \`\${pct}%\`, background: ACCENT }} />
          {EFFORTS.map((e, i) => (
            <span key={e} className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 dark:bg-white/30" style={{ left: \`\${(i / (EFFORTS.length - 1)) * 100}%\` }} />
          ))}
          <span className={cn('absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm transition-transform dark:bg-[#30302e]', dragging && 'scale-110')} style={{ left: \`\${pct}%\`, borderColor: ACCENT }} />
        </div>
      </div>
    </div>
  )
}

function ClaudeCodeInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<CcModel>(MODELS[1])
  const [permission, setPermission] = useState<(typeof PERMISSION_MODES)[number]>('Accept edits')
  const [effort, setEffort] = useState<(typeof EFFORTS)[number]>('High')
  const [environment, setEnvironment] = useState('Default')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const submit = (segs: Segment[]) => {
    if (isSegmentsEmpty(segs)) return
    setSubmitted(segs); promptRef.current?.clear(); setSegments([])
  }
  const reset = () => { if (submitted) setSegments(submitted); setSubmitted(null); promptRef.current?.focus() }

  // Close the open popover on outside click.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      {/* Context row: environment + repository */}
      <StatusBar className="px-1 py-0" left={
        <div className="flex flex-wrap items-center gap-1.5">
          <Popover id="env" openMenu={openMenu} setOpenMenu={setOpenMenu} panelClass="top-full left-0 mt-1.5 w-[264px]"
            render={(open, toggle) => (
              <button aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={CHIP}>
                <Cloud className="size-3.5" /><span className="max-w-[160px] truncate">{environment}</span>
              </button>
            )}>
            <div className={cn(ROW, 'cursor-default opacity-45 hover:bg-transparent')}>
              <Laptop className="size-4" /><span className="flex-1">Local</span><span className={cn('text-[12px]', MUTED)}>Desktop only</span>
            </div>
            <div className={DIVIDER} />
            <div className={cn('px-2.5 pt-1 pb-1 text-[12px]', MUTED)}>Cloud</div>
            {CLOUD_ENVS.map((env) => (
              <button key={env} className={ROW} onClick={() => { setEnvironment(env); setOpenMenu(null) }}>
                <Cloud className="size-4" /><span className="flex-1 truncate">{env}</span>
                {env === environment && <Check className="size-3.5" />}<Settings className={cn('size-3.5', MUTED)} />
              </button>
            ))}
            <button className={cn(ROW, MUTED)}><Plus className="size-4" />Add cloud environment…</button>
            <div className={DIVIDER} />
            <div className={cn('px-2.5 pt-1 pb-1 text-[12px]', MUTED)}>Remote Control</div>
            <div className="px-2.5 py-1.5">
              <div className="text-[14px] font-medium">Set up Remote Control</div>
              <div className={cn('mt-0.5 flex items-start gap-1.5 text-[12px]', MUTED)}>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                <span>Run <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[11px] dark:bg-white/[0.08]">claude rc</code> on your machine to code from here.</span>
              </div>
            </div>
          </Popover>
          <button className={CHIP}><Plus className="size-3.5" />Select repo…</button>
        </div>
      } />

      {/* Input box with an inline return/send arrow */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'cursor-text rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-black/[0.16]',
          'dark:border-white/[0.10] dark:bg-[#30302e] dark:focus-within:border-white/[0.18]',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#30302e]',
          '[--prompt-area-placeholder:#8a887f] dark:[--prompt-area-placeholder:#92908a]',
        )}>
        <div className="flex items-end gap-1 py-1.5 pr-1.5 pl-3.5">
          <div className="min-w-0 flex-1 py-1.5 text-[16px] leading-6">
            <PromptArea ref={promptRef} value={segments} onChange={setSegments}
              placeholder="Describe a task or ask a question" onSubmit={submit} autoGrow minHeight={28} maxHeight={216} />
          </div>
          <button onClick={() => submit(segments)} disabled={isEmpty} aria-label="Send"
            className={cn(GHOST_SQ, 'self-end disabled:opacity-40 disabled:hover:bg-transparent')}>
            <CornerDownLeft className="size-4" />
          </button>
        </div>
      </div>

      {/* Control bar */}
      <ActionBar className="px-1 pt-0"
        left={
          <div className="flex items-center gap-0.5">
            <Popover id="permission" openMenu={openMenu} setOpenMenu={setOpenMenu} panelClass="bottom-full left-0 mb-1.5 w-[208px]"
              render={(open, toggle) => <button aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={GHOST}>{permission}</button>}>
              {PERMISSION_MODES.map((mode) => (
                <button key={mode} className={ROW} onClick={() => { setPermission(mode); setOpenMenu(null) }}>
                  <span className="flex-1">{mode}</span>{mode === permission && <Check className="size-3.5" />}
                </button>
              ))}
            </Popover>
            <button className={GHOST_SQ} aria-label="Add"><Plus className="size-4" /></button>
            <div className="inline-flex h-7 items-center text-[#5a5851] dark:text-[#b3b1a8]">
              <button aria-label="Press and hold to record" className="flex h-full items-center rounded-l-md pr-1 pl-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"><Mic className="size-4" /></button>
              <button aria-label="Dictation settings" className="flex h-full items-center rounded-r-md pr-1.5 pl-0.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"><ChevronDown className="size-3 opacity-70" /></button>
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-0.5">
            <Popover id="model" openMenu={openMenu} setOpenMenu={setOpenMenu} panelClass="bottom-full right-0 mb-1.5 w-[236px]"
              render={(open, toggle) => <button aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={GHOST}>{model.name}</button>}>
              <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
                <span className={cn('text-[12px]', MUTED)}>Models</span>
                <span className="flex items-center gap-0.5">
                  {['⇧', '⌘', 'I'].map((k) => <kbd key={k} className={cn('rounded bg-black/[0.06] px-1 py-0.5 text-[11px] dark:bg-white/[0.08]', MUTED)}>{k}</kbd>)}
                </span>
              </div>
              {MODELS.map((m) => (
                <button key={m.id} disabled={m.unavailable} className={cn(ROW, m.unavailable && 'opacity-45 hover:bg-transparent')}
                  onClick={() => { if (!m.unavailable) { setModel(m); setOpenMenu(null) } }}>
                  <span className="flex-1">{m.name}{m.unavailable && <span className={cn('ml-1.5', MUTED)}>Currently unavailable</span>}</span>
                  {m.id === model.id && <Check className="size-3.5" />}
                  {m.shortcut && <span className={cn('w-3 text-right text-[13px]', MUTED)}>{m.shortcut}</span>}
                </button>
              ))}
              <div className={DIVIDER} />
              <button className={ROW}><span className="flex-1">More models</span><ChevronRight className={cn('size-3.5', MUTED)} /></button>
            </Popover>

            <Popover id="effort" openMenu={openMenu} setOpenMenu={setOpenMenu} panelClass="bottom-full right-0 mb-1.5"
              render={(open, toggle) => <button aria-haspopup="dialog" aria-expanded={open} onClick={toggle} className={GHOST}>{effort}</button>}>
              <EffortSlider value={effort} onChange={setEffort} />
            </Popover>

            <Popover id="usage" openMenu={openMenu} setOpenMenu={setOpenMenu} panelClass="bottom-full right-0 mb-1.5 w-[300px]"
              render={(open, toggle) => (
                <button aria-haspopup="dialog" aria-expanded={open} aria-label={\`Usage: plan \${PLAN_PCT}%\`} onClick={toggle} className={GHOST_SQ}>
                  <UsageRing pct={PLAN_PCT} />
                </button>
              )}>
              <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5"><span className={cn('text-[13px]', MUTED)}>Plan usage</span><ArrowRight className={cn('size-3.5', MUTED)} /></div>
              {USAGE.map((u) => (
                <div key={u.label} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span>{u.label}</span>
                    <span className={cn('flex items-center gap-3', MUTED)}><span>{u.meta}</span>{u.pct != null && <span>{u.pct}%</span>}</span>
                  </div>
                  {u.pct != null && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div className="h-full rounded-full" style={{ width: \`\${u.pct}%\`, background: ACCENT }} />
                    </div>
                  )}
                </div>
              ))}
            </Popover>
          </div>
        }
      />

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

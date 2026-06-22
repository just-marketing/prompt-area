'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Plus,
  X,
  Paperclip,
  Ellipsis,
  Images,
  Code,
  NotebookText,
  ImagePlus,
  Clapperboard,
  SquarePen,
  Telescope,
  Music2,
  GraduationCap,
  Check,
  ChevronDown,
  ChevronRight,
  Mic,
  ArrowUp,
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

type GeminiModel = { id: string; name: string; desc: string; tier: string }

// The pill shows the short `tier`; the menu lists the full name over a
// one-line description, with a check on the active model.
const MODELS: GeminiModel[] = [
  { id: 'flash-lite', name: '3.1 Flash-Lite', desc: 'Fastest answers', tier: 'Flash-Lite' },
  { id: 'flash', name: '3.5 Flash', desc: 'All-around help', tier: 'Flash' },
  { id: 'pro', name: '3.1 Pro', desc: 'Advanced math and code', tier: 'Pro' },
]

type Thinking = { id: string; label: string; desc: string }
const THINKING: Thinking[] = [
  { id: 'standard', label: 'Standard', desc: 'Best for most questions' },
  { id: 'extended', label: 'Extended', desc: 'Complex problem solving' },
]

type MenuTool = { id: string; label: string; icon: LucideIcon; badge?: string }

// The creative tools, split as Gemini groups them: a primary set plus a
// "More tools" fly-out. Selecting one toggles it into a chip under the input.
const TOOLS: MenuTool[] = [
  { id: 'image', label: 'Create image', icon: ImagePlus, badge: 'New' },
  { id: 'video', label: 'Create video', icon: Clapperboard },
  { id: 'canvas', label: 'Canvas', icon: SquarePen },
]
const MORE_TOOLS: MenuTool[] = [
  { id: 'research', label: 'Deep research', icon: Telescope },
  { id: 'music', label: 'Create music', icon: Music2, badge: 'New' },
  { id: 'learning', label: 'Guided learning', icon: GraduationCap },
]
const ALL_TOOLS = [...TOOLS, ...MORE_TOOLS]

// The "More uploads" fly-out (upload actions are one-shot, not toggles).
const MORE_UPLOADS: MenuTool[] = [
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'code', label: 'Import code', icon: Code },
  { id: 'notebooks', label: 'Notebooks', icon: NotebookText },
]

// Gemini's primary blue — the selected check, the active-tool accent, and the
// send button (lightened to #8ab4f8 in dark mode, matching the product).
const BLUE = '#1a73e8'

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming
// convention used by the other style examples. Colors are pinned to Gemini's
// Material palette (light + dark) rather than the docs theme so the composer
// reads as Gemini on any page.
const ICON_BTN =
  'flex size-11 shrink-0 items-center justify-center rounded-full text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const MENU =
  'absolute z-30 flex min-w-[248px] flex-col rounded-3xl border border-black/[0.06] bg-white p-2 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#282a2c] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)]'
const ROW =
  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] text-[#1f1f1f] transition-colors hover:bg-black/[0.05] dark:text-[#e3e3e3] dark:hover:bg-white/[0.06]'
// A "•••" submenu trigger that stays highlighted while its fly-out is open.
const SUB_ROW = 'justify-between'
const NEW_BADGE =
  'rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[11px] leading-none font-medium text-[#444746] dark:bg-white/[0.1] dark:text-[#c4c7c5]'

// Google Drive's multicolor mark for the "Add from Drive" row — it stays branded
// rather than inheriting the row's text color like the monochrome glyphs.
function DriveGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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

// A fly-out submenu: stacks below its trigger on mobile (a side panel would run
// off-screen) and swings out to the right from ≥sm.
function SubMenu({ children }: { children: ReactNode }) {
  return (
    <div
      role="menu"
      className={cn(
        MENU,
        'top-full left-0 mt-1.5 w-full',
        'sm:top-0 sm:left-full sm:mt-0 sm:ml-2 sm:w-[260px]',
      )}>
      {children}
    </div>
  )
}

// The "+" (Upload & tools) menu — uploads up top, a "More uploads" fly-out, then
// the creative tools and a "More tools" fly-out. Tools toggle; uploads are
// one-shot and just dismiss.
function PlusMenu({
  open,
  setOpen,
  activeTools,
  toggleTool,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  activeTools: Set<string>
  toggleTool: (id: string) => void
}) {
  // Reset on every toggle so each open starts with no fly-out showing.
  const [sub, setSub] = useState<'uploads' | 'tools' | null>(null)

  const toolRow = ({ id, label, icon: Icon, badge }: MenuTool) => {
    const on = activeTools.has(id)
    return (
      <button
        key={id}
        type="button"
        role="menuitemcheckbox"
        aria-checked={on}
        className={ROW}
        onClick={() => {
          toggleTool(id)
          setOpen(false)
        }}>
        <Icon className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
        <span className="min-w-0 flex-1">{label}</span>
        {badge && <span className={NEW_BADGE}>{badge}</span>}
        {on && <Check className="size-4 shrink-0" style={{ color: BLUE }} />}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Upload & tools"
        onClick={() => {
          setOpen(!open)
          setSub(null)
        }}
        className={ICON_BTN}>
        {open ? <X className="size-6" /> : <Plus className="size-6" />}
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2')}>
          <button
            type="button"
            className={ROW}
            onMouseEnter={() => setSub(null)}
            onClick={() => setOpen(false)}>
            <Paperclip className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
            Upload files
          </button>
          <button
            type="button"
            className={ROW}
            onMouseEnter={() => setSub(null)}
            onClick={() => setOpen(false)}>
            <DriveGlyph />
            Add from Drive
          </button>

          {/* More uploads — Photos / Import code / Notebooks */}
          <div className="relative" onMouseEnter={() => setSub('uploads')}>
            <button
              type="button"
              className={cn(
                ROW,
                SUB_ROW,
                sub === 'uploads' && 'bg-black/[0.05] dark:bg-white/[0.06]',
              )}>
              <span className="flex items-center gap-3">
                <Ellipsis className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
                More uploads
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#9aa0a6]" />
            </button>
            {sub === 'uploads' && (
              <SubMenu>
                {MORE_UPLOADS.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" className={ROW} onClick={() => setOpen(false)}>
                    <Icon className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
                    {label}
                  </button>
                ))}
              </SubMenu>
            )}
          </div>

          <div className="mx-3 my-1.5 h-px bg-black/[0.08] dark:bg-white/10" />

          {TOOLS.map(toolRow)}

          {/* More tools — Deep research / Create music / Guided learning */}
          <div className="relative" onMouseEnter={() => setSub('tools')}>
            <button
              type="button"
              className={cn(
                ROW,
                SUB_ROW,
                sub === 'tools' && 'bg-black/[0.05] dark:bg-white/[0.06]',
              )}>
              <span className="flex items-center gap-3">
                <Ellipsis className="size-[18px] shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
                More tools
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#9aa0a6]" />
            </button>
            {sub === 'tools' && <SubMenu>{MORE_TOOLS.map(toolRow)}</SubMenu>}
          </div>
        </div>
      )}
    </div>
  )
}

// The model selector pill — shows the tier, opens a model list above with a
// blue check on the active one, plus a "Thinking level" fly-out.
function ModelMenu({
  open,
  setOpen,
  model,
  onSelect,
  thinking,
  setThinking,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  model: GeminiModel
  onSelect: (model: GeminiModel) => void
  thinking: Thinking
  setThinking: (t: Thinking) => void
}) {
  // Reset on every toggle so each open starts with the fly-out collapsed.
  const [sub, setSub] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
          setSub(false)
        }}
        className="flex h-10 items-center gap-1 rounded-full border border-transparent pr-2.5 pl-3.5 text-[15px] text-[#444746] transition-colors hover:bg-black/[0.05] dark:border-white/15 dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]">
        <span className="max-w-32 truncate">{model.tier}</span>
        <ChevronDown className="size-4 opacity-70" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'right-0 bottom-full mb-2 w-[260px]')}>
          {MODELS.map((m) => {
            const active = m.id === model.id
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(ROW, 'gap-3')}
                onMouseEnter={() => setSub(false)}
                onClick={() => {
                  onSelect(m)
                  setOpen(false)
                }}>
                {active ? (
                  <Check className="size-[18px] shrink-0" style={{ color: BLUE }} />
                ) : (
                  <span className="size-[18px] shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{m.name}</span>
                  <span className="block text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">
                    {m.desc}
                  </span>
                </span>
              </button>
            )
          })}

          <div className="mx-3 my-1.5 h-px bg-black/[0.08] dark:bg-white/10" />

          {/* Thinking level — Standard / Extended */}
          <div className="relative" onMouseEnter={() => setSub(true)}>
            <button
              type="button"
              className={cn(ROW, SUB_ROW, sub && 'bg-black/[0.05] dark:bg-white/[0.06]')}>
              <span className="flex flex-col">
                Thinking level
                <span className="text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">
                  {thinking.label}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#9aa0a6]" />
            </button>
            {sub && (
              <SubMenu>
                {THINKING.map((t) => {
                  const active = t.id === thinking.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={cn(ROW, 'gap-3')}
                      onClick={() => {
                        setThinking(t)
                        setOpen(false)
                      }}>
                      {active ? (
                        <Check className="size-[18px] shrink-0" style={{ color: BLUE }} />
                      ) : (
                        <span className="size-[18px] shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{t.label}</span>
                        <span className="block text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">
                          {t.desc}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </SubMenu>
            )}
          </div>
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

  const [model, setModel] = useState<GeminiModel>(MODELS[2])
  const [thinking, setThinking] = useState<Thinking>(THINKING[0])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<'plus' | 'model' | null>(null)
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

  const chips = ALL_TOOLS.filter((t) => activeTools.has(t.id))

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      {/* Composer — Gemini's rounded single-line pill that grows a chip row when
          a tool is active. */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-[32px] transition-colors',
          'border border-black/[0.08] bg-white text-[#1f1f1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
          'dark:border-transparent dark:bg-[#1e1f20] dark:text-[#e3e3e3] dark:shadow-none',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#1e1f20]',
          '[--prompt-area-placeholder:#5e5e5e] dark:[--prompt-area-placeholder:#969ba1]',
        )}>
        <div className="flex items-center gap-1 px-2.5 py-[9px]">
          <PlusMenu
            open={openMenu === 'plus'}
            setOpen={(next) => setOpenMenu(next ? 'plus' : null)}
            activeTools={activeTools}
            toggleTool={toggleTool}
          />

          <div className="min-w-0 flex-1 px-1 text-[16px] leading-6">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              triggers={triggers}
              placeholder="Ask Gemini"
              onSubmit={submit}
              markdown={markdown}
              autoGrow
              minHeight={28}
              maxHeight={240}
            />
          </div>

          <ModelMenu
            open={openMenu === 'model'}
            setOpen={(next) => setOpenMenu(next ? 'model' : null)}
            model={model}
            onSelect={setModel}
            thinking={thinking}
            setThinking={setThinking}
          />

          <button type="button" className={ICON_BTN} aria-label="Use microphone">
            <Mic className="size-6" />
          </button>

          {!isEmpty && (
            <button
              type="button"
              onClick={() => submit(segments)}
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}>
              <ArrowUp className="size-6" />
            </button>
          )}
        </div>

        {/* Active tools collapse into removable accent chips under the input. */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
            {chips.map(({ id, label, icon: Icon }) => (
              <span
                key={id}
                className="flex h-8 items-center gap-1.5 rounded-full border border-[#1a73e8]/30 bg-[#1a73e8]/[0.08] pr-1.5 pl-3 text-sm text-[#1a73e8] dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/[0.12] dark:text-[#8ab4f8]">
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
          </div>
        )}
      </div>

      {/* Gemini's footer disclaimer sits under the composer. */}
      <p className="text-center text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">
        Gemini is AI and can make mistakes, including about people.{' '}
        <button
          type="button"
          className="underline underline-offset-2 transition-colors hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]">
          Your privacy &amp; Gemini
        </button>
      </p>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const geminiInputCode = `import { useEffect, useRef, useState } from 'react'
import {
  Plus, X, Paperclip, Ellipsis, Images, Code, NotebookText, ImagePlus, Clapperboard,
  SquarePen, Telescope, Music2, GraduationCap, Check, ChevronDown, ChevronRight,
  Mic, ArrowUp, RotateCcw, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle } from '@/components/types'

type GeminiModel = { id: string; name: string; desc: string; tier: string }
const MODELS: GeminiModel[] = [
  { id: 'flash-lite', name: '3.1 Flash-Lite', desc: 'Fastest answers', tier: 'Flash-Lite' },
  { id: 'flash', name: '3.5 Flash', desc: 'All-around help', tier: 'Flash' },
  { id: 'pro', name: '3.1 Pro', desc: 'Advanced math and code', tier: 'Pro' },
]
type Thinking = { id: string; label: string; desc: string }
const THINKING: Thinking[] = [
  { id: 'standard', label: 'Standard', desc: 'Best for most questions' },
  { id: 'extended', label: 'Extended', desc: 'Complex problem solving' },
]
type MenuTool = { id: string; label: string; icon: LucideIcon; badge?: string }
const TOOLS: MenuTool[] = [
  { id: 'image', label: 'Create image', icon: ImagePlus, badge: 'New' },
  { id: 'video', label: 'Create video', icon: Clapperboard },
  { id: 'canvas', label: 'Canvas', icon: SquarePen },
]
const MORE_TOOLS: MenuTool[] = [
  { id: 'research', label: 'Deep research', icon: Telescope },
  { id: 'music', label: 'Create music', icon: Music2, badge: 'New' },
  { id: 'learning', label: 'Guided learning', icon: GraduationCap },
]
const MORE_UPLOADS: MenuTool[] = [
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'code', label: 'Import code', icon: Code },
  { id: 'notebooks', label: 'Notebooks', icon: NotebookText },
]
const ALL_TOOLS = [...TOOLS, ...MORE_TOOLS]
const BLUE = '#1a73e8' // selected check, active-tool accent, send button

const ICON_BTN = 'flex size-11 shrink-0 items-center justify-center rounded-full text-[#444746] transition-colors hover:bg-black/[0.06] dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]'
const MENU = 'absolute z-30 flex min-w-[248px] flex-col rounded-3xl border border-black/[0.06] bg-white p-2 shadow-[0_12px_36px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#282a2c]'
const ROW = 'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] text-[#1f1f1f] transition-colors hover:bg-black/[0.05] dark:text-[#e3e3e3] dark:hover:bg-white/[0.06]'
const NEW_BADGE = 'rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-medium leading-none text-[#444746] dark:bg-white/[0.1] dark:text-[#c4c7c5]'
// Fly-out: stacks below its trigger on mobile, swings out right from ≥sm.
const SUBMENU = cn(MENU, 'left-0 top-full mt-1.5 w-full sm:left-full sm:top-0 sm:ml-2 sm:mt-0 sm:w-[260px]')

function GeminiInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<GeminiModel>(MODELS[2])
  const [thinking, setThinking] = useState<Thinking>(THINKING[0])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<'plus' | 'model' | null>(null)
  const [plusSub, setPlusSub] = useState<'uploads' | 'tools' | null>(null)
  const [modelSub, setModelSub] = useState(false)
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
  const closeMenus = () => { setOpenMenu(null); setPlusSub(null); setModelSub(false) }

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
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeMenus()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  const toolRow = ({ id, label, icon: Icon, badge }: MenuTool) => {
    const on = activeTools.has(id)
    return (
      <button key={id} role="menuitemcheckbox" aria-checked={on} className={ROW} onClick={() => { toggleTool(id); closeMenus() }}>
        <Icon className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" />
        <span className="min-w-0 flex-1">{label}</span>
        {badge && <span className={NEW_BADGE}>{badge}</span>}
        {on && <Check className="size-4" style={{ color: BLUE }} />}
      </button>
    )
  }

  const chips = ALL_TOOLS.filter((t) => activeTools.has(t.id))

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      {/* Composer — rounded single-line pill that grows a chip row when a tool is active */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-[32px] transition-colors',
          'border border-black/[0.08] bg-white text-[#1f1f1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
          'dark:border-transparent dark:bg-[#1e1f20] dark:text-[#e3e3e3] dark:shadow-none',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#1e1f20]',
          '[--prompt-area-placeholder:#5e5e5e] dark:[--prompt-area-placeholder:#969ba1]',
        )}>
        <div className="flex items-center gap-1 px-2.5 py-[9px]">
          {/* "+" Upload & tools menu — opens above; the trigger flips to an X while open */}
          <div className="relative">
            <button
              onClick={() => { setOpenMenu(openMenu === 'plus' ? null : 'plus'); setPlusSub(null) }}
              className={ICON_BTN}
              aria-label="Upload & tools">
              {openMenu === 'plus' ? <X className="size-6" /> : <Plus className="size-6" />}
            </button>
            {openMenu === 'plus' && (
              <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2')}>
                <button className={ROW} onMouseEnter={() => setPlusSub(null)} onClick={closeMenus}>
                  <Paperclip className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" /> Upload files
                </button>
                <button className={ROW} onMouseEnter={() => setPlusSub(null)} onClick={closeMenus}>
                  <Ellipsis className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" /> Add from Drive
                </button>

                {/* More uploads fly-out */}
                <div className="relative" onMouseEnter={() => setPlusSub('uploads')}>
                  <button className={cn(ROW, 'justify-between', plusSub === 'uploads' && 'bg-black/[0.05] dark:bg-white/[0.06]')}>
                    <span className="flex items-center gap-3"><Ellipsis className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" /> More uploads</span>
                    <ChevronRight className="size-4 text-[#9aa0a6]" />
                  </button>
                  {plusSub === 'uploads' && (
                    <div role="menu" className={SUBMENU}>
                      {MORE_UPLOADS.map(({ id, label, icon: Icon }) => (
                        <button key={id} className={ROW} onClick={closeMenus}>
                          <Icon className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" /> {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mx-3 my-1.5 h-px bg-black/[0.08] dark:bg-white/10" />

                {TOOLS.map(toolRow)}

                {/* More tools fly-out */}
                <div className="relative" onMouseEnter={() => setPlusSub('tools')}>
                  <button className={cn(ROW, 'justify-between', plusSub === 'tools' && 'bg-black/[0.05] dark:bg-white/[0.06]')}>
                    <span className="flex items-center gap-3"><Ellipsis className="size-[18px] text-[#444746] dark:text-[#c4c7c5]" /> More tools</span>
                    <ChevronRight className="size-4 text-[#9aa0a6]" />
                  </button>
                  {plusSub === 'tools' && <div role="menu" className={SUBMENU}>{MORE_TOOLS.map(toolRow)}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 px-1 text-[16px] leading-6">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              placeholder="Ask Gemini"
              onSubmit={submit}
              autoGrow
              minHeight={28}
              maxHeight={240}
            />
          </div>

          {/* Model selector — shows the tier, opens above with a Thinking-level fly-out */}
          <div className="relative">
            <button
              onClick={() => { setOpenMenu(openMenu === 'model' ? null : 'model'); setModelSub(false) }}
              className="flex h-10 items-center gap-1 rounded-full border border-transparent pl-3.5 pr-2.5 text-[15px] text-[#444746] transition-colors hover:bg-black/[0.05] dark:border-white/15 dark:text-[#c4c7c5] dark:hover:bg-white/[0.08]">
              <span className="max-w-32 truncate">{model.tier}</span>
              <ChevronDown className="size-4 opacity-70" />
            </button>
            {openMenu === 'model' && (
              <div role="menu" className={cn(MENU, 'bottom-full right-0 mb-2 w-[260px]')}>
                {MODELS.map((m) => {
                  const active = m.id === model.id
                  return (
                    <button key={m.id} role="menuitemradio" aria-checked={active} className={ROW} onMouseEnter={() => setModelSub(false)} onClick={() => { setModel(m); closeMenus() }}>
                      {active ? <Check className="size-[18px]" style={{ color: BLUE }} /> : <span className="size-[18px]" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{m.name}</span>
                        <span className="block text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">{m.desc}</span>
                      </span>
                    </button>
                  )
                })}

                <div className="mx-3 my-1.5 h-px bg-black/[0.08] dark:bg-white/10" />

                {/* Thinking level fly-out */}
                <div className="relative" onMouseEnter={() => setModelSub(true)}>
                  <button className={cn(ROW, 'justify-between', modelSub && 'bg-black/[0.05] dark:bg-white/[0.06]')}>
                    <span className="flex flex-col">
                      Thinking level
                      <span className="text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">{thinking.label}</span>
                    </span>
                    <ChevronRight className="size-4 text-[#9aa0a6]" />
                  </button>
                  {modelSub && (
                    <div role="menu" className={SUBMENU}>
                      {THINKING.map((t) => {
                        const active = t.id === thinking.id
                        return (
                          <button key={t.id} role="menuitemradio" aria-checked={active} className={ROW} onClick={() => { setThinking(t); closeMenus() }}>
                            {active ? <Check className="size-[18px]" style={{ color: BLUE }} /> : <span className="size-[18px]" />}
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{t.label}</span>
                              <span className="block text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">{t.desc}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className={ICON_BTN} aria-label="Use microphone"><Mic className="size-6" /></button>

          {!isEmpty && (
            <button
              onClick={() => submit(segments)}
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}>
              <ArrowUp className="size-6" />
            </button>
          )}
        </div>

        {/* Active tools collapse into removable accent chips under the input */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
            {chips.map(({ id, label, icon: Icon }) => (
              <span key={id} className="flex h-8 items-center gap-1.5 rounded-full border border-[#1a73e8]/30 bg-[#1a73e8]/[0.08] pl-3 pr-1.5 text-sm text-[#1a73e8] dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/[0.12] dark:text-[#8ab4f8]">
                <Icon className="size-4" />
                {label}
                <button onClick={() => toggleTool(id)} aria-label={\`Turn off \${label}\`} className="flex size-5 items-center justify-center rounded-full hover:bg-[#1a73e8]/15 dark:hover:bg-[#8ab4f8]/20">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gemini's footer disclaimer */}
      <p className="text-center text-[13px] text-[#5e5e5e] dark:text-[#969ba1]">
        Gemini is AI and can make mistakes, including about people.{' '}
        <button type="button" className="underline underline-offset-2 hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]">Your privacy &amp; Gemini</button>
      </p>

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

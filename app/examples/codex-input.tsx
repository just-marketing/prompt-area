'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Plus,
  Hand,
  Zap,
  Mic,
  ArrowUp,
  ChevronDown,
  FolderGit2,
  Laptop,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PromptArea,
  ActionBar,
  isSegmentsEmpty,
  type ChipSegment,
  type Segment,
  type TriggerConfig,
  type PromptAreaFile,
} from 'prompt-area'
import { useSubmittablePrompt } from './use-submittable-prompt'
import { SubmittedPreview } from './submitted-preview'

// ---------------------------------------------------------------------------
// Option data (representative placeholders)
// ---------------------------------------------------------------------------

const PERMISSIONS = ['Default permissions', 'Read only', 'Full access'] as const
type Permission = (typeof PERMISSIONS)[number]

const MODELS = [
  { id: 'gpt-5.5-xhigh', version: '5.5', effort: 'Extra High' },
  { id: 'gpt-5.5-high', version: '5.5', effort: 'High' },
  { id: 'gpt-5.5-medium', version: '5.5', effort: 'Medium' },
  { id: 'gpt-5.1-high', version: '5.1', effort: 'High' },
] as const
type Model = (typeof MODELS)[number]

const REPOS = ['acme-enterprise', 'acme-web', 'acme-infra'] as const
const ENVIRONMENTS = ['Work locally', 'Cloud sandbox', 'Staging'] as const
const BRANCHES = ['cursor/prod-data-memoization-layer', 'main', 'release/2026-06'] as const

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming convention.
const TOOLBAR_PILL =
  'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition-colors'
const ICON_BTN =
  'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex size-8 items-center justify-center rounded-full transition-colors'
const TRAY_PILL =
  'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors'
const MENU =
  'bg-popover absolute z-20 flex max-h-[240px] flex-col overflow-auto rounded-xl border p-1 shadow-md'
const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent'

// One dropdown for every selector in the composer and tray. Collapsing the five
// near-identical menus into a single component keeps the trigger markup, the
// open/close wiring, and the selected-state styling in one place. The `toolbar`
// and `tray` variants only differ in icon/chevron sizing and the trigger pill.
const MENU_VARIANT = {
  toolbar: {
    pill: TOOLBAR_PILL,
    triggerIcon: 'size-4',
    chevron: 'size-3.5 opacity-60',
    itemIcon: 'size-4 shrink-0',
  },
  tray: {
    pill: TRAY_PILL,
    triggerIcon: 'size-3.5 shrink-0',
    chevron: 'size-3 shrink-0 opacity-60',
    itemIcon: 'size-3.5 shrink-0',
  },
} as const

function Menu<T>({
  id,
  openMenu,
  setOpenMenu,
  variant,
  icon: Icon,
  options,
  selected,
  getKey,
  onSelect,
  renderLabel,
  menuClass,
  wrapperClass,
  title,
}: {
  id: string
  openMenu: string | null
  setOpenMenu: (next: string | null) => void
  variant: keyof typeof MENU_VARIANT
  icon: LucideIcon
  options: readonly T[]
  selected: T
  getKey: (value: T) => string
  onSelect: (value: T) => void
  renderLabel: (value: T, inMenu: boolean) => React.ReactNode
  menuClass: string
  wrapperClass?: string
  title?: string
}) {
  const v = MENU_VARIANT[variant]
  const open = openMenu === id
  return (
    <div className={cn('relative', wrapperClass)}>
      <button
        type="button"
        onClick={() => setOpenMenu(open ? null : id)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        className={v.pill}>
        <Icon className={v.triggerIcon} />
        {renderLabel(selected, false)}
        <ChevronDown className={v.chevron} />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, menuClass)}>
          {options.map((option) => {
            const active = getKey(option) === getKey(selected)
            return (
              <button
                key={getKey(option)}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(MENU_ITEM, active && 'bg-accent')}
                onClick={() => {
                  onSelect(option)
                  setOpenMenu(null)
                }}>
                <Icon className={v.itemIcon} />
                {renderLabel(option, true)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CodexInputExample({
  initialSegments = [],
  initialFiles = [],
  triggers,
  markdown = true,
  minHeight = 40,
  onChipClick,
}: {
  initialSegments?: Segment[]
  initialFiles?: PromptAreaFile[]
  triggers?: TriggerConfig[]
  markdown?: boolean
  minHeight?: number
  /**
   * Called when a chip in the composer is clicked. `replaceChip` swaps the
   * clicked chip (matched by trigger + value) for another one in place, so
   * hosts can build pickers on top of chip clicks without owning the
   * segment state.
   */
  onChipClick?: (
    chip: ChipSegment,
    actions: { replaceChip: (next: Omit<ChipSegment, 'type'>) => void },
  ) => void
} = {}) {
  const { segments, setSegments, files, setFiles, submitted, promptRef, submit, reset } =
    useSubmittablePrompt<PromptAreaFile>({ initialSegments, initialFiles })

  const handleChipClick = useCallback(
    (chip: ChipSegment) => {
      if (!onChipClick) return
      onChipClick(chip, {
        replaceChip: (next) =>
          setSegments((prev) => {
            let replaced = false
            return prev.map((seg) => {
              if (
                !replaced &&
                seg.type === 'chip' &&
                seg.trigger === chip.trigger &&
                seg.value === chip.value
              ) {
                replaced = true
                return { ...next, type: 'chip' as const }
              }
              return seg
            })
          }),
      })
    },
    [onChipClick, setSegments],
  )

  const [permission, setPermission] = useState<Permission>(PERMISSIONS[0])
  const [model, setModel] = useState<Model>(MODELS[0])
  const [repo, setRepo] = useState<string>(REPOS[0])
  const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0])
  const [branch, setBranch] = useState<string>(BRANCHES[0])

  // Single source of truth for which dropdown is open — only one at a time.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  // Close the open menu on outside click or Escape. One root ref wraps every
  // dropdown; clicking a different trigger swaps menus.
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
      {/* Stacked composer + context tray */}
      <div className="relative flex flex-col">
        {/* Foreground composer card */}
        <div
          className="bg-card relative z-10 rounded-[24px] border border-[#ececec] shadow-sm [--prompt-area-surface:var(--card)] dark:border-0 dark:bg-[#2d2d2d] dark:shadow-none dark:[--prompt-area-surface:#2d2d2d]"
          style={{ '--prompt-area-placeholder': 'oklch(0.7 0 0)' } as React.CSSProperties}>
          <div className="pt-[13.5px] pr-2 pb-2 pl-[13px]">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              triggers={triggers}
              placeholder="Do anything"
              onSubmit={submit}
              onChipClick={onChipClick ? handleChipClick : undefined}
              markdown={markdown}
              autoGrow
              minHeight={minHeight}
              maxHeight={280}
              files={files}
              filePosition="above"
              onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
            />
            <ActionBar
              className="flex-wrap gap-y-2 pt-2"
              left={
                <div className="flex items-center gap-0.5">
                  <button type="button" className={ICON_BTN} aria-label="Add attachment">
                    <Plus className="size-4" />
                  </button>

                  <Menu<Permission>
                    id="permissions"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    variant="toolbar"
                    icon={Hand}
                    options={PERMISSIONS}
                    selected={permission}
                    getKey={(p) => p}
                    onSelect={setPermission}
                    renderLabel={(p) => p}
                    menuClass="bottom-full left-0 mb-1.5 w-48"
                  />
                </div>
              }
              right={
                <div className="flex items-center gap-0.5">
                  <Menu<Model>
                    id="model"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    variant="toolbar"
                    icon={Zap}
                    options={MODELS}
                    selected={model}
                    getKey={(m) => m.id}
                    onSelect={setModel}
                    renderLabel={(m, inMenu) => (
                      <>
                        <span className="text-foreground font-semibold">{m.version}</span>
                        {inMenu ? (
                          <span className="text-muted-foreground">{m.effort}</span>
                        ) : (
                          m.effort
                        )}
                      </>
                    )}
                    menuClass="right-0 bottom-full mb-1.5 w-52"
                  />

                  <button type="button" className={ICON_BTN} aria-label="Voice input">
                    <Mic className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => submit(segments)}
                    disabled={isEmpty}
                    className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#dadada] disabled:text-[#7a7a7a] dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:disabled:bg-[#969696] dark:disabled:text-[#2d2d2d]"
                    aria-label="Send message">
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              }
            />
          </div>
        </div>

        {/* Background context tray — peeks out below the composer card */}
        <div className="-mt-5 rounded-b-[24px] bg-[#f6f6f6] px-1.5 pt-[27px] pb-[7px] dark:bg-[#1f1f1f]">
          <div className="flex flex-wrap items-center gap-0.5">
            <Menu<string>
              id="repo"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              variant="tray"
              icon={FolderGit2}
              options={REPOS}
              selected={repo}
              getKey={(r) => r}
              onSelect={setRepo}
              renderLabel={(r, inMenu) => (inMenu ? <span className="truncate">{r}</span> : r)}
              menuClass="top-full left-0 mt-1.5 w-56"
            />

            <Menu<string>
              id="environment"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              variant="tray"
              icon={Laptop}
              options={ENVIRONMENTS}
              selected={environment}
              getKey={(env) => env}
              onSelect={setEnvironment}
              renderLabel={(env) => env}
              menuClass="top-full left-0 mt-1.5 w-48"
            />

            <Menu<string>
              id="branch"
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              variant="tray"
              icon={GitBranch}
              options={BRANCHES}
              selected={branch}
              getKey={(b) => b}
              onSelect={setBranch}
              renderLabel={(b) => <span className="min-w-0 truncate">{b}</span>}
              menuClass="top-full left-0 mt-1.5 w-64"
              wrapperClass="min-w-0 max-w-[200px]"
              title={branch}
            />
          </div>
        </div>
      </div>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const codexInputCode = `import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Hand, Zap, Mic, ArrowUp, ChevronDown, FolderGit2, Laptop, GitBranch, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea } from '@/components/prompt-area'
import { ActionBar } from '@/components/action-bar'
import type { Segment, PromptAreaHandle } from '@/components/types'

const TOOLBAR_PILL = 'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition-colors'
const ICON_BTN = 'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex size-8 items-center justify-center rounded-full transition-colors'
const TRAY_PILL = 'text-[#8f9091] hover:bg-accent hover:text-foreground dark:text-muted-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors'
const MENU = 'bg-popover absolute z-20 flex flex-col rounded-xl border p-1 shadow-md'
const MENU_ITEM = 'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent'

function CodexInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState({ version: '5.5', effort: 'Extra High' })
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)
  const toggleMenu = (id: string) => setOpenMenu((cur) => (cur === id ? null : id))

  const submit = (segs: Segment[]) => {
    if (!segs.length) return
    setSubmitted(segs)
    promptRef.current?.clear()
    setSegments([])
  }
  const reset = () => {
    if (submitted) setSegments(submitted)
    setSubmitted(null)
    promptRef.current?.focus()
  }

  // Close the open menu on outside click — one root ref covers every dropdown.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  return (
    <div className="relative flex flex-col" ref={rootRef}>
      {/* Foreground composer */}
      <div
        className="bg-card dark:bg-[#2d2d2d] relative z-10 rounded-[24px] border border-[#ececec] shadow-sm dark:border-0 dark:shadow-none"
        style={{ '--prompt-area-surface': 'var(--card)', '--prompt-area-placeholder': 'oklch(0.7 0 0)' } as React.CSSProperties}>
        <div className="pt-[13.5px] pr-2 pb-2 pl-[13px]">
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            placeholder="Do anything"
            onSubmit={submit}
            markdown
            autoGrow
            minHeight={40}
            maxHeight={280}
          />
          <ActionBar
            className="flex-wrap gap-y-2 pt-2"
            left={
              <div className="flex items-center gap-0.5">
                <button className={ICON_BTN} aria-label="Add"><Plus className="size-4" /></button>
                <div className="relative">
                  <button onClick={() => toggleMenu('permissions')} className={TOOLBAR_PILL}>
                    <Hand className="size-4" /> Default permissions <ChevronDown className="size-3.5 opacity-60" />
                  </button>
                  {openMenu === 'permissions' && (
                    <div className={cn(MENU, 'bottom-full left-0 mb-1.5 w-48')}>
                      {['Default permissions', 'Read only', 'Full access'].map((p) => (
                        <button key={p} className={MENU_ITEM} onClick={() => setOpenMenu(null)}>
                          <Hand className="size-4" /> {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            }
            right={
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <button onClick={() => toggleMenu('model')} className={TOOLBAR_PILL}>
                    <Zap className="size-4" />
                    <span className="text-foreground font-semibold">{model.version}</span>
                    {model.effort}
                    <ChevronDown className="size-3.5 opacity-60" />
                  </button>
                  {openMenu === 'model' && (
                    <div className={cn(MENU, 'right-0 bottom-full mb-1.5 w-52')}>
                      {[{ version: '5.5', effort: 'Extra High' }, { version: '5.5', effort: 'High' }, { version: '5.1', effort: 'High' }].map((m, i) => (
                        <button key={i} className={MENU_ITEM} onClick={() => { setModel(m); setOpenMenu(null) }}>
                          <Zap className="size-4" />
                          <span className="text-foreground font-semibold">{m.version}</span>
                          <span className="text-muted-foreground">{m.effort}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className={ICON_BTN} aria-label="Voice input"><Mic className="size-4" /></button>
                <button
                  onClick={() => submit(segments)}
                  className="bg-black text-white hover:bg-[#1a1a1a] disabled:bg-[#dadada] disabled:text-[#7a7a7a] dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:disabled:bg-[#969696] dark:disabled:text-[#2d2d2d] flex size-8 items-center justify-center rounded-full disabled:cursor-not-allowed"
                  aria-label="Send">
                  <ArrowUp className="size-4" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Background context tray — peeks out below the composer */}
      <div className="bg-[#f6f6f6] dark:bg-[#1f1f1f] -mt-5 rounded-b-[24px] px-1.5 pt-[27px] pb-[7px]">
        <div className="flex flex-wrap items-center gap-0.5">
          <button onClick={() => toggleMenu('repo')} className={TRAY_PILL}>
            <FolderGit2 className="size-3.5" /> acme-enterprise <ChevronDown className="size-3 opacity-60" />
          </button>
          <button onClick={() => toggleMenu('environment')} className={TRAY_PILL}>
            <Laptop className="size-3.5" /> Work locally <ChevronDown className="size-3 opacity-60" />
          </button>
          <button onClick={() => toggleMenu('branch')} className={cn(TRAY_PILL, 'min-w-0 max-w-[200px]')} title="cursor/prod-data-memoization-layer">
            <GitBranch className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">cursor/prod-data-memoization-layer</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" />
          </button>
        </div>
      </div>

      {submitted && (
        <div className="bg-muted/50 mt-2 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Submitted — clear to send again.</span>
          <button
            onClick={reset}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            aria-label="Reset">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  )
}`

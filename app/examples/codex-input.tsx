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
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import {
  segmentsToPlainText,
  isSegmentsEmpty,
} from '@/registry/new-york/blocks/prompt-area/segment-helpers'
import type { Segment, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

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
  'text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors'
const ICON_BTN =
  'text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-full transition-colors'
const TRAY_PILL =
  'text-muted-foreground hover:bg-accent hover:text-foreground flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors'
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

export function CodexInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [submitted, setSubmitted] = useState('')

  const [permission, setPermission] = useState<Permission>(PERMISSIONS[0])
  const [model, setModel] = useState<Model>(MODELS[0])
  const [repo, setRepo] = useState<string>(REPOS[0])
  const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0])
  const [branch, setBranch] = useState<string>(BRANCHES[0])

  // Single source of truth for which dropdown is open — only one at a time.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

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

  const handleSubmit = useCallback((segs: Segment[]) => {
    const text = segmentsToPlainText(segs)
    if (!text.trim()) return
    setSubmitted(text)
    promptRef.current?.clear()
    setSegments([])
  }, [])

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      {/* Stacked composer + context tray */}
      <div className="relative flex flex-col">
        {/* Foreground composer card */}
        <div
          className="bg-card relative z-10 rounded-[28px] border shadow-sm"
          style={{ '--prompt-area-surface': 'var(--card)' } as React.CSSProperties}>
          <div className="px-4 pt-4 pb-2">
            <PromptArea
              ref={promptRef}
              value={segments}
              onChange={setSegments}
              placeholder="Do anything"
              onSubmit={handleSubmit}
              autoGrow
              minHeight={52}
              maxHeight={280}
            />
            <ActionBar
              className="pt-2"
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
                    onClick={() => handleSubmit(segments)}
                    disabled={isEmpty}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-50"
                    aria-label="Send message">
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              }
            />
          </div>
        </div>

        {/* Background context tray — peeks out below the composer card */}
        <div className="bg-muted/40 dark:bg-muted/20 -mt-5 rounded-b-[28px] border border-t-0 px-3 pt-7 pb-2.5">
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
              renderLabel={(b) => <span className="truncate">{b}</span>}
              menuClass="top-full left-0 mt-1.5 w-64"
              wrapperClass="min-w-0"
              title={branch}
            />
          </div>
        </div>
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

export const codexInputCode = `import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Hand, Zap, Mic, ArrowUp, ChevronDown, FolderGit2, Laptop, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import type { Segment, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

const TOOLBAR_PILL = 'text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors'
const ICON_BTN = 'text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-full transition-colors'
const TRAY_PILL = 'text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors'
const MENU = 'bg-popover absolute z-20 flex flex-col rounded-xl border p-1 shadow-md'
const MENU_ITEM = 'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent'

function CodexInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [model, setModel] = useState({ version: '5.5', effort: 'Extra High' })
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)
  const toggleMenu = (id: string) => setOpenMenu((cur) => (cur === id ? null : id))

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
        className="bg-card relative z-10 rounded-[28px] border shadow-sm"
        style={{ '--prompt-area-surface': 'var(--card)' } as React.CSSProperties}>
        <div className="px-4 pt-4 pb-2">
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            placeholder="Do anything"
            onSubmit={() => { promptRef.current?.clear(); setSegments([]) }}
            autoGrow
            minHeight={52}
            maxHeight={280}
          />
          <ActionBar
            className="pt-2"
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
                  onClick={() => { promptRef.current?.clear(); setSegments([]) }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-8 items-center justify-center rounded-full disabled:opacity-50"
                  aria-label="Send">
                  <ArrowUp className="size-4" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Background context tray — peeks out below the composer */}
      <div className="bg-muted/40 dark:bg-muted/20 -mt-5 rounded-b-[28px] border border-t-0 px-3 pt-7 pb-2.5">
        <div className="flex flex-wrap items-center gap-0.5">
          <button onClick={() => toggleMenu('repo')} className={TRAY_PILL}>
            <FolderGit2 className="size-3.5" /> acme-enterprise <ChevronDown className="size-3 opacity-60" />
          </button>
          <button onClick={() => toggleMenu('environment')} className={TRAY_PILL}>
            <Laptop className="size-3.5" /> Work locally <ChevronDown className="size-3 opacity-60" />
          </button>
          <button onClick={() => toggleMenu('branch')} className={cn(TRAY_PILL, 'min-w-0')} title="cursor/prod-data-memoization-layer">
            <GitBranch className="size-3.5 shrink-0" />
            <span className="truncate">cursor/prod-data-memoization-layer</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  )
}`

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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { segmentsToPlainText } from '@/registry/new-york/blocks/prompt-area/prompt-area-engine'
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

const REPOS = ['team-gpt-enterprise', 'team-gpt-web', 'team-gpt-infra'] as const
const ENVIRONMENTS = ['Work locally', 'Cloud sandbox', 'Staging'] as const
const BRANCHES = ['cursor/prod-data-memoization-layer', 'main', 'release/2026-06'] as const

// Shared class fragments (mirrors the repo's ICON_BTN / MENU_ITEM convention).
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

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  // Close the open menu on outside click or Escape. One root ref wraps every
  // dropdown; clicking a different trigger swaps menus via toggleMenu.
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

  const toggleMenu = useCallback((id: string) => {
    setOpenMenu((cur) => (cur === id ? null : id))
  }, [])

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

                  {/* Permissions */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleMenu('permissions')}
                      aria-haspopup="menu"
                      aria-expanded={openMenu === 'permissions'}
                      className={TOOLBAR_PILL}>
                      <Hand className="size-4" />
                      {permission}
                      <ChevronDown className="size-3.5 opacity-60" />
                    </button>
                    {openMenu === 'permissions' && (
                      <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-1.5 w-48')}>
                        {PERMISSIONS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            role="menuitemradio"
                            aria-checked={p === permission}
                            className={cn(MENU_ITEM, p === permission && 'bg-accent')}
                            onClick={() => {
                              setPermission(p)
                              setOpenMenu(null)
                            }}>
                            <Hand className="size-4 shrink-0" />
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              }
              right={
                <div className="flex items-center gap-0.5">
                  {/* Reasoning-effort model selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleMenu('model')}
                      aria-haspopup="menu"
                      aria-expanded={openMenu === 'model'}
                      className={TOOLBAR_PILL}>
                      <Zap className="size-4" />
                      <span className="text-foreground font-semibold">{model.version}</span>
                      {model.effort}
                      <ChevronDown className="size-3.5 opacity-60" />
                    </button>
                    {openMenu === 'model' && (
                      <div role="menu" className={cn(MENU, 'right-0 bottom-full mb-1.5 w-52')}>
                        {MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={m.id === model.id}
                            className={cn(MENU_ITEM, m.id === model.id && 'bg-accent')}
                            onClick={() => {
                              setModel(m)
                              setOpenMenu(null)
                            }}>
                            <Zap className="size-4 shrink-0" />
                            <span className="text-foreground font-semibold">{m.version}</span>
                            <span className="text-muted-foreground">{m.effort}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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
            {/* Repository */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('repo')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'repo'}
                className={TRAY_PILL}>
                <FolderGit2 className="size-3.5 shrink-0" />
                {repo}
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </button>
              {openMenu === 'repo' && (
                <div role="menu" className={cn(MENU, 'top-full left-0 mt-1.5 w-56')}>
                  {REPOS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="menuitemradio"
                      aria-checked={r === repo}
                      className={cn(MENU_ITEM, r === repo && 'bg-accent')}
                      onClick={() => {
                        setRepo(r)
                        setOpenMenu(null)
                      }}>
                      <FolderGit2 className="size-3.5 shrink-0" />
                      <span className="truncate">{r}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Environment */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('environment')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'environment'}
                className={TRAY_PILL}>
                <Laptop className="size-3.5 shrink-0" />
                {environment}
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </button>
              {openMenu === 'environment' && (
                <div role="menu" className={cn(MENU, 'top-full left-0 mt-1.5 w-48')}>
                  {ENVIRONMENTS.map((env) => (
                    <button
                      key={env}
                      type="button"
                      role="menuitemradio"
                      aria-checked={env === environment}
                      className={cn(MENU_ITEM, env === environment && 'bg-accent')}
                      onClick={() => {
                        setEnvironment(env)
                        setOpenMenu(null)
                      }}>
                      <Laptop className="size-3.5 shrink-0" />
                      {env}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Branch — truncated label */}
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => toggleMenu('branch')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'branch'}
                title={branch}
                className={TRAY_PILL}>
                <GitBranch className="size-3.5 shrink-0" />
                <span className="truncate">{branch}</span>
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </button>
              {openMenu === 'branch' && (
                <div role="menu" className={cn(MENU, 'top-full left-0 mt-1.5 w-64')}>
                  {BRANCHES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      role="menuitemradio"
                      aria-checked={b === branch}
                      className={cn(MENU_ITEM, b === branch && 'bg-accent')}
                      onClick={() => {
                        setBranch(b)
                        setOpenMenu(null)
                      }}>
                      <GitBranch className="size-3.5 shrink-0" />
                      <span className="truncate">{b}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            <FolderGit2 className="size-3.5" /> team-gpt-enterprise <ChevronDown className="size-3 opacity-60" />
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

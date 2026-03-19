'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useActiveSection } from '@/hooks/use-active-section'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Github, Star, TextCursorInput } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

interface NavItem {
  id: string
  label: string
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'hero', label: 'Introduction' },
  { id: 'what-is-prompt-area', label: 'What is Prompt Area?' },
  { id: 'demo', label: 'Demo' },
  { id: 'why-prompt-area', label: 'Why Prompt Area?' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'installation', label: 'Installation' },
  { id: 'features', label: 'Features' },
  {
    id: 'examples',
    label: 'Examples',
    children: [
      { id: 'example-dx-helpers', label: 'DX Helpers' },
      { id: 'example-basic', label: 'Basic' },
      { id: 'example-rotating-placeholders', label: 'Rotating Placeholders' },
      { id: 'example-mentions', label: '@Mentions' },
      { id: 'example-commands', label: '/Commands' },
      { id: 'example-tags', label: '#Tags' },
      { id: 'example-callback', label: 'Callback' },
      { id: 'example-markdown', label: 'Markdown' },
      { id: 'example-copy-paste', label: 'Copy & Paste' },
    ],
  },
  {
    id: 'action-bar',
    label: 'Action Bar',
    children: [
      { id: 'action-bar-full', label: 'Full-Featured' },
      { id: 'action-bar-minimal', label: 'Minimal' },
      { id: 'action-bar-disabled', label: 'Disabled' },
    ],
  },
  {
    id: 'status-bar',
    label: 'Status Bar',
    children: [
      { id: 'status-bar-above', label: 'Above Input' },
      { id: 'status-bar-below', label: 'Below Input' },
      { id: 'status-bar-both', label: 'Combined' },
    ],
  },
  {
    id: 'claude-code-input',
    label: 'Claude Code–Style',
    children: [{ id: 'claude-code-input-demo', label: 'Demo' }],
  },
  {
    id: 'compact-prompt-area',
    label: 'Compact Prompt Area',
    children: [{ id: 'compact-prompt-area-demo', label: 'Demo' }],
  },
  {
    id: 'chat-prompt-layout',
    label: 'Chat Prompt Layout',
    children: [{ id: 'chat-prompt-layout-example', label: 'Chat Layout' }],
  },
  { id: 'inspector', label: 'Inspector' },
  {
    id: 'dark-theme',
    label: 'Dark Theme',
    children: [{ id: 'dark-theme-preview', label: 'Preview' }],
  },
  { id: 'comparison', label: 'Comparison' },
]

function collectIds(items: NavItem[]): string[] {
  return items.flatMap((item) => [item.id, ...(item.children ? collectIds(item.children) : [])])
}

const ALL_IDS = collectIds(NAV_ITEMS)

// ---------------------------------------------------------------------------
// Sidebar context
// ---------------------------------------------------------------------------

interface SidebarContextType {
  isOpen: boolean
  isDesktop: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within NavSidebarProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// SidebarToggle — morphing hamburger / X
// ---------------------------------------------------------------------------

function SidebarToggle() {
  const { isOpen, toggle } = useSidebar()

  const lineBase =
    'block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]'

  return (
    <button
      onClick={toggle}
      aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      aria-expanded={isOpen}
      className={cn(
        'fixed top-4 left-4 z-50 flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-lg lg:hidden',
        'text-foreground transition-all duration-150',
        'hover:bg-accent active:scale-95',
      )}>
      <span className={cn(lineBase, isOpen && 'translate-y-[8px] rotate-45')} />
      <span className={cn(lineBase, isOpen && 'scale-x-0 opacity-0')} />
      <span className={cn(lineBase, isOpen && '-translate-y-[8px] -rotate-45')} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// NavItemButton — leaf item
// ---------------------------------------------------------------------------

interface NavItemButtonProps {
  item: NavItem
  isActive: boolean
  indent?: boolean
  onClick: (id: string) => void
}

function NavItemButton({ item, isActive, indent, onClick }: NavItemButtonProps) {
  return (
    <button
      data-nav-id={item.id}
      onClick={() => onClick(item.id)}
      className={cn(
        'relative w-full rounded-md py-2.5 text-left text-sm transition-colors duration-150 lg:py-1.5',
        indent ? 'pr-3 pl-7' : 'px-3',
        'hover:text-foreground hover:translate-x-0.5',
        isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
      )}>
      {item.label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CollapsibleNavItem — parent with expandable children
// ---------------------------------------------------------------------------

interface CollapsibleNavItemProps {
  item: NavItem
  activeId: string | null
  onNavigate: (id: string) => void
  onLayout: () => void
}

function CollapsibleNavItem({ item, activeId, onNavigate, onLayout }: CollapsibleNavItemProps) {
  const childIds = useMemo(() => item.children?.map((c) => c.id) ?? [], [item.children])
  const hasActiveChild = activeId !== null && childIds.includes(activeId)
  const isParentActive = activeId === item.id
  const [expanded, setExpanded] = useState(false)

  // Auto-expand when a child becomes active via scrolling
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external scroll-spy state
    if (hasActiveChild && !expanded) setExpanded(true)
  }, [hasActiveChild, expanded])

  // Notify parent that layout changed when expand/collapse finishes
  useEffect(() => {
    // Wait for the CSS grid transition to settle, then recalc indicator
    const timer = setTimeout(onLayout, 220)
    return () => clearTimeout(timer)
  }, [expanded, onLayout])

  return (
    <div>
      <button
        data-nav-id={item.id}
        onClick={() => {
          setExpanded((e) => !e)
          onNavigate(item.id)
        }}
        className={cn(
          'relative flex w-full items-center gap-1 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 lg:py-1.5',
          'hover:text-foreground',
          isParentActive || hasActiveChild
            ? 'text-foreground font-medium'
            : 'text-muted-foreground',
        )}>
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-200',
            expanded && 'rotate-90',
          )}
        />
        {item.label}
      </button>

      {/* Collapsible children — CSS grid trick for smooth height animation */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          {item.children?.map((child) => (
            <NavItemButton
              key={child.id}
              item={child}
              isActive={activeId === child.id}
              indent
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActiveIndicator — sliding vertical pill
//
// Uses data-nav-id attributes to find the active button in the DOM and
// measures its position relative to the nav container. Recalculates on:
//   - activeId change
//   - explicit layout notifications (collapsible expand/collapse)
//   - nav container resize (ResizeObserver)
// ---------------------------------------------------------------------------

function ActiveIndicator({
  activeId,
  navRef,
  layoutTick,
}: {
  activeId: string | null
  navRef: React.RefObject<HTMLElement | null>
  layoutTick: number
}) {
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, top: 0 })

  // Measure and position the indicator
  const measure = useCallback(() => {
    const nav = navRef.current
    if (!activeId || !nav) {
      setStyle((s) => (s.opacity === 0 ? s : { ...s, opacity: 0 }))
      return
    }

    const btn = nav.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    if (!btn) {
      setStyle((s) => (s.opacity === 0 ? s : { ...s, opacity: 0 }))
      return
    }

    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const pillHeight = 24
    const top = btnRect.top - navRect.top + nav.scrollTop + (btnRect.height - pillHeight) / 2

    setStyle({ opacity: 1, top })
  }, [activeId, navRef])

  // Recalculate whenever activeId or layoutTick changes
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing DOM measurements
    measure()
  }, [measure, layoutTick])

  // Also recalculate if the nav container resizes (e.g. window resize)
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(nav)
    return () => ro.disconnect()
  }, [navRef, measure])

  return (
    <div
      className="bg-foreground pointer-events-none absolute left-0 h-6 w-[3px] rounded-full"
      style={{
        ...style,
        transition: 'top 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// PageLinks — static page navigation links
// ---------------------------------------------------------------------------

const PAGE_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

function PageLinksAndTheme() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-0.5 px-1 py-1">
      {PAGE_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
            'hover:text-foreground',
            pathname === link.href ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}>
          {link.label}
        </a>
      ))}
      <ThemeToggle className="ml-auto" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavSidebar — the panel
// ---------------------------------------------------------------------------

function NavSidebar() {
  const { isOpen, isDesktop, close } = useSidebar()
  const activeId = useActiveSection(ALL_IDS)
  const navRef = useRef<HTMLElement | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const visible = isDesktop || isOpen

  // A counter that bumps whenever layout changes (collapsible expand/collapse).
  // The ActiveIndicator watches this to know when to re-measure.
  const [layoutTick, setLayoutTick] = useState(0)
  const bumpLayout = useCallback(() => setLayoutTick((t) => t + 1), [])

  const handleNavigate = useCallback(
    (id: string) => {
      if (pathname !== '/') {
        window.location.href = `/#${id}`
        return
      }
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.replaceState(null, '', `#${id}`)
      }
      if (!isDesktop) {
        setTimeout(close, 150)
      }
    },
    [close, isDesktop, pathname],
  )

  // Scroll the active item into view within the sidebar nav when it changes
  useEffect(() => {
    if (!activeId || !navRef.current) return
    const btn = navRef.current.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`)
    if (!btn) return

    // Only scroll if the button is outside the visible area of the nav
    const nav = navRef.current
    const btnRect = btn.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()

    if (btnRect.top < navRect.top || btnRect.bottom > navRect.bottom) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeId])

  return (
    <aside
      ref={sidebarRef}
      aria-label="Sidebar navigation"
      tabIndex={visible ? -1 : undefined}
      aria-hidden={!visible ? true : undefined}
      inert={!visible ? true : undefined}
      className={cn(
        'border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 w-[280px] border-r',
        'flex flex-col outline-none',
        'transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
        'lg:translate-x-0',
        !isOpen && !isDesktop && '-translate-x-full',
      )}>
      <Link
        href="/"
        className="flex items-center gap-2.5 px-4 pt-16 pb-2 transition-opacity hover:opacity-70 lg:pt-6">
        <TextCursorInput className="text-foreground size-5 shrink-0" />
        <span className="text-foreground text-sm font-semibold tracking-tight">Prompt Area</span>
      </Link>

      <nav
        ref={navRef}
        aria-label="Page sections"
        className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 pt-2 pb-6">
        <ActiveIndicator activeId={activeId} navRef={navRef} layoutTick={layoutTick} />

        {NAV_ITEMS.map((item) =>
          item.children ? (
            <CollapsibleNavItem
              key={item.id}
              item={item}
              activeId={activeId}
              onNavigate={handleNavigate}
              onLayout={bumpLayout}
            />
          ) : (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={handleNavigate}
            />
          ),
        )}
      </nav>

      <div className="border-sidebar-border flex flex-col gap-2 border-t px-4 py-3">
        <a
          href="https://github.com/team-gpt/prompt-area"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'bg-accent/50 text-foreground hover:bg-accent',
          )}>
          <Github className="size-4 shrink-0" />
          <span className="flex-1">GitHub Repo</span>
          <Star className="text-muted-foreground size-3.5 transition-colors group-hover:text-yellow-500" />
        </a>
        <PageLinksAndTheme />
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// useSwipeGesture — detect horizontal swipes on mobile
// ---------------------------------------------------------------------------

function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  isDesktop,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  isDesktop: boolean
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (isDesktop) return

    const SWIPE_THRESHOLD = 50
    const MAX_VERTICAL_RATIO = 0.75

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      touchStart.current = null

      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
      if (Math.abs(deltaY) > Math.abs(deltaX) * MAX_VERTICAL_RATIO) return

      if (deltaX < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDesktop, onSwipeLeft, onSwipeRight])
}

// ---------------------------------------------------------------------------
// SidebarLayout — root wrapper
// ---------------------------------------------------------------------------

export function SidebarLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(() => setIsOpen((o) => !o), [])
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(() => setIsOpen(true), [])

  useSwipeGesture({
    onSwipeLeft: close,
    onSwipeRight: open,
    isDesktop,
  })

  // Sync open state with screen size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from browser API
    setIsDesktop(mq.matches)
    setIsOpen(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      setIsOpen(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Scroll to hash target on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey) && !isDesktop) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && isOpen && !isDesktop) {
        close()
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle, close, isOpen, isDesktop])

  const ctx = useMemo(
    () => ({ isOpen, isDesktop, toggle, close }),
    [isOpen, isDesktop, toggle, close],
  )

  return (
    <SidebarContext.Provider value={ctx}>
      <SidebarToggle />

      <NavSidebar />

      {/* Backdrop — mobile only */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden',
          'transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={close}
        aria-hidden
      />

      {/* Main content */}
      <main role="main" className="min-h-screen overflow-x-hidden lg:ml-[280px]">
        {children}
      </main>
    </SidebarContext.Provider>
  )
}

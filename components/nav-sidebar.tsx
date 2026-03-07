'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { id: 'try-it', label: 'Try It' },
  { id: 'all-options', label: 'All Options' },
  {
    id: 'examples',
    label: 'Examples',
    children: [
      { id: 'example-basic', label: 'Basic' },
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

/** Whether sidebar content should be visible (always on desktop, or when open on mobile) */
function useSidebarVisible() {
  const { isOpen, isDesktop } = useSidebar()
  return isDesktop || isOpen
}

// ---------------------------------------------------------------------------
// useActiveSection — IntersectionObserver scroll tracking
// ---------------------------------------------------------------------------

function useActiveSection(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const map = new Map<string, boolean>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          map.set(entry.target.id, entry.isIntersecting)
        }
        // Pick the first (topmost in DOM order) visible section
        for (const id of sectionIds) {
          if (map.get(id)) {
            setActiveId(id)
            return
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}

// ---------------------------------------------------------------------------
// SidebarToggle — morphing hamburger ↔ X
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
        'fixed top-5 left-5 z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px] rounded-lg lg:hidden',
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
  index: number
  indent?: boolean
  onClick: (id: string) => void
}

function NavItemButton({ item, isActive, index, indent, onClick }: NavItemButtonProps) {
  const visible = useSidebarVisible()

  return (
    <button
      onClick={() => onClick(item.id)}
      className={cn(
        'relative w-full rounded-md py-1.5 text-left text-sm transition-all duration-150',
        indent ? 'pl-7 pr-3' : 'px-3',
        'hover:text-foreground hover:translate-x-0.5',
        isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transition: `opacity 300ms ease-out, transform 300ms ease-out, color 150ms`,
        transitionDelay: visible ? `${150 + index * 40}ms` : '0ms',
      }}>
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
  index: number
  onNavigate: (id: string) => void
  itemRefs: React.RefObject<Map<string, HTMLElement>>
}

function CollapsibleNavItem({ item, activeId, index, onNavigate, itemRefs }: CollapsibleNavItemProps) {
  const visible = useSidebarVisible()
  const childIds = useMemo(() => item.children?.map((c) => c.id) ?? [], [item.children])
  const hasActiveChild = activeId !== null && childIds.includes(activeId)
  const isParentActive = activeId === item.id
  const [expanded, setExpanded] = useState(false)

  // Auto-expand when a child becomes active via scrolling
  useEffect(() => {
    if (hasActiveChild) setExpanded(true)
  }, [hasActiveChild])

  return (
    <div>
      <button
        onClick={() => {
          setExpanded((e) => !e)
          onNavigate(item.id)
        }}
        className={cn(
          'relative flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-left text-sm transition-all duration-150',
          'hover:text-foreground',
          isParentActive || hasActiveChild ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-12px)',
          transition: `opacity 300ms ease-out, transform 300ms ease-out, color 150ms`,
          transitionDelay: visible ? `${150 + index * 40}ms` : '0ms',
        }}>
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-200',
            expanded && 'rotate-90',
          )}
        />
        {item.label}
      </button>

      {/* Collapsible children */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          {item.children?.map((child, ci) => (
            <div
              key={child.id}
              ref={(el) => {
                if (el) itemRefs.current.set(child.id, el)
              }}>
              <NavItemButton
                item={child}
                isActive={activeId === child.id}
                index={index + 1 + ci}
                indent
                onClick={onNavigate}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActiveIndicator — sliding vertical pill
// ---------------------------------------------------------------------------

interface ActiveIndicatorProps {
  activeId: string | null
  itemRefs: React.RefObject<Map<string, HTMLElement>>
  navRef: React.RefObject<HTMLElement | null>
}

function ActiveIndicator({ activeId, itemRefs, navRef }: ActiveIndicatorProps) {
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: 0,
  })

  useEffect(() => {
    if (!activeId || !itemRefs.current || !navRef.current) {
      setStyle((s) => ({ ...s, opacity: 0 }))
      return
    }

    const itemEl = itemRefs.current.get(activeId)
    if (!itemEl) {
      setStyle((s) => ({ ...s, opacity: 0 }))
      return
    }

    const navRect = navRef.current.getBoundingClientRect()
    const itemRect = itemEl.getBoundingClientRect()
    const pillHeight = 24
    const top = itemRect.top - navRect.top + (itemRect.height - pillHeight) / 2

    setStyle({ opacity: 1, top })
  }, [activeId, itemRefs, navRef])

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
// NavSidebar — the panel
// ---------------------------------------------------------------------------

function NavSidebar() {
  const { isOpen, isDesktop, close } = useSidebar()
  const activeId = useActiveSection(ALL_IDS)
  const navRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const sidebarRef = useRef<HTMLElement>(null)

  const handleNavigate = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      // On smaller screens, auto-close after navigating
      if (!isDesktop) {
        setTimeout(close, 150)
      }
    },
    [close, isDesktop],
  )

  // Focus sidebar on open for keyboard accessibility (mobile only)
  useEffect(() => {
    if (isOpen && !isDesktop && sidebarRef.current) {
      sidebarRef.current.focus()
    }
  }, [isOpen, isDesktop])

  return (
    <aside
      ref={sidebarRef}
      tabIndex={-1}
      className={cn(
        'border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 w-[280px] border-r',
        'flex flex-col outline-none',
        'transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
        'lg:translate-x-0',
        !isOpen && '-translate-x-full',
      )}>
      <nav
        ref={navRef}
        className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 pt-6 pb-6">
        <ActiveIndicator activeId={activeId} itemRefs={itemRefs} navRef={navRef} />

        {NAV_ITEMS.map((item, i) =>
          item.children ? (
            <CollapsibleNavItem
              key={item.id}
              item={item}
              activeId={activeId}
              index={i}
              onNavigate={handleNavigate}
              itemRefs={itemRefs}
            />
          ) : (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el)
              }}>
              <NavItemButton
                item={item}
                isActive={activeId === item.id}
                index={i}
                onClick={handleNavigate}
              />
            </div>
          ),
        )}
      </nav>

    </aside>
  )
}

// ---------------------------------------------------------------------------
// SidebarLayout — root wrapper with push effect
// ---------------------------------------------------------------------------

export function SidebarLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(() => setIsOpen((o) => !o), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Sync open state with screen size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    setIsOpen(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      setIsOpen(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl+B to toggle (mobile), Escape to close (mobile)
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

      {/* Main content — margin on desktop, no transform */}
      <main className="min-h-screen overflow-x-hidden lg:ml-[280px]">{children}</main>
    </SidebarContext.Provider>
  )
}

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

interface NavItem {
  id: string
  label: string
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const NAV_SECTIONS: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'hero', label: 'Introduction' },
      { id: 'try-it', label: 'Try It' },
      { id: 'all-options', label: 'All Options' },
    ],
  },
  {
    group: 'EXAMPLES',
    items: [
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
    group: 'ACTION BAR',
    items: [
      { id: 'action-bar', label: 'Overview' },
      { id: 'action-bar-full', label: 'Full-Featured' },
      { id: 'action-bar-minimal', label: 'Minimal' },
      { id: 'action-bar-disabled', label: 'Disabled' },
    ],
  },
]

const ALL_IDS = NAV_SECTIONS.flatMap((g) => g.items.map((i) => i.id))

// ---------------------------------------------------------------------------
// Sidebar context
// ---------------------------------------------------------------------------

interface SidebarContextType {
  isOpen: boolean
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
        'fixed left-5 top-5 z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px] rounded-lg',
        'text-foreground transition-all duration-150',
        'hover:bg-accent active:scale-95',
      )}
    >
      <span
        className={cn(lineBase, isOpen && 'translate-y-[8px] rotate-45')}
      />
      <span className={cn(lineBase, isOpen && 'scale-x-0 opacity-0')} />
      <span
        className={cn(lineBase, isOpen && '-translate-y-[8px] -rotate-45')}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// NavItemButton
// ---------------------------------------------------------------------------

interface NavItemButtonProps {
  item: NavItem
  isActive: boolean
  index: number
  isOpen: boolean
  onClick: (id: string) => void
}

function NavItemButton({
  item,
  isActive,
  index,
  isOpen,
  onClick,
}: NavItemButtonProps) {
  return (
    <button
      onClick={() => onClick(item.id)}
      className={cn(
        'relative w-full rounded-md px-3 py-2 text-left text-sm transition-all duration-150',
        'hover:translate-x-0.5 hover:text-foreground',
        isActive
          ? 'font-medium text-foreground'
          : 'text-muted-foreground',
      )}
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateX(0)' : 'translateX(-12px)',
        transition: `opacity 300ms ease-out, transform 300ms ease-out, color 150ms`,
        transitionDelay: isOpen ? `${150 + index * 40}ms` : '0ms',
      }}
    >
      {item.label}
    </button>
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
    const top = itemRect.top - navRect.top + (itemRect.height - 28) / 2

    setStyle({ opacity: 1, top })
  }, [activeId, itemRefs, navRef])

  return (
    <div
      className="pointer-events-none absolute left-0 h-7 w-[3px] rounded-full bg-foreground"
      style={{
        ...style,
        transition:
          'top 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// NavSidebar — the panel
// ---------------------------------------------------------------------------

function NavSidebar() {
  const { isOpen, close } = useSidebar()
  const activeId = useActiveSection(ALL_IDS)
  const navRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const sidebarRef = useRef<HTMLElement>(null)

  const handleClick = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      // On smaller screens, auto-close after navigating
      if (window.innerWidth < 1024) {
        setTimeout(close, 150)
      }
    },
    [close],
  )

  // Focus sidebar on open for keyboard accessibility
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      sidebarRef.current.focus()
    }
  }, [isOpen])

  let globalIndex = 0

  return (
    <aside
      ref={sidebarRef}
      tabIndex={-1}
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-[280px] border-r border-sidebar-border bg-sidebar',
        'flex flex-col outline-none',
        'transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <nav
        ref={navRef}
        className="relative flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-6 pt-20"
      >
        <ActiveIndicator
          activeId={activeId}
          itemRefs={itemRefs}
          navRef={navRef}
        />

        {NAV_SECTIONS.map((group) => (
          <div key={group.group} className="flex flex-col gap-1">
            <span
              className={cn(
                'mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground',
                'transition-opacity duration-300',
              )}
              style={{
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? '100ms' : '0ms',
              }}
            >
              {group.group}
            </span>
            {group.items.map((item) => {
              const idx = globalIndex++
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(item.id, el)
                  }}
                >
                  <NavItemButton
                    item={item}
                    isActive={activeId === item.id}
                    index={idx}
                    isOpen={isOpen}
                    onClick={handleClick}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom area — keyboard shortcut hint */}
      <div
        className="border-t border-sidebar-border px-6 py-4"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 300ms ease-out',
          transitionDelay: isOpen ? '400ms' : '0ms',
        }}
      >
        <span className="font-mono text-[10px] text-muted-foreground">
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">
            ⌘B
          </kbd>{' '}
          to toggle
        </span>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// SidebarLayout — root wrapper with push effect
// ---------------------------------------------------------------------------

export function SidebarLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(() => setIsOpen((o) => !o), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Keyboard shortcut: Cmd/Ctrl+B to toggle, Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && isOpen) {
        close()
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle, close, isOpen])

  const ctx = useMemo(
    () => ({ isOpen, toggle, close }),
    [isOpen, toggle, close],
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
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={close}
        aria-hidden
      />

      {/* Main content with push effect on lg+ */}
      <main
        className={cn(
          'min-h-screen transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
          isOpen && 'lg:translate-x-[280px]',
        )}
      >
        {children}
      </main>
    </SidebarContext.Provider>
  )
}

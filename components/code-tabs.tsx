'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

type Tab = {
  label: string
  content: ReactNode
}

const TAB_CLASS =
  'rounded-md px-3 py-1 text-xs font-medium transition-colors aria-selected:bg-foreground aria-selected:text-background text-muted-foreground hover:text-foreground hover:bg-muted'

/**
 * Accessible tab switcher (WAI-ARIA Tabs pattern).
 *
 * Each tab's `content` is typically a server-rendered (Shiki-highlighted) node
 * passed in from a Server Component, so every variant ships in the static HTML
 * and stays crawlable — this only toggles which one is visible. Implements
 * roving tabindex, Arrow/Home/End keyboard navigation, and tab↔panel linking.
 */
export function CodeTabs({
  tabs,
  label,
  onSelect,
}: {
  tabs: Tab[]
  label: string
  /** Fired when a tab becomes active (click or keyboard), for analytics. */
  onSelect?: (index: number, label: string) => void
}) {
  const [active, setActive] = useState(0)
  const uid = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function select(index: number) {
    setActive(index)
    onSelect?.(index, tabs[index].label)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next: number
    switch (e.key) {
      case 'ArrowRight':
        next = (active + 1) % tabs.length
        break
      case 'ArrowLeft':
        next = (active - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tabs.length - 1
        break
      default:
        return
    }
    e.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1"
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-controls={`${uid}-panel-${i}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={TAB_CLASS}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${uid}-panel-${i}`}
          aria-labelledby={`${uid}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="flex flex-col gap-2">
          {tab.content}
        </div>
      ))}
    </div>
  )
}

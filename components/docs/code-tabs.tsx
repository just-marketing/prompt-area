'use client'

import { useState, type ReactNode } from 'react'

type Tab = {
  label: string
  content: ReactNode
}

/**
 * Client tab switcher for pre-rendered code blocks.
 *
 * Each tab's `content` is a server-rendered (Shiki-highlighted) node passed in
 * from a Server Component, so every variant ships in the static HTML and stays
 * crawlable — this only toggles which one is visible.
 */
export function CodeTabs({ tabs, label }: { tabs: Tab[]; label?: string }) {
  const [active, setActive] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1"
        role="tablist"
        aria-label={label ?? 'Variants'}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              i === active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div key={tab.label} role="tabpanel" hidden={i !== active} className="flex flex-col gap-2">
          {tab.content}
        </div>
      ))}
    </div>
  )
}

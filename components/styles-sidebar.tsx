'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { StyleLogo } from '@/components/style-logo'
import { stylesNavigation } from '@/lib/styles-navigation'

// Sticky section nav for /styles. Each link jumps to a style's section and the
// active one tracks scroll position — modeled on the docs table-of-contents.
export function StylesSidebar() {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0.1 },
    )
    for (const item of stylesNavigation) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Styles" className="flex flex-col gap-3 pb-8">
      <h2 className="text-muted-foreground/60 text-xs font-medium tracking-wider uppercase">
        Styles
      </h2>
      <ul className="flex flex-col gap-1">
        {stylesNavigation.map((item) => {
          const isActive = activeId === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-md py-1.5 text-sm transition-colors',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <StyleLogo id={item.id} aria-hidden className="size-4 shrink-0" />
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

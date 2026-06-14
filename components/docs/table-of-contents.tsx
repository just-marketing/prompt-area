'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Heading = { id: string; text: string; level: number }

function collectHeadings(): Heading[] {
  const article = document.querySelector('article')
  if (!article) return []
  return Array.from(article.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map((el) => ({
    id: el.id,
    text: el.textContent?.replace(/#$/, '').trim() ?? '',
    level: el.tagName === 'H3' ? 3 : 2,
  }))
}

export function TableOfContents() {
  const pathname = usePathname()
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState('')

  // Re-scan headings whenever the page changes.
  useEffect(() => {
    const timer = setTimeout(() => setHeadings(collectHeadings()), 100)
    return () => clearTimeout(timer)
  }, [pathname])

  // Track the active heading while scrolling.
  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0.1 },
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="On this page" className="flex flex-col gap-3">
      <h2 className="text-muted-foreground/60 text-xs font-medium tracking-wider uppercase">
        On this page
      </h2>
      <ul className="flex flex-col gap-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block py-0.5 text-xs leading-relaxed transition-colors',
                h.level === 3 && 'pl-3',
                activeId === h.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

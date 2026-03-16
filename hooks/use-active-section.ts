'use client'

import { useEffect, useState } from 'react'

/**
 * IntersectionObserver-based scroll tracking.
 * Returns the ID of the first visible section in DOM order.
 */
export function useActiveSection(sectionIds: string[]): string | null {
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

'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-position-based active section tracking.
 *
 * On every scroll frame, finds the section whose top edge is closest to
 * (but at or above) a threshold line set at 25% of the viewport height.
 * Falls back to the very first section if nothing has scrolled past.
 *
 * This is fundamentally more reliable than IntersectionObserver for scroll-spy
 * because it doesn't depend on intersection timing/batching and always picks
 * a deterministic winner based on the current scroll position.
 */
export function useActiveSection(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  const rafId = useRef(0)

  useEffect(() => {
    if (sectionIds.length === 0) return

    function compute() {
      const threshold = window.innerHeight * 0.25
      let bestId: string | null = null
      let bestDistance = Infinity

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue

        const rect = el.getBoundingClientRect()

        // Section top relative to viewport — we want the one closest to
        // (but at or above) the threshold line
        const distance = threshold - rect.top

        if (distance >= 0 && distance < bestDistance) {
          bestDistance = distance
          bestId = id
        }
      }

      // If nothing has scrolled past the threshold yet (e.g. page top),
      // pick the first section visible in the viewport
      if (!bestId) {
        for (const id of sectionIds) {
          const el = document.getElementById(id)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          if (rect.bottom > 0) {
            bestId = id
            break
          }
        }
      }

      setActiveId(bestId)
    }

    function onScroll() {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(compute)
    }

    // Compute once immediately
    compute()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [sectionIds])

  return activeId
}

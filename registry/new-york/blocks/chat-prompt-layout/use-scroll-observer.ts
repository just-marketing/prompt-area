'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Distance from edge before showing a button */
const SHOW_THRESHOLD = 300
/** Distance from edge before hiding a button (larger = less flicker) */
const HIDE_THRESHOLD = 100

export function useScrollObserver() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showGoToTop, setShowGoToTop] = useState(false)
  const [showGoToBottom, setShowGoToBottom] = useState(false)
  const rafId = useRef(0)

  const update = useCallback(() => {
    // Coalesce rapid scroll events into a single rAF
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return

      const scrollTop = el.scrollTop
      const distanceFromBottom = el.scrollHeight - scrollTop - el.clientHeight

      // Hysteresis: use a higher threshold to show, lower to hide
      setShowGoToTop((prev) => (prev ? scrollTop > HIDE_THRESHOLD : scrollTop > SHOW_THRESHOLD))
      setShowGoToBottom((prev) =>
        prev ? distanceFromBottom > HIDE_THRESHOLD : distanceFromBottom > SHOW_THRESHOLD,
      )
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      el.removeEventListener('scroll', update)
      cancelAnimationFrame(rafId.current)
    }
  }, [update])

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  return { scrollRef, showGoToTop, showGoToBottom, scrollToTop, scrollToBottom }
}

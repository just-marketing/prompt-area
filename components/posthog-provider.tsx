'use client'

import { useEffect } from 'react'
import { loadPostHog, POSTHOG_KEY } from '@/lib/analytics'

// Signals that a visitor is engaging — any of these pulls the SDK in early so
// autocapture doesn't miss the interaction that follows.
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Schedules the PostHog SDK load off the critical path.
 *
 * posthog-js is ~60 KB gzipped — heavier than everything else on the mobile
 * homepage combined — so instead of shipping it in the initial bundle it is
 * dynamically imported (see `loadPostHog`) once the page has loaded and the
 * main thread is idle, or on the visitor's first interaction, whichever comes
 * first. The initial pageview is still captured at init, so nothing is lost;
 * only network/CPU contention during First/Largest Contentful Paint is.
 *
 * If `POSTHOG_KEY` is empty (env var explicitly set to ''), this is a no-op
 * pass-through and nothing is sent.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return

    let idleHandle: number | undefined
    const start = () => {
      cleanup()
      void loadPostHog()
    }
    const scheduleIdle = () => {
      idleHandle =
        typeof requestIdleCallback === 'function'
          ? requestIdleCallback(start, { timeout: 3000 })
          : (setTimeout(start, 2000) as unknown as number)
    }

    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, start, { once: true, passive: true })
    }
    if (document.readyState === 'complete') scheduleIdle()
    else window.addEventListener('load', scheduleIdle, { once: true })

    function cleanup() {
      for (const event of INTERACTION_EVENTS) window.removeEventListener(event, start)
      window.removeEventListener('load', scheduleIdle)
      if (idleHandle !== undefined) {
        if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleHandle)
        else clearTimeout(idleHandle)
      }
    }
    return cleanup
  }, [])

  return <>{children}</>
}

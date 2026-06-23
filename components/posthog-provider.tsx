'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react'
import { POSTHOG_API_HOST, POSTHOG_KEY, POSTHOG_UI_HOST } from '@/lib/analytics'

/**
 * Initializes PostHog once on the client and makes the instance available to
 * the React tree (so components can also use `usePostHog()` if needed).
 *
 * Ingestion is routed through the same-origin `/ingest` proxy (see the
 * rewrites in `next.config.ts`) so analytics load from our own domain and
 * aren't dropped by ad/tracker blockers. `defaults: '2026-05-30'` opts into
 * PostHog's modern defaults, including automatic pageview capture on App
 * Router client-side navigations.
 *
 * If `POSTHOG_KEY` is empty (env var explicitly set to ''), this is a no-op
 * pass-through and nothing is sent.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY || posthog.__loaded) return
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_API_HOST,
      ui_host: POSTHOG_UI_HOST,
      defaults: '2026-05-30',
    })
  }, [])

  if (!POSTHOG_KEY) return <>{children}</>

  return <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
}

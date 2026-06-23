'use client'

import { useEffect, useState } from 'react'

/**
 * Resolves whether the Product Hunt launch is live for client UI. When the
 * build-time override (NEXT_PUBLIC_PH_LIVE, passed as `initialLive`) is on, it
 * returns true immediately; otherwise it asks /api/ph-flag (Vercel Edge Config)
 * so the launch can be flipped without a redeploy.
 */
export function useProductHuntLive(initialLive: boolean): boolean {
  const [live, setLive] = useState(initialLive)

  useEffect(() => {
    if (initialLive) return
    let cancelled = false
    fetch('/api/ph-flag', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { live?: boolean }) => {
        if (!cancelled) setLive(d.live === true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [initialLive])

  return live
}

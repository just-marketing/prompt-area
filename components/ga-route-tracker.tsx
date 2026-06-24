'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Sends a GA4 `page_view` on client-side route changes. The `gtag('config')`
 * call in <Analytics> fires the initial page_view, but App Router Link
 * navigations don't reload the page — so without this, GA would only ever see
 * the first page of a session. The first run is skipped to avoid double-counting
 * that initial view. (Pathname-only: query-only changes on the same path aren't
 * tracked, which is fine for this site and avoids a useSearchParams Suspense
 * boundary.)
 */
export function GaRouteTracker() {
  const pathname = usePathname()
  const isInitial = useRef(true)

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname])

  return null
}

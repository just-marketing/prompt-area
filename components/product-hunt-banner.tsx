'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { hasOfficialBadge, productHuntUrl } from '@/lib/product-hunt'
import { ProductHuntBadge } from '@/components/product-hunt-badge'
import { useProductHuntLive } from '@/hooks/use-product-hunt-live'

const DISMISS_KEY = 'pa:ph-banner-dismissed'

/**
 * Site-wide welcome bar shown to visitors on launch day. Sits above the sticky
 * header, so it scrolls away like a normal announcement, and stays dismissed
 * (per browser) once closed.
 *
 * `initialLive` is the build-time env override (NEXT_PUBLIC_PH_LIVE) passed from
 * the server: when true the banner renders during SSR (instant, no flash, handy
 * for local preview). Otherwise the live flag resolves from Edge Config on the
 * client, so the launch can be flipped without a redeploy.
 */
export function ProductHuntBanner({ initialLive = false }: { initialLive?: boolean }) {
  const live = useProductHuntLive(initialLive)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot, reads persisted dismissal
      if (localStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)
    } catch {}
  }, [])

  if (!live || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  return (
    <aside aria-label="Product Hunt launch announcement" className="bg-ph relative text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <span aria-hidden className="text-base leading-none">
            🎉
          </span>
          <span className="truncate">
            Prompt Area is on Product Hunt
            <span className="hidden sm:inline">
              . If it&apos;s been useful, an upvote means a lot.
            </span>
          </span>
        </p>

        {hasOfficialBadge && (
          <ProductHuntBadge className="hidden shrink-0 lg:block [&_img]:h-9 [&_img]:w-auto" />
        )}

        <Link
          href={productHuntUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ph inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90">
          Support us
          <ArrowRight className="size-3.5" />
        </Link>

        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="-mr-1 shrink-0 rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
    </aside>
  )
}

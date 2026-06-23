'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { hasOfficialBadge } from '@/lib/product-hunt'
import { ProductHuntBadge } from '@/components/product-hunt-badge'
import { useProductHuntLive } from '@/hooks/use-product-hunt-live'

// Pixels scrolled before the nav badge reveals (roughly the banner's height, so
// it appears just as the welcome banner scrolls out of view).
const REVEAL_AT = 48

/**
 * The official "Featured on Product Hunt" badge tucked into the sticky nav,
 * before the GitHub icon. Hidden while the page is at the top (the welcome
 * banner is on screen) and animates in once you scroll past it, keeping a
 * Product Hunt CTA visible after the banner scrolls away.
 */
export function ProductHuntNavBadge({ initialLive = false }: { initialLive?: boolean }) {
  const live = useProductHuntLive(initialLive)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!live) return
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AT)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [live])

  if (!live || !hasOfficialBadge) return null

  return (
    <div
      aria-hidden={!revealed}
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none',
        revealed
          ? 'max-w-[180px] translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none max-w-0 -translate-y-1 scale-95 opacity-0',
      )}>
      <ProductHuntBadge className="mr-1 block [&_img]:h-8 [&_img]:w-auto" />
    </div>
  )
}

import type { ReactNode } from 'react'
import { ProductHuntBanner } from '@/components/product-hunt-banner'
import { SiteHeader } from '@/components/site-header'
import { PRODUCT_HUNT } from '@/lib/product-hunt'

// Minimal global shell: an optional launch-day announcement bar above a
// full-width sticky header over the page content. Section-level navigation
// lives in the header (site nav) and, for docs, in the dedicated /docs layout.
// The footer is passed in as part of children.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ProductHuntBanner initialLive={PRODUCT_HUNT.live} />
      <SiteHeader phInitialLive={PRODUCT_HUNT.live} />
      <main role="main" className="min-h-screen overflow-x-clip">
        {children}
      </main>
    </>
  )
}

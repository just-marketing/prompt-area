import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'

// Minimal global shell: a full-width sticky header over the page content.
// Section-level navigation lives in the header (site nav) and, for docs, in
// the dedicated /docs layout. The footer is passed in as part of children.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main role="main" className="min-h-screen overflow-x-clip">
        {children}
      </main>
    </>
  )
}

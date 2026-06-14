'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { docsPageOrder } from '@/lib/docs-navigation'

export function DocsPager() {
  const pathname = usePathname()
  const index = docsPageOrder.findIndex((item) => item.href === pathname)
  if (index === -1) return null

  const prev = index > 0 ? docsPageOrder[index - 1] : null
  const next = index < docsPageOrder.length - 1 ? docsPageOrder[index + 1] : null
  if (!prev && !next) return null

  return (
    <nav aria-label="Pagination" className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="hover:bg-accent/40 group flex flex-col gap-1 rounded-lg border p-4 transition-colors">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <ArrowLeft className="size-3" />
            Previous
          </span>
          <span className="text-foreground text-sm font-medium">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="hover:bg-accent/40 group flex flex-col items-end gap-1 rounded-lg border p-4 text-right transition-colors">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            Next
            <ArrowRight className="size-3" />
          </span>
          <span className="text-foreground text-sm font-medium">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

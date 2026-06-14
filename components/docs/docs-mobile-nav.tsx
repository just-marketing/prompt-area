'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { docsNavigation, docsPageOrder } from '@/lib/docs-navigation'

// Compact docs navigation for small screens. A native <details> disclosure so
// it needs no extra JS; the current page title is shown as the summary.
export function DocsMobileNav() {
  const pathname = usePathname()
  const current = docsPageOrder.find((item) => item.href === pathname)

  return (
    <details className="bg-background/80 supports-[backdrop-filter]:bg-background/60 group sticky top-14 z-20 border-b backdrop-blur lg:hidden">
      <summary className="text-foreground flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        <span className="text-muted-foreground">
          Docs{current ? <span className="text-foreground"> · {current.title}</span> : null}
        </span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-4 pt-1 pb-5">
        {docsNavigation.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            <h2 className="text-muted-foreground/60 text-xs font-medium tracking-wider uppercase">
              {section.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                    className={cn(
                      'block py-1 text-sm transition-colors',
                      pathname === item.href
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

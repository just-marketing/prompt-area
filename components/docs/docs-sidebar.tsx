'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { docsNavigation } from '@/lib/docs-navigation'

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Docs" className="flex flex-col gap-6 pb-8">
      {docsNavigation.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h2 className="text-muted-foreground/60 text-xs font-medium tracking-wider uppercase">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                    className={cn(
                      'flex items-center gap-1 rounded-md py-1 text-sm transition-colors',
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}>
                    {item.title}
                    {item.external && <ArrowUpRight className="size-3 opacity-60" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

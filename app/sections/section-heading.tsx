'use client'

import { Link as LinkIcon } from 'lucide-react'

export function SectionHeading({
  id,
  as: Tag = 'h3',
  children,
}: {
  id: string
  as?: 'h2' | 'h3'
  children: React.ReactNode
}) {
  const isH2 = Tag === 'h2'

  return (
    <Tag className="group/anchor relative flex items-center gap-2">
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById(id)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            history.replaceState(null, '', `#${id}`)
          }
        }}
        className={
          isH2
            ? 'decoration-muted-foreground/40 text-2xl font-semibold underline-offset-4 hover:underline'
            : 'decoration-muted-foreground/40 text-base font-medium underline-offset-4 hover:underline'
        }>
        {children}
      </a>
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById(id)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            history.replaceState(null, '', `#${id}`)
          }
          navigator.clipboard?.writeText(
            `${window.location.origin}${window.location.pathname}#${id}`,
          )
        }}
        aria-label={`Copy link to ${typeof children === 'string' ? children : 'section'}`}
        className="text-muted-foreground/0 group-hover/anchor:text-muted-foreground/60 hover:!text-foreground transition-colors duration-150">
        <LinkIcon className={isH2 ? 'size-4' : 'size-3.5'} />
      </a>
    </Tag>
  )
}

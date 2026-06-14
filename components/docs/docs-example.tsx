import type { ReactNode } from 'react'
import { ExampleShowcase } from '@/components/example-showcase'
import { DocsH3 } from './docs-primitives'

// A titled, anchored live example with a Preview/Code toggle for docs pages.
export function DocsExample({
  id,
  title,
  description,
  code,
  children,
}: {
  id: string
  title: string
  description?: ReactNode
  code: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <DocsH3 id={id}>{title}</DocsH3>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      ) : null}
      <ExampleShowcase code={code}>{children}</ExampleShowcase>
    </div>
  )
}

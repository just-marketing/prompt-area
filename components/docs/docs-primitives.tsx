import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Server-rendered content primitives for docs pages. Headings carry stable
// ids so the TableOfContents can track them.

export function DocsLead({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-base leading-relaxed">{children}</p>
}

export function DocsP({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed">{children}</p>
}

export function DocsH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="group/h scroll-mt-28 pt-4 text-xl font-semibold tracking-tight">
      <a href={`#${id}`} className="hover:underline">
        {children}
      </a>
    </h2>
  )
}

export function DocsH3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-28 pt-2 text-base font-semibold">
      <a href={`#${id}`} className="hover:underline">
        {children}
      </a>
    </h3>
  )
}

export function DocsUl({ items }: { items: ReactNode[] }) {
  return (
    <ul className="text-muted-foreground flex flex-col gap-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 leading-relaxed">
          <span className="bg-muted-foreground/50 mt-2 size-1.5 shrink-0 rounded-full" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({
  children,
  variant = 'note',
}: {
  children: ReactNode
  variant?: 'note' | 'warning'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-l-2 py-3 pr-4 pl-4 text-sm leading-relaxed',
        variant === 'warning'
          ? 'text-foreground/80 border-amber-500 bg-amber-500/5'
          : 'border-foreground/20 bg-muted/30 text-foreground/80',
      )}>
      {children}
    </div>
  )
}

export type PropRow = {
  name: string
  type: string
  default?: string
  description: ReactNode
}

export function PropTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 text-left">
            <th className="border-b px-4 py-2.5 text-xs font-medium">Prop</th>
            <th className="border-b px-4 py-2.5 text-xs font-medium">Type</th>
            <th className="border-b px-4 py-2.5 text-xs font-medium">Default</th>
            <th className="border-b px-4 py-2.5 text-xs font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} className={cn(i % 2 === 1 && 'bg-muted/20')}>
              <td className="border-t px-4 py-2.5 align-top">
                <code className="text-foreground font-mono text-xs whitespace-nowrap">
                  {row.name}
                </code>
              </td>
              <td className="border-t px-4 py-2.5 align-top">
                <code className="text-muted-foreground font-mono text-xs">{row.type}</code>
              </td>
              <td className="border-t px-4 py-2.5 align-top">
                <code className="text-muted-foreground font-mono text-xs">
                  {row.default ?? '—'}
                </code>
              </td>
              <td className="text-muted-foreground border-t px-4 py-2.5 align-top leading-relaxed">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

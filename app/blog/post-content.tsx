import type { Block } from './posts'
import { CodeBlock } from '@/components/code-block'

// Renders the typed content blocks of a blog post. Server component — no
// interactivity, just clean semantic HTML for readers and crawlers.
export function PostContent({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="mt-4 text-xl font-semibold tracking-tight">
                {block.text}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="mt-2 text-base font-semibold">
                {block.text}
              </h3>
            )
          case 'p':
            return (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {block.text}
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="text-muted-foreground flex flex-col gap-2 pl-1">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2 leading-relaxed">
                    <span className="text-muted-foreground/50 mt-2 size-1.5 shrink-0 rounded-full bg-current" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="text-muted-foreground flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="bg-accent text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      {j + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )
          case 'code':
            return <CodeBlock key={i} code={block.code} lang={block.lang} />
          case 'callout':
            return (
              <p
                key={i}
                className="border-foreground/20 text-foreground/80 border-l-2 pl-4 text-sm leading-relaxed italic">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}

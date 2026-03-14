import { CircleCheck, CircleMinus, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const COMPETITORS = [
  {
    id: 'react-mentions',
    name: 'react-mentions',
    description: 'Mention library',
    url: 'https://github.com/signavio/react-mentions',
  },
  { id: 'tiptap', name: 'Tiptap', description: 'ProseMirror framework', url: 'https://tiptap.dev' },
  {
    id: 'lexical',
    name: 'Lexical',
    description: 'Meta editor framework',
    url: 'https://lexical.dev',
  },
  { id: 'plate', name: 'Plate.js', description: 'Slate framework', url: 'https://platejs.org' },
  {
    id: 'blocknote',
    name: 'BlockNote',
    description: 'ProseMirror block editor',
    url: 'https://blocknotejs.org',
  },
  {
    id: 'blocksuite',
    name: 'BlockSuite',
    description: 'AFFiNE editor toolkit',
    url: 'https://blocksuite.io',
  },
  {
    id: 'autosize',
    name: 'react-textarea-autosize',
    description: 'Auto-resize textarea',
    url: 'https://github.com/Andarist/react-textarea-autosize',
  },
] as const satisfies readonly { id: string; name: string; description: string; url: string }[]

type CompetitorId = (typeof COMPETITORS)[number]['id']

type Support = 'full' | 'partial' | 'none'

interface ComparisonFeature {
  name: string
  promptArea: Support | string
  values: Record<CompetitorId, Support | string>
}

const FEATURES: ComparisonFeature[] = [
  {
    name: '@Mentions / Tagging',
    promptArea: 'full',
    values: {
      'react-mentions': 'full',
      tiptap: 'partial',
      lexical: 'partial',
      plate: 'full',
      blocknote: 'partial',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Slash Commands',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'full',
      lexical: 'none',
      plate: 'full',
      blocknote: 'full',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Auto-grow on Focus',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'none',
      lexical: 'none',
      plate: 'none',
      blocknote: 'none',
      blocksuite: 'none',
      autosize: 'full',
    },
  },
  {
    name: 'Inline Markdown',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'full',
      lexical: 'full',
      plate: 'full',
      blocknote: 'partial',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Undo / Redo',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'full',
      lexical: 'full',
      plate: 'full',
      blocknote: 'full',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'File & Image Attachments',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'partial',
      lexical: 'none',
      plate: 'partial',
      blocknote: 'full',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Dark Mode',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'none',
      lexical: 'none',
      plate: 'full',
      blocknote: 'full',
      blocksuite: 'partial',
      autosize: 'none',
    },
  },
  {
    name: 'Accessibility (ARIA)',
    promptArea: 'full',
    values: {
      'react-mentions': 'partial',
      tiptap: 'partial',
      lexical: 'full',
      plate: 'full',
      blocknote: 'partial',
      blocksuite: 'partial',
      autosize: 'full',
    },
  },
  {
    name: 'IME Support (CJK)',
    promptArea: 'full',
    values: {
      'react-mentions': 'partial',
      tiptap: 'full',
      lexical: 'full',
      plate: 'partial',
      blocknote: 'partial',
      blocksuite: 'partial',
      autosize: 'full',
    },
  },
  {
    name: 'Copy/Paste Chip Preservation',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'partial',
      lexical: 'partial',
      plate: 'partial',
      blocknote: 'full',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Action Bar / Toolbar',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'partial',
      lexical: 'none',
      plate: 'full',
      blocknote: 'full',
      blocksuite: 'full',
      autosize: 'none',
    },
  },
  {
    name: 'Zero-config State Hook',
    promptArea: 'full',
    values: {
      'react-mentions': 'none',
      tiptap: 'none',
      lexical: 'none',
      plate: 'none',
      blocknote: 'full',
      blocksuite: 'none',
      autosize: 'none',
    },
  },
  {
    name: 'Bundle Approach',
    promptArea: 'shadcn registry',
    values: {
      'react-mentions': 'npm package',
      tiptap: 'npm package',
      lexical: 'npm package',
      plate: 'npm package',
      blocknote: 'npm package',
      blocksuite: 'npm package',
      autosize: 'npm package',
    },
  },
  {
    name: 'Extra Dependencies',
    promptArea: '0',
    values: {
      'react-mentions': '0',
      tiptap: '3+',
      lexical: '2+',
      plate: '5+',
      blocknote: '5+',
      blocksuite: '5+',
      autosize: '0',
    },
  },
]

// ---------------------------------------------------------------------------
// Support indicator
// ---------------------------------------------------------------------------

function SupportIndicator({ value }: { value: Support | string }) {
  if (value === 'full') {
    return (
      <span className="inline-flex items-center" aria-label="Fully supported">
        <CircleCheck className="size-4 text-green-600 dark:text-green-400" />
      </span>
    )
  }
  if (value === 'partial') {
    return (
      <span className="inline-flex items-center" aria-label="Partial support">
        <CircleMinus className="size-4 text-amber-500 dark:text-amber-400" />
      </span>
    )
  }
  if (value === 'none') {
    return (
      <span className="inline-flex items-center" aria-label="Not supported">
        <CircleX className="text-muted-foreground/40 size-4" />
      </span>
    )
  }
  // String value (e.g. "3+", "shadcn registry")
  return <span className="text-muted-foreground text-xs">{value}</span>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComparisonSection() {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th
              scope="col"
              className="bg-background sticky left-0 z-20 min-w-[160px] border-r px-4 py-3 text-left text-xs font-medium">
              Feature
            </th>
            <th
              scope="col"
              className={cn(
                'min-w-[120px] border-r px-4 py-3 text-center',
                'bg-primary/5 border-primary/20',
              )}>
              <a
                href="https://github.com/team-gpt/prompt-area"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-muted-foreground/30 hover:decoration-foreground/50 text-xs font-semibold underline underline-offset-2">
                Prompt Area
              </a>
            </th>
            {COMPETITORS.map((c) => (
              <th
                key={c.id}
                scope="col"
                className="min-w-[120px] border-r px-4 py-3 text-center last:border-r-0">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="decoration-muted-foreground/30 hover:decoration-foreground/50 text-xs font-semibold underline underline-offset-2">
                  {c.name}
                </a>
                <div className="text-muted-foreground text-[10px] font-normal">{c.description}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature, i) => (
            <tr
              key={feature.name}
              className={cn(
                'border-t transition-colors',
                i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
              )}>
              <th
                scope="row"
                className="bg-background sticky left-0 z-20 border-r px-4 py-3 text-left text-xs font-medium">
                {feature.name}
              </th>
              <td
                className={cn('border-r px-4 py-3 text-center', 'bg-primary/5 border-primary/20')}>
                <div className="flex items-center justify-center">
                  <SupportIndicator value={feature.promptArea} />
                </div>
              </td>
              {COMPETITORS.map((c) => (
                <td key={c.id} className="border-r px-4 py-3 text-center last:border-r-0">
                  <div className="flex items-center justify-center">
                    <SupportIndicator value={feature.values[c.id]} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

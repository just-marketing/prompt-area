'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShikiHighlight } from '@/hooks/use-shiki'

interface ExampleShowcaseProps {
  children: React.ReactNode
  code: string
}

export function ExampleShowcase({ children, code }: ExampleShowcaseProps) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const highlightedHtml = useShikiHighlight(code, 'tsx', tab === 'code')

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b">
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              tab === 'preview'
                ? 'border-foreground text-foreground border-b-2 font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab('code')}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              tab === 'code'
                ? 'border-foreground text-foreground border-b-2 font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            Code
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
          aria-label="Copy code">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>

      {tab === 'preview' ? (
        <div className="pt-3">{children}</div>
      ) : highlightedHtml ? (
        <div
          className="bg-muted mt-3 overflow-x-auto rounded-lg p-4 text-sm [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="bg-muted mt-3 overflow-x-auto rounded-lg p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { RemoveButton } from './remove-button'
import type { PromptAreaFile } from './types'

type IconProps = { className?: string }

/** Shared SVG wrapper matching the lucide icon defaults (no dependency). */
function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}>
      {children}
    </svg>
  )
}

const FileBody = (
  <>
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5" />
  </>
)

const File = ({ className }: IconProps) => <Svg className={className}>{FileBody}</Svg>
const FileText = ({ className }: IconProps) => (
  <Svg className={className}>
    {FileBody}
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </Svg>
)
const FileSpreadsheet = ({ className }: IconProps) => (
  <Svg className={className}>
    {FileBody}
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
  </Svg>
)
const FileCode = ({ className }: IconProps) => (
  <Svg className={className}>
    {FileBody}
    <path d="M10 12.5 8 15l2 2.5" />
    <path d="m14 12.5 2 2.5-2 2.5" />
  </Svg>
)
const ImageIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
)

type FileStripProps = {
  files: PromptAreaFile[]
  onRemove?: (file: PromptAreaFile) => void
  onClick?: (file: PromptAreaFile) => void
  className?: string
}

/** Threshold above which collapse activates automatically. */
const COLLAPSE_THRESHOLD = 3

/** Pick a lucide icon key based on MIME type. */
function getFileIconKey(type?: string): 'pdf' | 'spreadsheet' | 'code' | 'image' | 'default' {
  if (!type) return 'default'
  if (type === 'application/pdf') return 'pdf'
  if (type.includes('spreadsheet') || type === 'text/csv') return 'spreadsheet'
  if (
    type.startsWith('text/') ||
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('xml')
  )
    return 'code'
  if (type.startsWith('image/')) return 'image'
  return 'default'
}

const FILE_ICONS = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  code: FileCode,
  image: ImageIcon,
  default: File,
} as const

/** Format bytes into a human-readable string. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/** Extract a short extension label from a filename (e.g., "PDF", "CSV"). */
function getExtensionLabel(name: string): string | null {
  const dot = name.lastIndexOf('.')
  if (dot === -1 || dot === name.length - 1) return null
  return name.slice(dot + 1).toUpperCase()
}

function FileCard({
  file,
  compact,
  onRemove,
  onClick,
}: {
  file: PromptAreaFile
  compact: boolean
  onRemove?: (file: PromptAreaFile) => void
  onClick?: (file: PromptAreaFile) => void
}) {
  const ext = getExtensionLabel(file.name)
  const sizeStr = file.size != null ? formatFileSize(file.size) : null
  const meta = [ext, sizeStr].filter(Boolean).join(' · ')

  return (
    <div
      role="listitem"
      className={cn(
        'border-border relative flex flex-shrink-0 items-center gap-2 overflow-hidden rounded-lg border transition-colors',
        'hover:bg-accent',
        compact ? 'h-10 w-36 px-2' : 'h-14 w-48 px-3',
        onClick && 'cursor-pointer',
      )}
      onClick={() => onClick?.(file)}>
      {(() => {
        const Icon = FILE_ICONS[getFileIconKey(file.type)]
        return (
          <Icon
            className={cn('text-muted-foreground flex-shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')}
          />
        )
      })()}
      <div className="min-w-0 flex-1">
        <div
          className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')}
          title={file.name}>
          {file.name}
        </div>
        {!compact && meta && <div className="text-muted-foreground truncate text-xs">{meta}</div>}
      </div>

      {file.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {onRemove && <RemoveButton onClick={() => onRemove(file)} label={`Remove ${file.name}`} />}
    </div>
  )
}

export function FileStrip({ files, onRemove, onClick, className }: FileStripProps) {
  const [expanded, setExpanded] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!expanded) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [expanded])

  if (files.length === 0) return null

  const collapsible = files.length > COLLAPSE_THRESHOLD
  const compact = collapsible
  const hiddenCount = files.length - COLLAPSE_THRESHOLD
  const visibleFiles = files.slice(0, COLLAPSE_THRESHOLD)

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2" role="list" aria-label="Attached files">
        {(collapsible ? visibleFiles : files).map((file) => (
          <FileCard
            key={file.id}
            file={file}
            compact={compact}
            onRemove={onRemove}
            onClick={onClick}
          />
        ))}
        {collapsible && (
          <div role="listitem">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                'border-border text-muted-foreground hover:bg-accent flex flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors',
                compact ? 'h-10 px-3 text-xs' : 'h-14 px-4 text-sm',
              )}>
              {expanded ? 'Show less' : `+${hiddenCount} more`}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div
          ref={popoverRef}
          className={cn(
            'bg-popover border-border absolute bottom-full left-0 z-10 mb-2 max-h-48 overflow-y-auto rounded-lg border p-2 shadow-lg',
          )}>
          <div className="flex flex-wrap gap-2" role="list" aria-label="More attached files">
            {files.slice(COLLAPSE_THRESHOLD).map((file) => (
              <FileCard
                key={file.id}
                file={file}
                compact={compact}
                onRemove={onRemove}
                onClick={onClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

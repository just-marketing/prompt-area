'use client'

import { cn } from '@/lib/utils'
import { File, FileText, FileSpreadsheet, FileCode, Image as ImageIcon } from 'lucide-react'
import type { PromptAreaFile } from './types'

type FileStripProps = {
  files: PromptAreaFile[]
  onRemove?: (file: PromptAreaFile) => void
  onClick?: (file: PromptAreaFile) => void
  className?: string
}

/** Threshold above which compact mode activates automatically. */
const COMPACT_THRESHOLD = 3

/** Pick a lucide icon based on MIME type. */
function getFileIcon(type?: string) {
  if (!type) return File
  if (type === 'application/pdf') return FileText
  if (type.includes('spreadsheet') || type === 'text/csv') return FileSpreadsheet
  if (
    type.startsWith('text/') ||
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('xml')
  )
    return FileCode
  if (type.startsWith('image/')) return ImageIcon
  return File
}

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

export function FileStrip({ files, onRemove, onClick, className }: FileStripProps) {
  if (files.length === 0) return null

  const compact = files.length > COMPACT_THRESHOLD

  return (
    <div
      className={cn('flex gap-2 overflow-x-auto', className)}
      role="list"
      aria-label="Attached files">
      {files.map((file) => {
        const Icon = getFileIcon(file.type)
        const ext = getExtensionLabel(file.name)
        const sizeStr = file.size != null ? formatFileSize(file.size) : null
        const meta = [ext, sizeStr].filter(Boolean).join(' · ')

        return (
          <div
            key={file.id}
            role="listitem"
            className={cn(
              'border-border relative flex flex-shrink-0 items-center gap-2 overflow-hidden rounded-lg border',
              compact ? 'h-10 w-36 px-2' : 'h-14 w-48 px-3',
              onClick && 'cursor-pointer',
            )}
            onClick={() => onClick?.(file)}>
            <Icon
              className={cn('text-muted-foreground flex-shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')}
            />
            <div className="min-w-0 flex-1">
              <div
                className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')}
                title={file.name}>
                {file.name}
              </div>
              {!compact && meta && (
                <div className="text-muted-foreground truncate text-xs">{meta}</div>
              )}
            </div>

            {/* Loading overlay */}
            {file.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}

            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(file)
                }}
                className={cn(
                  'absolute top-1 right-1 flex h-4 w-4 items-center justify-center',
                  'rounded-full bg-black/60 text-white hover:bg-black/80',
                  'text-xs leading-none transition-colors',
                )}
                aria-label={`Remove ${file.name}`}>
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

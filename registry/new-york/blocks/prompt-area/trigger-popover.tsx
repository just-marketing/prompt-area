'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { TriggerSuggestion } from './types'

type TriggerPopoverProps = {
  suggestions: TriggerSuggestion[]
  loading: boolean
  selectedIndex: number
  onSelect: (suggestion: TriggerSuggestion) => void
  onDismiss: () => void
  triggerRect: DOMRect | null
  triggerChar: string
}

/**
 * Floating popover that displays trigger suggestions.
 * Positioned relative to the trigger character location in the editor.
 */
export function TriggerPopover({
  suggestions,
  loading,
  selectedIndex,
  onSelect,
  onDismiss,
  triggerRect,
  triggerChar,
}: TriggerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target
      if (popoverRef.current && target instanceof Node && !popoverRef.current.contains(target)) {
        onDismiss()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDismiss])

  if (!triggerRect) return null
  if (suggestions.length === 0 && !loading) return null

  // Position the popover below the trigger character
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${triggerRect.left}px`,
    top: `${triggerRect.bottom + 4}px`,
    zIndex: 50,
  }

  return (
    <div
      ref={popoverRef}
      className={cn(
        'max-h-[240px] max-w-[320px] min-w-[200px] overflow-y-auto',
        'bg-popover rounded-xl border p-2 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
      )}
      style={style}
      role="listbox"
      aria-label={`${triggerChar} suggestions`}>
      {loading ? (
        <div className="text-muted-foreground px-3 py-2 text-sm">Loading suggestions...</div>
      ) : (
        suggestions.map((suggestion, index) => (
          <button
            key={suggestion.value}
            ref={index === selectedIndex ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={cn(
              'text-foreground flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm',
              'hover:bg-accent cursor-pointer transition-colors',
              index === selectedIndex && 'bg-accent',
            )}
            onMouseDown={(e) => {
              e.preventDefault() // Prevent blur on the editor
              onSelect(suggestion)
            }}>
            {suggestion.icon && <span className="mt-0.5 shrink-0">{suggestion.icon}</span>}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{suggestion.label}</div>
              {suggestion.description && (
                <div className="text-muted-foreground truncate text-xs">
                  {suggestion.description}
                </div>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  )
}

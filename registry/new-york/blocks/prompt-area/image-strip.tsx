'use client'

import { cn } from '@/lib/utils'
import type { PromptAreaImage } from './types'

type ImageStripProps = {
  images: PromptAreaImage[]
  onRemove?: (image: PromptAreaImage) => void
  onClick?: (image: PromptAreaImage) => void
  className?: string
}

export function ImageStrip({ images, onRemove, onClick, className }: ImageStripProps) {
  if (images.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="list" aria-label="Attached images">
      {images.map((image) => (
        <div
          key={image.id}
          role="listitem"
          className={cn(
            'border-border relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border',
            onClick && 'cursor-pointer',
          )}
          onClick={() => onClick?.(image)}>
          <img
            src={image.url}
            alt={image.alt ?? 'Attached image'}
            className="h-full w-full object-cover"
          />
          {image.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(image)}
              className={cn(
                'absolute top-0.5 right-0.5 grid h-3.5 w-3.5 cursor-pointer place-items-center',
                'rounded-full bg-black/60 text-white hover:bg-black/80',
                'transition-colors',
              )}
              aria-label={`Remove ${image.alt ?? 'image'}`}>
              <svg
                width="8"
                height="8"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round">
                <line x1="2.75" y1="2.75" x2="7.25" y2="7.25" />
                <line x1="7.25" y1="2.75" x2="2.75" y2="7.25" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

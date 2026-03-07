'use client'

import { cn } from '@/lib/utils'
import { RemoveButton } from './remove-button'
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
            <RemoveButton onClick={() => onRemove(image)} label={`Remove ${image.alt ?? 'image'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

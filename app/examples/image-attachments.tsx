'use client'

import { useState, useCallback } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment, PromptAreaImage } from '@/registry/new-york/blocks/prompt-area/types'

const SAMPLE_IMAGES: PromptAreaImage[] = [
  {
    id: 'sample-1',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='4' fill='%234f46e5'/%3E%3Ctext x='32' y='36' text-anchor='middle' fill='white' font-size='20'%3E%F0%9F%8C%84%3C/text%3E%3C/svg%3E",
    alt: 'Landscape',
  },
  {
    id: 'sample-2',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='4' fill='%230d9488'/%3E%3Ctext x='32' y='36' text-anchor='middle' fill='white' font-size='20'%3E%F0%9F%93%8A%3C/text%3E%3C/svg%3E",
    alt: 'Chart',
  },
]

export function ImageAttachmentsExample() {
  const [aboveSegments, setAboveSegments] = useState<Segment[]>([])
  const [belowSegments, setBelowSegments] = useState<Segment[]>([])
  const [aboveImages, setAboveImages] = useState<PromptAreaImage[]>(SAMPLE_IMAGES)
  const [belowImages, setBelowImages] = useState<PromptAreaImage[]>([])

  const [clickedImage, setClickedImage] = useState<string | null>(null)

  const handleImagePaste = useCallback(
    (setFn: React.Dispatch<React.SetStateAction<PromptAreaImage[]>>) => (file: File) => {
      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setFn((prev) => [...prev, { id, url: previewUrl, alt: file.name, loading: true }])
      setTimeout(() => {
        setFn((prev) => prev.map((img) => (img.id === id ? { ...img, loading: false } : img)))
      }, 1500)
    },
    [],
  )

  const handleImageClick = useCallback((image: PromptAreaImage) => {
    setClickedImage(image.alt ?? image.id)
  }, [])

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Images Above (default)</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={aboveSegments}
            onChange={setAboveSegments}
            images={aboveImages}
            imagePosition="above"
            onImagePaste={handleImagePaste(setAboveImages)}
            onImageRemove={(img) => setAboveImages((prev) => prev.filter((i) => i.id !== img.id))}
            onImageClick={handleImageClick}
            onSubmit={() => setAboveSegments([])}
            placeholder="Paste an image here..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Images Below</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={belowSegments}
            onChange={setBelowSegments}
            images={belowImages}
            imagePosition="below"
            onImagePaste={handleImagePaste(setBelowImages)}
            onImageRemove={(img) => setBelowImages((prev) => prev.filter((i) => i.id !== img.id))}
            onImageClick={handleImageClick}
            onSubmit={() => setBelowSegments([])}
            placeholder="Paste an image here..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      {clickedImage && <div className="text-muted-foreground text-xs">Clicked: {clickedImage}</div>}
    </div>
  )
}

export const imageAttachmentsCode = `import { useState, useCallback } from 'react'
import { PromptArea } from '@/components/prompt-area'
import type { Segment, PromptAreaImage } from '@/components/types'

function ImageAttachmentsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [images, setImages] = useState<PromptAreaImage[]>([])

  const handleImagePaste = useCallback((file: File) => {
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setImages((prev) => [...prev, { id, url: previewUrl, alt: file.name, loading: true }])
    // Simulate upload
    setTimeout(() => {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, loading: false } : img)))
    }, 1500)
  }, [])

  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      images={images}
      imagePosition="above"
      onImagePaste={handleImagePaste}
      onImageRemove={(img) => setImages((prev) => prev.filter((i) => i.id !== img.id))}
      onImageClick={(img) => console.log('Clicked:', img.alt)}
      onSubmit={() => setSegments([])}
      placeholder="Paste an image here..."
      minHeight={48}
      maxHeight={200}
    />
  )
}`

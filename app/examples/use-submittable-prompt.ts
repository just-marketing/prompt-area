'use client'

import { useCallback, useRef, useState } from 'react'
import {
  segmentsToPlainText,
  isSegmentsEmpty,
  type Segment,
  type PromptAreaHandle,
  type PromptAreaImage,
} from 'prompt-area'

// Snapshot kept around after submit so Reset can restore the exact input.
type Submission<F> = {
  text: string
  segments: Segment[]
  files: F[]
  images: PromptAreaImage[]
}

/**
 * Shared submit/reset state for the example composers. On submit it snapshots
 * the input and clears it; on reset it restores that snapshot into the prompt
 * area (so the demo can be submitted again) and refocuses. `F` is the example's
 * own file shape — examples without files/images simply ignore those fields.
 */
export function useSubmittablePrompt<F = never>({
  initialSegments = [],
  initialFiles = [],
  initialImages = [],
}: { initialSegments?: Segment[]; initialFiles?: F[]; initialImages?: PromptAreaImage[] } = {}) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments)
  const [files, setFiles] = useState<F[]>(initialFiles)
  const [images, setImages] = useState<PromptAreaImage[]>(initialImages)
  const [submitted, setSubmitted] = useState<Submission<F> | null>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const submit = useCallback(
    (segs: Segment[]) => {
      if (isSegmentsEmpty(segs)) return
      setSubmitted({ text: segmentsToPlainText(segs), segments: segs, files, images })
      promptRef.current?.clear()
      setSegments([])
      setFiles([])
      setImages([])
    },
    [files, images],
  )

  const reset = useCallback(() => {
    setSubmitted((prev) => {
      if (prev) {
        setSegments(prev.segments)
        setFiles(prev.files)
        setImages(prev.images)
        promptRef.current?.focus()
      }
      return null
    })
  }, [])

  return {
    segments,
    setSegments,
    files,
    setFiles,
    images,
    setImages,
    submitted,
    promptRef,
    submit,
    reset,
  }
}

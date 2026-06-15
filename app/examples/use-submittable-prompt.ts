'use client'

import { useCallback, useRef, useState } from 'react'
import {
  segmentsToPlainText,
  isSegmentsEmpty,
} from '@/registry/new-york/blocks/prompt-area/segment-helpers'
import type { Segment, PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'

// Snapshot kept around after submit so Reset can restore the exact input.
type Submission<F> = { text: string; segments: Segment[]; files: F[] }

/**
 * Shared submit/reset state for the example composers. On submit it snapshots
 * the input and clears it; on reset it restores that snapshot into the prompt
 * area (so the demo can be submitted again) and refocuses. `F` is the example's
 * own file shape — examples without files simply ignore `files`/`setFiles`.
 */
export function useSubmittablePrompt<F = never>({
  initialSegments = [],
  initialFiles = [],
}: { initialSegments?: Segment[]; initialFiles?: F[] } = {}) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments)
  const [files, setFiles] = useState<F[]>(initialFiles)
  const [submitted, setSubmitted] = useState<Submission<F> | null>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const submit = useCallback(
    (segs: Segment[]) => {
      if (isSegmentsEmpty(segs)) return
      setSubmitted({ text: segmentsToPlainText(segs), segments: segs, files })
      promptRef.current?.clear()
      setSegments([])
      setFiles([])
    },
    [files],
  )

  const reset = useCallback(() => {
    setSubmitted((prev) => {
      if (prev) {
        setSegments(prev.segments)
        setFiles(prev.files)
        promptRef.current?.focus()
      }
      return null
    })
  }, [])

  return { segments, setSegments, files, setFiles, submitted, promptRef, submit, reset }
}

'use client'

import { useCallback, useRef } from 'react'
import type { Segment, ChipSegment, TriggerConfig } from './types'
import { resolveTriggersInSegments } from './prompt-area-engine'
import { normalizeEditorDOM, safeJsonStringify, getSelectionRange } from './dom-helpers'
import {
  serializeFragmentToPlainText,
  serializeFragmentToSegments,
  parseSegmentsFromClipboard,
  insertSegmentsAtCursor,
} from './clipboard-helpers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventHandlerDeps = {
  editorRef: React.RefObject<HTMLDivElement | null>
  readSegmentsFromDOM: () => Segment[]
  onChange: (segments: Segment[]) => void
  renderSegmentsToDOM: (segments: Segment[]) => void
  runTriggerDetection: () => void
  dismissTrigger: () => void
  triggers: TriggerConfig[]
  onPaste?: (data: { segments: Segment[]; source: 'internal' | 'external' }) => void
  onUndo?: (segments: Segment[]) => void
  onRedo?: (segments: Segment[]) => void
  onChipAdd?: (chip: ChipSegment) => void
  onImagePaste?: (file: File) => void
}

type PromptAreaEventHandlers = {
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
  handleCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void
  handleCut: (e: React.ClipboardEvent<HTMLDivElement>) => void
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
  handleBlur: () => void
  handleKeyDownForUndoRedo: (e: React.KeyboardEvent<HTMLDivElement>) => boolean
  pushUndo: (segments: Segment[]) => void
  resetUndoHistory: () => void
  isComposing: React.RefObject<boolean>
}

// ---------------------------------------------------------------------------
// Undo/Redo Stack
// ---------------------------------------------------------------------------

const MAX_UNDO_HISTORY = 100

/** Delay before dismissing trigger on blur, so popover clicks register first */
export const BLUR_DELAY_MS = 150

type UndoState = {
  undoStack: Segment[][]
  redoStack: Segment[][]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Encapsulates all edge-case event handlers for the prompt area component:
 * paste, copy, cut, drag/drop, IME composition, blur, and undo/redo.
 */
export function usePromptAreaEvents(deps: EventHandlerDeps): PromptAreaEventHandlers {
  const {
    editorRef,
    readSegmentsFromDOM,
    onChange,
    renderSegmentsToDOM,
    runTriggerDetection,
    dismissTrigger,
    triggers,
    onPaste: onPasteCallback,
    onUndo,
    onRedo,
    onChipAdd,
    onImagePaste,
  } = deps

  const isComposing = useRef(false)

  // -----------------------------------------------------------------------
  // Undo/redo stack (MAX_UNDO_HISTORY entries; clears redo on new push).
  // Invariants: stacks live in refs (not useState) so pushUndo /
  // resetUndoHistory / handleKeyDownForUndoRedo keep stable identity.
  // Destabilizing this would re-create handleInput / handleKeyDown /
  // imperative handle on every render and silently regress IME + debounced
  // undo in the parent hook.
  // -----------------------------------------------------------------------
  const undoState = useRef<UndoState>({ undoStack: [], redoStack: [] })

  const pushUndo = useCallback((segments: Segment[]) => {
    const state = undoState.current
    state.undoStack.push(segments)
    if (state.undoStack.length > MAX_UNDO_HISTORY) {
      state.undoStack.shift()
    }
    // Clear redo stack on new change
    state.redoStack = []
  }, [])

  const resetUndoHistory = useCallback(() => {
    undoState.current = { undoStack: [], redoStack: [] }
  }, [])

  // -----------------------------------------------------------------------
  // Paste: strip HTML, insert plain text only
  // -----------------------------------------------------------------------

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault()

      const editor = editorRef.current
      if (!editor) return

      // Check for image files in clipboard before processing text
      // Some browsers/OSes provide pasted images via `items` instead of `files` (e.g. screenshots)
      const imageFile =
        Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/')) ??
        (() => {
          const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
          return item?.getAsFile() ?? null
        })()
      if (imageFile) {
        onImagePaste?.(imageFile)
        return
      }

      // Record undo snapshot
      const currentSegments = readSegmentsFromDOM()
      pushUndo(currentSegments)

      // Check for internal segment data (copy/paste within the editor)
      const segmentJson = e.clipboardData.getData('text/prompt-area-segments')
      if (segmentJson) {
        const parsed = parseSegmentsFromClipboard(segmentJson)
        if (parsed && parsed.length > 0) {
          // Insert the copied segments at cursor position
          const range = getSelectionRange()
          if (!range) return

          range.deleteContents()

          // Merge pasted segments into current segments at cursor position
          const beforePaste = readSegmentsFromDOM()
          const merged = insertSegmentsAtCursor(beforePaste, parsed, editor)
          onChange(merged)
          renderSegmentsToDOM(merged)

          // Notify: internal paste with chip data preserved
          onPasteCallback?.({ segments: merged, source: 'internal' })
          for (const seg of parsed) {
            if (seg.type === 'chip') {
              onChipAdd?.(seg)
            }
          }

          runTriggerDetection()
          return
        }
      }

      // Fall back to plain text paste
      const text = e.clipboardData.getData('text/plain')
      if (!text) return

      // Insert plain text at cursor position using Selection API
      const range = getSelectionRange()
      if (!range) return

      range.deleteContents()

      // Handle multi-line paste: split into lines with BR elements
      const lines = text.split('\n')
      const fragment = document.createDocumentFragment()

      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          fragment.appendChild(document.createTextNode(lines[i]))
        }
        if (i < lines.length - 1) {
          fragment.appendChild(document.createElement('br'))
        }
      }

      range.insertNode(fragment)

      // Move cursor to end of pasted content
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)

      // Normalize DOM, sync model, detect triggers
      normalizeEditorDOM(editor)
      const newSegments = readSegmentsFromDOM()

      // Auto-resolve trigger patterns in pasted text (e.g., #readme -> chip)
      const resolvedSegments = resolveTriggersInSegments(newSegments, triggers)

      if (resolvedSegments !== newSegments) {
        onChange(resolvedSegments)
        renderSegmentsToDOM(resolvedSegments)

        // Notify about auto-resolved chips from pasted text
        for (const seg of resolvedSegments) {
          if (
            seg.type === 'chip' &&
            !newSegments.some(
              (s) =>
                s.type === 'chip' &&
                s.trigger === seg.trigger &&
                s.value === seg.value &&
                s.displayText === seg.displayText,
            )
          ) {
            onChipAdd?.(seg)
          }
        }
      } else {
        onChange(newSegments)
      }

      onPasteCallback?.({ segments: resolvedSegments, source: 'external' })
      runTriggerDetection()
    },
    [
      editorRef,
      readSegmentsFromDOM,
      onChange,
      pushUndo,
      runTriggerDetection,
      renderSegmentsToDOM,
      triggers,
      onPasteCallback,
      onChipAdd,
      onImagePaste,
    ],
  )

  // -----------------------------------------------------------------------
  // Copy: serialize chips into plain text
  // -----------------------------------------------------------------------

  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()

    const range = getSelectionRange()
    if (!range) return

    const fragment = range.cloneContents()

    // Walk fragment and serialize, converting chips to their text representation
    const plainText = serializeFragmentToPlainText(fragment)
    e.clipboardData.setData('text/plain', plainText)

    // Also serialize chip segments as JSON for internal paste
    const fragmentSegments = serializeFragmentToSegments(fragment)
    const hasChips = fragmentSegments.some((s) => s.type === 'chip')
    if (hasChips) {
      const json = safeJsonStringify(fragmentSegments)
      if (json) {
        e.clipboardData.setData('text/prompt-area-segments', json)
      }
    }
  }, [])

  // -----------------------------------------------------------------------
  // Cut: copy + delete
  // -----------------------------------------------------------------------

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      // First, do the copy
      handleCopy(e)

      // Then delete the selection
      const range = getSelectionRange()
      if (!range) return

      const currentSegments = readSegmentsFromDOM()
      pushUndo(currentSegments)

      range.deleteContents()

      const editor = editorRef.current
      if (editor) {
        normalizeEditorDOM(editor)
      }

      const newSegments = readSegmentsFromDOM()
      onChange(newSegments)
      runTriggerDetection()
    },
    [handleCopy, editorRef, readSegmentsFromDOM, onChange, pushUndo, runTriggerDetection],
  )

  // -----------------------------------------------------------------------
  // Drag & Drop: prevent to avoid unpredictable DOM mutations
  // -----------------------------------------------------------------------

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // -----------------------------------------------------------------------
  // IME Composition: track state, defer trigger detection
  // -----------------------------------------------------------------------

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false
    // Run trigger detection after composition ends
    runTriggerDetection()
  }, [runTriggerDetection])

  // -----------------------------------------------------------------------
  // Blur: dismiss trigger dropdown with delay (so popover clicks work)
  // -----------------------------------------------------------------------

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      const editor = editorRef.current
      if (!editor) return

      // Only dismiss if focus didn't move to an element within the editor container
      const activeEl = document.activeElement
      if (activeEl && editor.parentElement?.contains(activeEl)) return

      dismissTrigger()
    }, BLUR_DELAY_MS)
  }, [editorRef, dismissTrigger])

  // -----------------------------------------------------------------------
  // Undo/Redo: intercept Ctrl+Z / Ctrl+Shift+Z
  // -----------------------------------------------------------------------

  const handleKeyDownForUndoRedo = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      const isMeta = e.metaKey || e.ctrlKey

      if (!isMeta || e.key !== 'z') return false

      e.preventDefault()
      const state = undoState.current

      if (e.shiftKey) {
        // Redo: Ctrl+Shift+Z
        if (state.redoStack.length === 0) return true

        const segments = state.redoStack.pop()
        if (!segments) return true

        const current = readSegmentsFromDOM()
        state.undoStack.push(current)

        onChange(segments)
        renderSegmentsToDOM(segments)
        onRedo?.(segments)
      } else {
        // Undo: Ctrl+Z
        if (state.undoStack.length === 0) return true

        const segments = state.undoStack.pop()
        if (!segments) return true

        const current = readSegmentsFromDOM()
        state.redoStack.push(current)

        onChange(segments)
        renderSegmentsToDOM(segments)
        onUndo?.(segments)
      }

      return true
    },
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, onUndo, onRedo],
  )

  return {
    handlePaste,
    handleCopy,
    handleCut,
    handleDrop,
    handleDragOver,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    handleKeyDownForUndoRedo,
    pushUndo,
    resetUndoHistory,
    isComposing,
  }
}

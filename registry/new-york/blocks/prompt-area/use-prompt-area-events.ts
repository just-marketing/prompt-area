'use client'

import { useCallback, useRef } from 'react'
import type { Segment, ChipSegment, TriggerConfig } from './types'
import { resolveTriggersInSegments } from './prompt-area-engine'
import {
  isChipElement,
  isHTMLElement,
  normalizeEditorDOM,
  getChipTrigger,
  getChipValue,
  getChipDisplay,
  getChipData,
  getChipAutoResolved,
  safeJsonStringify,
  getSelectionRange,
} from './dom-helpers'

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
  const undoState = useRef<UndoState>({ undoStack: [], redoStack: [] })

  // Track previous segments for undo stack
  const prevSegments = useRef<Segment[]>([])

  /**
   * Push current state onto the undo stack.
   * Called before any programmatic change.
   */
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
    prevSegments.current = []
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
          prevSegments.current = merged
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
        prevSegments.current = resolvedSegments
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
        prevSegments.current = newSegments
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
      prevSegments.current = newSegments
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

        prevSegments.current = segments
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

        prevSegments.current = segments
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Serializes a DocumentFragment (from selection) to plain text,
 * converting chip elements to their `trigger + displayText` form.
 */
function serializeFragmentToPlainText(fragment: DocumentFragment): string {
  let text = ''

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? ''
    } else if (isChipElement(node)) {
      const trigger = node.dataset.chipTrigger ?? ''
      const display = node.dataset.chipDisplay ?? node.textContent ?? ''
      text += trigger + display
    } else if (isHTMLElement(node) && node.tagName === 'BR') {
      text += '\n'
    } else {
      node.childNodes.forEach(walk)
    }
  }

  fragment.childNodes.forEach(walk)
  return text
}

/**
 * Serializes a DocumentFragment to an array of Segment objects,
 * preserving chip data for internal copy/paste.
 */
function serializeFragmentToSegments(fragment: DocumentFragment): Segment[] {
  const segments: Segment[] = []

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        segments.push({ type: 'text', text })
      }
    } else if (isChipElement(node)) {
      const trigger = getChipTrigger(node)
      const chipValue = getChipValue(node)
      const display = getChipDisplay(node)
      const data = getChipData(node)
      const autoResolved = getChipAutoResolved(node)

      if (trigger && chipValue !== undefined && display) {
        const chip: ChipSegment = {
          type: 'chip',
          trigger,
          value: chipValue,
          displayText: display,
          ...(data !== undefined ? { data } : {}),
          ...(autoResolved ? { autoResolved: true } : {}),
        }
        segments.push(chip)
      }
    } else if (isHTMLElement(node) && node.tagName === 'BR') {
      segments.push({ type: 'text', text: '\n' })
    } else {
      node.childNodes.forEach(walk)
    }
  }

  fragment.childNodes.forEach(walk)
  return segments
}

/**
 * Parses segment JSON from the clipboard. Returns null if invalid.
 */
function parseSegmentsFromClipboard(json: string): Segment[] | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return null

    // Validate each segment has the expected shape
    const segments: Segment[] = []
    for (const item of parsed) {
      if (!isRecord(item)) return null

      if (item.type === 'text' && typeof item.text === 'string') {
        segments.push({ type: 'text', text: item.text })
      } else if (
        item.type === 'chip' &&
        typeof item.trigger === 'string' &&
        typeof item.value === 'string' &&
        typeof item.displayText === 'string'
      ) {
        const chip: ChipSegment = {
          type: 'chip',
          trigger: item.trigger,
          value: item.value,
          displayText: item.displayText,
          ...(item.data !== undefined ? { data: item.data } : {}),
          ...(item.autoResolved ? { autoResolved: true } : {}),
        }
        segments.push(chip)
      } else {
        return null
      }
    }

    return segments
  } catch {
    return null
  }
}

/**
 * Inserts pasted segments at the current cursor position within existing segments.
 * Splits the text segment at the cursor to insert the pasted content.
 */
function insertSegmentsAtCursor(
  currentSegments: Segment[],
  pastedSegments: Segment[],
  editor: HTMLElement,
): Segment[] {
  // Get cursor offset in the editor
  const range = getSelectionRange()
  if (!range) return [...currentSegments, ...pastedSegments]

  const preRange = document.createRange()
  preRange.selectNodeContents(editor)
  preRange.setEnd(range.startContainer, range.startOffset)

  // Calculate character offset by walking the pre-range fragment
  let cursorOffset = 0
  const fragment = preRange.cloneContents()
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      cursorOffset += (node.textContent ?? '').length
    } else if (isChipElement(node)) {
      const trigger = node.dataset.chipTrigger ?? ''
      const display = node.dataset.chipDisplay ?? node.textContent ?? ''
      cursorOffset += trigger.length + display.length
    } else if (isHTMLElement(node) && node.tagName === 'BR') {
      cursorOffset += 1
    } else {
      node.childNodes.forEach(walk)
    }
  }
  fragment.childNodes.forEach(walk)

  // Split current segments at cursor offset and insert pasted segments
  const result: Segment[] = []
  let offset = 0

  for (const seg of currentSegments) {
    if (seg.type === 'chip') {
      const chipLen = seg.trigger.length + seg.displayText.length
      if (offset + chipLen <= cursorOffset) {
        result.push(seg)
      } else if (offset >= cursorOffset) {
        // Will be added after pasted segments
        break
      }
      offset += chipLen
    } else {
      if (offset + seg.text.length <= cursorOffset) {
        result.push(seg)
        offset += seg.text.length
      } else if (offset >= cursorOffset) {
        break
      } else {
        // Split this text segment at cursor
        const splitAt = cursorOffset - offset
        const before = seg.text.slice(0, splitAt)
        if (before) {
          result.push({ type: 'text', text: before })
        }
        offset += seg.text.length
        break
      }
    }
  }

  // Insert pasted segments
  result.push(...pastedSegments)

  // Add remaining segments after cursor
  let pastCursor = false
  let remaining = 0
  for (const seg of currentSegments) {
    if (seg.type === 'chip') {
      const chipLen = seg.trigger.length + seg.displayText.length
      if (remaining + chipLen > cursorOffset) {
        if (pastCursor) {
          result.push(seg)
        } else {
          pastCursor = true
        }
      }
      remaining += chipLen
    } else {
      if (remaining >= cursorOffset) {
        if (pastCursor) {
          result.push(seg)
        } else {
          // This text segment was split — add the remainder
          const splitAt = cursorOffset - remaining
          if (splitAt < 0) {
            result.push(seg)
          } else {
            const after = seg.text.slice(cursorOffset - remaining)
            if (after) {
              result.push({ type: 'text', text: after })
            }
          }
          pastCursor = true
        }
      }
      remaining += seg.text.length
    }
  }

  // Merge adjacent text segments
  const merged: Segment[] = []
  for (const seg of result) {
    if (seg.type === 'text' && seg.text === '') continue
    const last = merged[merged.length - 1]
    if (seg.type === 'text' && last?.type === 'text') {
      merged[merged.length - 1] = { type: 'text', text: last.text + seg.text }
    } else {
      merged.push(seg)
    }
  }

  return merged
}

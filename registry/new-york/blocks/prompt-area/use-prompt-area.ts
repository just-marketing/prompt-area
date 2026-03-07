'use client'

import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Segment,
  TriggerConfig,
  ActiveTrigger,
  TriggerSuggestion,
  ChipSegment,
  PromptAreaHandle,
} from './types'
import {
  detectActiveTrigger,
  segmentsToPlainText,
  segmentsEqual,
  resolveChip,
  removeChipAtIndex,
  revertChipAtIndex,
  getListContext,
  autoFormatListPrefix,
  insertListContinuation,
  indentListItem,
  outdentListItem,
  removeListPrefix,
  replaceTextRange,
  toggleMarkdownWrap,
} from './prompt-area-engine'
import {
  isHTMLElement,
  isChipElement,
  isLinkElement,
  isBRElement,
  getChipTrigger,
  getChipValue,
  getChipDisplay,
  getChipData,
  getChipAutoResolved,
  getDirectChildContaining,
  indexOfChildNode,
  normalizeEditorDOM,
  decorateURLsInEditor,
  decorateMarkdownInEditor,
  safeJsonStringify,
  getSelectionRange,
} from './dom-helpers'
import { usePromptAreaEvents } from './use-prompt-area-events'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UsePromptAreaOptions = {
  value: Segment[]
  onChange: (segments: Segment[]) => void
  triggers?: TriggerConfig[]
  onSubmit?: (segments: Segment[]) => void
  onEscape?: () => void
  onChipClick?: (chip: ChipSegment) => void
  onChipAdd?: (chip: ChipSegment) => void
  onChipDelete?: (chip: ChipSegment) => void
  onLinkClick?: (url: string) => void
  onPaste?: (data: { segments: Segment[]; source: 'internal' | 'external' }) => void
  onUndo?: (segments: Segment[]) => void
  onRedo?: (segments: Segment[]) => void
  onImagePaste?: (file: File) => void
  markdown?: boolean
}

type UsePromptAreaReturn = {
  editorRef: React.RefObject<HTMLDivElement | null>
  activeTrigger: ActiveTrigger | null
  suggestions: TriggerSuggestion[]
  suggestionsLoading: boolean
  selectedSuggestionIndex: number
  handleInput: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handleClick: (e: React.MouseEvent<HTMLDivElement>) => void
  selectSuggestion: (suggestion: TriggerSuggestion) => void
  dismissTrigger: () => void
  handle: PromptAreaHandle
  triggerRect: DOMRect | null
  eventHandlers: {
    onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
    onCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void
    onCut: (e: React.ClipboardEvent<HTMLDivElement>) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    onCompositionStart: () => void
    onCompositionEnd: () => void
    onBlur: () => void
  }
}

/** Debounce interval for grouping typed characters into a single undo snapshot */
const UNDO_DEBOUNCE_MS = 300

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePromptArea({
  value,
  onChange,
  triggers = [],
  onSubmit,
  onEscape,
  onChipClick,
  onChipAdd,
  onChipDelete,
  onLinkClick,
  onPaste,
  onUndo,
  onRedo,
  onImagePaste,
  markdown: markdownEnabled = true,
}: UsePromptAreaOptions): UsePromptAreaReturn {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [activeTrigger, setActiveTrigger] = useState<ActiveTrigger | null>(null)
  const [suggestions, setSuggestions] = useState<TriggerSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  // Guard against circular DOM <-> model syncs
  const isSyncing = useRef(false)
  const lastRenderedValue = useRef<Segment[]>([])

  // Version counter for async search race condition prevention
  const searchVersion = useRef(0)

  // Debounced undo: groups consecutive keystrokes into a single undo snapshot
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoBaseState = useRef<Segment[] | null>(null)

  // -----------------------------------------------------------------------
  // DOM -> Model: read segments from the contentEditable DOM
  // -----------------------------------------------------------------------

  const readSegmentsFromDOM = useCallback((): Segment[] => {
    const editor = editorRef.current
    if (!editor) return []

    const segments: Segment[] = []

    for (let i = 0; i < editor.childNodes.length; i++) {
      const node = editor.childNodes[i]

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? ''
        if (text) {
          segments.push({ type: 'text', text })
        }
      } else if (isChipElement(node)) {
        // Type-safe chip reading via type guards
        const trigger = getChipTrigger(node)
        const chipValue = getChipValue(node)
        const display = getChipDisplay(node)
        const data = getChipData(node)

        if (trigger && chipValue !== undefined && display) {
          const autoResolved = getChipAutoResolved(node)
          segments.push({
            type: 'chip',
            trigger,
            value: chipValue,
            displayText: display,
            ...(data !== undefined ? { data } : {}),
            ...(autoResolved ? { autoResolved: true } : {}),
          })
        }
      } else if (isBRElement(node)) {
        if (node.dataset.sentinel) continue // skip sentinel <br>
        segments.push({ type: 'text', text: '\n' })
      } else if (isHTMLElement(node)) {
        // Unknown element — extract text content
        const text = node.textContent ?? ''
        if (text) {
          segments.push({ type: 'text', text })
        }
      }
    }

    return segments
  }, [])

  // -----------------------------------------------------------------------
  // Model -> DOM: render segments into the contentEditable div
  // -----------------------------------------------------------------------

  const renderSegmentsToDOM = useCallback(
    (segments: Segment[]) => {
      const editor = editorRef.current
      if (!editor) return

      isSyncing.current = true

      const savedCursor = saveCursorPosition(editor)

      // Clear DOM safely (no innerHTML assignment)
      while (editor.firstChild) {
        editor.removeChild(editor.firstChild)
      }

      for (const seg of segments) {
        if (seg.type === 'text') {
          const lines = seg.text.split('\n')
          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            if (lines[lineIdx]) {
              editor.appendChild(document.createTextNode(lines[lineIdx]))
            }
            if (lineIdx < lines.length - 1) {
              editor.appendChild(document.createElement('br'))
            }
          }
        } else {
          // Render chip as non-editable span
          const chip = document.createElement('span')
          chip.contentEditable = 'false'
          chip.dataset.chipTrigger = seg.trigger
          chip.dataset.chipValue = seg.value
          chip.dataset.chipDisplay = seg.displayText
          if (seg.data !== undefined) {
            const json = safeJsonStringify(seg.data)
            if (json) {
              chip.dataset.chipData = json
            }
          }
          if (seg.autoResolved) {
            chip.dataset.chipAutoResolved = 'true'
          }
          const triggerConfig = triggers.find((t) => t.char === seg.trigger)
          const chipStyle = triggerConfig?.chipStyle ?? 'pill'
          chip.dataset.chipStyle = chipStyle
          chip.className = cn(
            'prompt-area-chip',
            chipStyle === 'inline' && 'prompt-area-chip--inline',
            triggerConfig?.chipClassName,
          )
          chip.textContent = `${seg.trigger}${seg.displayText}`
          chip.setAttribute('role', 'button')
          chip.setAttribute('tabindex', '-1')
          editor.appendChild(chip)
        }
      }

      // Append sentinel <br> so trailing newlines are visible in contentEditable
      if (editor.lastChild && isBRElement(editor.lastChild)) {
        const sentinel = document.createElement('br')
        sentinel.dataset.sentinel = 'true'
        editor.appendChild(sentinel)
      }

      // Decorate URLs and markdown formatting in text nodes
      decorateURLsInEditor(editor)
      if (markdownEnabled) decorateMarkdownInEditor(editor)

      if (savedCursor) {
        restoreCursorPosition(editor, savedCursor)
      }

      lastRenderedValue.current = segments
      isSyncing.current = false
    },
    [triggers, markdownEnabled],
  )

  // -----------------------------------------------------------------------
  // Trigger detection (extracted so events module can call it)
  // -----------------------------------------------------------------------

  const runTriggerDetection = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const segments = readSegmentsFromDOM()
    const plainText = segmentsToPlainText(segments)
    const cursorPos = getCursorOffset(editor)

    if (cursorPos === null) return

    const detected = detectActiveTrigger(plainText, cursorPos, triggers)

    if (detected) {
      setActiveTrigger(detected)
      setSelectedSuggestionIndex(0)

      // Position the popover at the trigger character, not the cursor.
      // Build a range at detected.startOffset so the dropdown anchors to
      // the trigger char even when the cursor has moved past it.
      const triggerRange = createRangeAtOffset(editor, detected.startOffset)
      if (triggerRange) {
        const rect = triggerRange.getBoundingClientRect()
        // A zero rect means the range couldn't be mapped (e.g. after DOM
        // re-render). Skip updating triggerRect so we keep the last valid one.
        if (rect.height > 0 || rect.left > 0 || rect.top > 0) {
          setTriggerRect(rect)
        }
      }

      // Fetch suggestions for dropdown mode with race condition prevention
      if (detected.config.mode === 'dropdown' && detected.config.onSearch) {
        setSuggestionsLoading(true)
        searchVersion.current++
        const version = searchVersion.current
        const result = detected.config.onSearch(detected.query)

        if (result instanceof Promise) {
          void result.then((items) => {
            if (searchVersion.current === version) {
              setSuggestions(items)
              setSuggestionsLoading(false)
            }
          })
        } else {
          setSuggestions(result)
          setSuggestionsLoading(false)
        }
      }

      // Fire callback for callback mode
      if (detected.config.mode === 'callback' && detected.config.onActivate) {
        detected.config.onActivate({
          text: plainText,
          cursorPosition: cursorPos,
          insertChip: (chip) => {
            const chipResult = resolveChip(segments, detected, {
              value: chip.value,
              displayText: chip.displayText,
              data: chip.data,
            })
            onChange(chipResult.segments)
            renderSegmentsToDOM(chipResult.segments)

            onChipAdd?.({
              type: 'chip',
              trigger: detected.config.char,
              value: chip.value,
              displayText: chip.displayText,
              ...(chip.data !== undefined ? { data: chip.data } : {}),
            })

            const editor = editorRef.current
            if (editor) {
              setCursorAtOffset(editor, chipResult.cursorOffset)
            }
          },
        })
      }
    } else {
      setActiveTrigger(null)
      setSuggestions([])
    }
  }, [triggers, readSegmentsFromDOM, onChange, renderSegmentsToDOM, onChipAdd])

  // -----------------------------------------------------------------------
  // Dismiss trigger
  // -----------------------------------------------------------------------

  const dismissTrigger = useCallback(() => {
    setActiveTrigger(null)
    setSuggestions([])
    setSelectedSuggestionIndex(0)
  }, [])

  // -----------------------------------------------------------------------
  // Wire up edge-case event handlers
  // -----------------------------------------------------------------------

  const events = usePromptAreaEvents({
    editorRef,
    readSegmentsFromDOM,
    onChange,
    renderSegmentsToDOM,
    runTriggerDetection,
    dismissTrigger,
    triggers,
    onPaste,
    onUndo,
    onRedo,
    onChipAdd,
    onImagePaste,
  })

  // -----------------------------------------------------------------------
  // Sync value prop -> DOM on external changes
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (isSyncing.current) return
    if (segmentsEqual(value, lastRenderedValue.current)) return
    renderSegmentsToDOM(value)
  }, [value, renderSegmentsToDOM])

  // Re-render when markdown mode changes to apply/strip decorations
  // Also convert bullet characters: • ↔ - in text segments
  const prevMarkdown = useRef(markdownEnabled)
  useEffect(() => {
    if (prevMarkdown.current === markdownEnabled) return
    prevMarkdown.current = markdownEnabled

    const converted = value.map((seg) => {
      if (seg.type !== 'text') return seg
      // markdown OFF: replace "• " with "- " | markdown ON: replace "- " with "• "
      const newText = markdownEnabled
        ? seg.text.replace(/(^|\n)(\s*)- /g, '$1$2\u2022 ')
        : seg.text.replace(/(^|\n)(\s*)\u2022 /g, '$1$2- ')
      return newText === seg.text ? seg : { ...seg, text: newText }
    })

    const changed = converted.some((seg, i) => seg !== value[i])
    if (changed) {
      onChange(converted)
    } else {
      renderSegmentsToDOM(value)
    }
  }, [markdownEnabled, renderSegmentsToDOM, value, onChange])

  // Clean up undo debounce timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  // -----------------------------------------------------------------------
  // Handle input events
  // -----------------------------------------------------------------------

  const handleInput = useCallback(() => {
    if (isSyncing.current) return

    // During IME composition, sync model but skip trigger detection
    if (events.isComposing.current) {
      const segments = readSegmentsFromDOM()
      lastRenderedValue.current = segments
      onChange(segments)
      return
    }

    const editor = editorRef.current

    // Capture cursor offset BEFORE normalizeEditorDOM strips <a> elements,
    // otherwise the anchor node becomes detached and we lose the position.
    const savedCursorOffset = editor ? getCursorOffset(editor) : null

    if (editor) {
      // Normalize browser-inserted block elements (div, p, font, a, etc.)
      normalizeEditorDOM(editor)
    }

    const segments = readSegmentsFromDOM()

    // Check for list auto-formatting (e.g., "- " -> "bullet ")
    if (markdownEnabled && editor && savedCursorOffset !== null) {
      const formatted = autoFormatListPrefix(segments, savedCursorOffset)
      if (formatted) {
        lastRenderedValue.current = formatted.segments
        onChange(formatted.segments)
        renderSegmentsToDOM(formatted.segments)
        setCursorAtOffset(editor, formatted.cursorOffset)
        runTriggerDetection()
        return
      }
    }

    // Debounced undo: capture the pre-edit state at the start of a typing
    // session and push it to the undo stack after UNDO_DEBOUNCE_MS of idle.
    if (!undoBaseState.current) {
      undoBaseState.current = lastRenderedValue.current
    }

    lastRenderedValue.current = segments
    onChange(segments)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => {
      if (undoBaseState.current) {
        events.pushUndo(undoBaseState.current)
        undoBaseState.current = null
      }
      undoTimer.current = null
    }, UNDO_DEBOUNCE_MS)

    // Decorate URLs and markdown formatting in text nodes
    if (editor) {
      decorateURLsInEditor(editor)
      if (markdownEnabled) decorateMarkdownInEditor(editor)
      if (savedCursorOffset !== null) {
        setCursorAtOffset(editor, savedCursorOffset)
      }
    }

    runTriggerDetection()
  }, [
    onChange,
    readSegmentsFromDOM,
    runTriggerDetection,
    renderSegmentsToDOM,
    markdownEnabled,
    events.isComposing,
    events.pushUndo,
  ])

  // -----------------------------------------------------------------------
  // Chip click delegation
  // -----------------------------------------------------------------------

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target
      if (!(target instanceof Node)) return

      const editor = editorRef.current
      if (!editor) return

      // Walk from the click target up to find a link or chip element
      let node: Node | null = target
      while (node && node !== editor) {
        // Check for URL link click — only navigate on Cmd/Ctrl+Click;
        // plain click just positions the cursor for editing.
        if (isLinkElement(node)) {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onLinkClick?.(node.href)
            window.open(node.href, '_blank', 'noopener,noreferrer')
            return
          }
          // Plain click: let the browser place the cursor inside the link text
          break
        }

        if (isChipElement(node)) {
          if (!onChipClick) return
          const trigger = getChipTrigger(node)
          const chipValue = getChipValue(node)
          const display = getChipDisplay(node)
          const data = getChipData(node)

          if (trigger && chipValue !== undefined && display) {
            const autoResolved = getChipAutoResolved(node)
            const chip: ChipSegment = {
              type: 'chip',
              trigger,
              value: chipValue,
              displayText: display,
              ...(data !== undefined ? { data } : {}),
              ...(autoResolved ? { autoResolved: true } : {}),
            }
            onChipClick(chip)
          }
          return
        }
        node = node.parentNode
      }
    },
    [onChipClick, onLinkClick],
  )

  // -----------------------------------------------------------------------
  // Chip backspace (delete chip behind cursor as whole unit)
  // -----------------------------------------------------------------------

  const handleChipBackspace = useCallback((): boolean => {
    const editor = editorRef.current
    if (!editor) return false

    const range = getSelectionRange()
    if (!range || !range.collapsed) return false

    const node = range.startContainer
    const offset = range.startOffset

    // Case 1: cursor is at the editor level (between child nodes)
    if (node === editor && offset > 0) {
      const prevChild = editor.childNodes[offset - 1]
      if (prevChild && isChipElement(prevChild)) {
        if (getChipAutoResolved(prevChild)) {
          return revertChipNodeToText(editor, prevChild)
        }
        return removeChipNodeFromDOM(editor, prevChild)
      }
    }

    // Case 2: cursor is at start of a text node, check previous sibling
    if (node.nodeType === Node.TEXT_NODE && offset === 0) {
      const directChild = getDirectChildContaining(editor, node)
      if (!directChild) return false

      let prevSibling = directChild.previousSibling
      while (
        prevSibling &&
        prevSibling.nodeType === Node.TEXT_NODE &&
        prevSibling.textContent === ''
      ) {
        prevSibling = prevSibling.previousSibling
      }
      if (prevSibling && isChipElement(prevSibling)) {
        if (getChipAutoResolved(prevSibling)) {
          return revertChipNodeToText(editor, prevSibling)
        }
        return removeChipNodeFromDOM(editor, prevSibling)
      }
    }

    return false
  }, [readSegmentsFromDOM, onChange, renderSegmentsToDOM])

  // -----------------------------------------------------------------------
  // Chip forward delete (delete chip in front of cursor)
  // -----------------------------------------------------------------------

  const handleChipForwardDelete = useCallback((): boolean => {
    const editor = editorRef.current
    if (!editor) return false

    const range = getSelectionRange()
    if (!range || !range.collapsed) return false

    const node = range.startContainer
    const offset = range.startOffset

    // Case 1: cursor at the editor level
    if (node === editor && offset < editor.childNodes.length) {
      const nextChild = editor.childNodes[offset]
      if (nextChild && isChipElement(nextChild)) {
        return removeChipNodeFromDOM(editor, nextChild)
      }
    }

    // Case 2: cursor at end of a text node, check next sibling
    if (node.nodeType === Node.TEXT_NODE && offset === (node.textContent ?? '').length) {
      const directChild = getDirectChildContaining(editor, node)
      if (!directChild) return false

      let nextSibling = directChild.nextSibling
      while (
        nextSibling &&
        nextSibling.nodeType === Node.TEXT_NODE &&
        nextSibling.textContent === ''
      ) {
        nextSibling = nextSibling.nextSibling
      }
      if (nextSibling && isChipElement(nextSibling)) {
        return removeChipNodeFromDOM(editor, nextSibling)
      }
    }

    return false
  }, [readSegmentsFromDOM, onChange, renderSegmentsToDOM])

  // -----------------------------------------------------------------------
  // Remove a chip node from DOM and sync model
  // -----------------------------------------------------------------------

  const removeChipNodeFromDOM = useCallback(
    (editor: HTMLElement, chipNode: HTMLElement): boolean => {
      const segments = readSegmentsFromDOM()
      const chipIdx = indexOfChildNode(editor, chipNode)
      if (chipIdx === -1) return false

      // Map DOM child index to segment index
      let segIdx = 0
      for (let i = 0; i < chipIdx; i++) {
        const child = editor.childNodes[i]
        if (child.nodeType === Node.TEXT_NODE && (child.textContent ?? '') !== '') {
          segIdx++
        } else if (isChipElement(child)) {
          segIdx++
        } else if (isBRElement(child)) {
          segIdx++
        }
      }

      const deletedChip = segments[segIdx]
      const newSegments = removeChipAtIndex(segments, segIdx)
      onChange(newSegments)
      renderSegmentsToDOM(newSegments)

      if (deletedChip?.type === 'chip') {
        onChipDelete?.(deletedChip)
      }

      return true
    },
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, onChipDelete],
  )

  // -----------------------------------------------------------------------
  // Revert an auto-resolved chip back to plain text
  // -----------------------------------------------------------------------

  const revertChipNodeToText = useCallback(
    (editor: HTMLElement, chipNode: HTMLElement): boolean => {
      const segments = readSegmentsFromDOM()
      const chipIdx = indexOfChildNode(editor, chipNode)
      if (chipIdx === -1) return false

      // Map DOM child index to segment index
      let segIdx = 0
      for (let i = 0; i < chipIdx; i++) {
        const child = editor.childNodes[i]
        if (child.nodeType === Node.TEXT_NODE && (child.textContent ?? '') !== '') {
          segIdx++
        } else if (isChipElement(child)) {
          segIdx++
        } else if (isBRElement(child)) {
          segIdx++
        }
      }

      const revertedChip = segments[segIdx]
      const result = revertChipAtIndex(segments, segIdx)
      if (!result) return false

      // Compute cursor target: plain text offset at end of reverted text
      let targetOffset = 0
      for (let i = 0; i < segIdx; i++) {
        const s = segments[i]
        if (s.type === 'text') {
          targetOffset += s.text.length
        } else {
          targetOffset += s.trigger.length + s.displayText.length
        }
      }
      targetOffset += result.revertedText.length

      onChange(result.segments)
      renderSegmentsToDOM(result.segments)
      setCursorAtOffset(editor, targetOffset)

      if (revertedChip?.type === 'chip') {
        onChipDelete?.(revertedChip)
      }

      return true
    },
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, onChipDelete],
  )

  // -----------------------------------------------------------------------
  // Auto-resolve active trigger on space
  // -----------------------------------------------------------------------

  const autoResolveActiveTrigger = useCallback(
    (trigger: ActiveTrigger) => {
      const segments = readSegmentsFromDOM()
      const query = trigger.query

      // Create a synthetic suggestion so onSelect can customize display text
      const syntheticSuggestion: TriggerSuggestion = {
        value: query,
        label: query,
      }

      const displayText = trigger.config.onSelect?.(syntheticSuggestion) ?? query

      const chipData = {
        value: query,
        displayText: displayText || query,
        autoResolved: true,
      }
      const result = resolveChip(segments, trigger, chipData)

      onChange(result.segments)
      renderSegmentsToDOM(result.segments)

      onChipAdd?.({
        type: 'chip',
        trigger: trigger.config.char,
        ...chipData,
      })

      // Position cursor after the auto-resolved chip + trailing space
      const editor = editorRef.current
      if (editor) {
        setCursorAtOffset(editor, result.cursorOffset)
      }

      dismissTrigger()
    },
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, dismissTrigger, onChipAdd],
  )

  // -----------------------------------------------------------------------
  // Handle key events
  // -----------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 1. Flush pending undo debounce so Cmd+Z has the latest checkpoint
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && undoBaseState.current) {
        if (undoTimer.current) {
          clearTimeout(undoTimer.current)
          undoTimer.current = null
        }
        events.pushUndo(undoBaseState.current)
        undoBaseState.current = null
      }

      // 1a. Undo/redo intercept
      if (events.handleKeyDownForUndoRedo(e)) return

      // 1.5 Markdown formatting shortcuts (Cmd+B bold, Cmd+I italic)
      if (
        markdownEnabled &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        (e.key === 'b' || e.key === 'i')
      ) {
        e.preventDefault()
        const editor = editorRef.current
        if (!editor) return

        const offsets = getSelectionOffsets(editor)
        if (!offsets || offsets.start === offsets.end) return

        const marker = e.key === 'b' ? '**' : '*'
        const currentSegments = readSegmentsFromDOM()
        events.pushUndo(currentSegments)

        const result = toggleMarkdownWrap(currentSegments, offsets.start, offsets.end, marker)
        if (!result) return

        lastRenderedValue.current = result.segments
        onChange(result.segments)
        renderSegmentsToDOM(result.segments)
        setSelectionAtOffsets(editor, result.selectionStart, result.selectionEnd)
        return
      }

      // 2. Trigger dropdown navigation
      if (activeTrigger && activeTrigger.config.mode === 'dropdown' && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0))
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          const selected = suggestions[selectedSuggestionIndex]
          if (selected) {
            selectSuggestionInternal(selected)
          }
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          dismissTrigger()
          return
        }
      }

      // 2.5. Auto-resolve on Space when trigger has resolveOnSpace
      if (e.key === ' ' && activeTrigger && activeTrigger.config.resolveOnSpace) {
        const query = activeTrigger.query.trim()
        if (query.length > 0) {
          e.preventDefault()
          autoResolveActiveTrigger(activeTrigger)
          return
        }
      }

      // 2.6. Tab/Shift+Tab for list indentation (only when trigger dropdown is NOT open)
      if (markdownEnabled && e.key === 'Tab' && !activeTrigger) {
        const editor = editorRef.current
        if (editor) {
          const segments = readSegmentsFromDOM()
          const plainText = segmentsToPlainText(segments)
          const cursorPos = getCursorOffset(editor)
          if (cursorPos !== null) {
            const ctx = getListContext(plainText, cursorPos)
            if (ctx) {
              e.preventDefault()
              const result = e.shiftKey
                ? outdentListItem(segments, cursorPos)
                : indentListItem(segments, cursorPos)
              if (result) {
                lastRenderedValue.current = result.segments
                onChange(result.segments)
                renderSegmentsToDOM(result.segments)
                setCursorAtOffset(editor, result.cursorOffset)
              }
              return
            }
          }
        }
      }

      // 2.8 Shift+Enter: insert newline at model level (avoids browser's broken
      // contentEditable behavior near <a> elements)
      if (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        const editor = editorRef.current
        if (editor) {
          const offsets = getSelectionOffsets(editor)
          if (offsets) {
            const currentSegments = readSegmentsFromDOM()
            events.pushUndo(currentSegments)
            const newSegments = replaceTextRange(currentSegments, offsets.start, offsets.end, '\n')
            lastRenderedValue.current = newSegments
            onChange(newSegments)
            renderSegmentsToDOM(newSegments)
            setCursorAtOffset(editor, offsets.start + 1)
          }
        }
        return
      }

      // 3. Submit on Enter (without Shift), skip during IME
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        // 3a. Check for list continuation first (only when markdown is enabled)
        const editor = editorRef.current
        if (markdownEnabled && editor) {
          const segments = readSegmentsFromDOM()
          const cursorPos = getCursorOffset(editor)
          if (cursorPos !== null) {
            const plainText = segmentsToPlainText(segments)
            const ctx = getListContext(plainText, cursorPos)
            if (ctx) {
              e.preventDefault()
              const result = insertListContinuation(segments, cursorPos)
              if (result) {
                lastRenderedValue.current = result.segments
                onChange(result.segments)
                renderSegmentsToDOM(result.segments)
                setCursorAtOffset(editor, result.cursorOffset)
              }
              return
            }
          }
        }

        // 3b. Submit (if no list context)
        if (onSubmit) {
          e.preventDefault()
          onSubmit(readSegmentsFromDOM())
          return
        }
      }

      // 4. Escape
      if (e.key === 'Escape' && onEscape) {
        onEscape()
        return
      }

      // 4.5 Non-collapsed selection delete (Backspace/Delete across <a> boundaries)
      if ((e.key === 'Backspace' || e.key === 'Delete') && !e.nativeEvent.isComposing) {
        const editor = editorRef.current
        if (editor) {
          const offsets = getSelectionOffsets(editor)
          if (offsets && offsets.start !== offsets.end) {
            e.preventDefault()
            const currentSegments = readSegmentsFromDOM()
            events.pushUndo(currentSegments)
            const newSegments = replaceTextRange(currentSegments, offsets.start, offsets.end, '')
            lastRenderedValue.current = newSegments
            onChange(newSegments)
            renderSegmentsToDOM(newSegments)
            setCursorAtOffset(editor, offsets.start)
            runTriggerDetection()
            return
          }
        }
      }

      // 5. Backspace: check list prefix removal, then chip deletion
      if (e.key === 'Backspace') {
        const editor = editorRef.current
        if (editor) {
          const segments = readSegmentsFromDOM()
          const cursorPos = getCursorOffset(editor)
          if (markdownEnabled && cursorPos !== null) {
            const result = removeListPrefix(segments, cursorPos)
            if (result) {
              e.preventDefault()
              lastRenderedValue.current = result.segments
              onChange(result.segments)
              renderSegmentsToDOM(result.segments)
              setCursorAtOffset(editor, result.cursorOffset)
              runTriggerDetection()
              return
            }
          }
        }
        if (handleChipBackspace()) {
          e.preventDefault()
          runTriggerDetection()
          return
        }
      }

      // 6. Delete (forward): delete chip as whole unit
      if (e.key === 'Delete' && handleChipForwardDelete()) {
        e.preventDefault()
        runTriggerDetection()
        return
      }
    },
    [
      activeTrigger,
      suggestions,
      selectedSuggestionIndex,
      onSubmit,
      onEscape,
      readSegmentsFromDOM,
      onChange,
      renderSegmentsToDOM,
      markdownEnabled,
      dismissTrigger,
      handleChipBackspace,
      handleChipForwardDelete,
      autoResolveActiveTrigger,
      runTriggerDetection,
      events.handleKeyDownForUndoRedo,
      events.pushUndo,
    ],
  )

  // -----------------------------------------------------------------------
  // Select a suggestion from the dropdown
  // -----------------------------------------------------------------------

  const selectSuggestionInternal = useCallback(
    (suggestion: TriggerSuggestion) => {
      if (!activeTrigger) return

      const segments = readSegmentsFromDOM()
      const displayText = activeTrigger.config.onSelect?.(suggestion) ?? suggestion.label

      const chipData = {
        value: suggestion.value,
        displayText: displayText || suggestion.label,
        data: suggestion.data,
      }
      const result = resolveChip(segments, activeTrigger, chipData)

      onChange(result.segments)
      renderSegmentsToDOM(result.segments)

      onChipAdd?.({
        type: 'chip',
        trigger: activeTrigger.config.char,
        ...chipData,
      })

      // Position cursor after the chip + trailing space
      const editor = editorRef.current
      if (editor) {
        setCursorAtOffset(editor, result.cursorOffset)
      }

      dismissTrigger()

      // Refocus editor after popover interaction
      setTimeout(() => {
        editorRef.current?.focus()
      }, 0)
    },
    [activeTrigger, readSegmentsFromDOM, onChange, renderSegmentsToDOM, dismissTrigger, onChipAdd],
  )

  const selectSuggestion = selectSuggestionInternal

  // -----------------------------------------------------------------------
  // Imperative handle (memoized to avoid identity changes)
  // -----------------------------------------------------------------------

  const handle: PromptAreaHandle = useMemo(
    () => ({
      focus: () => editorRef.current?.focus(),
      blur: () => editorRef.current?.blur(),
      insertChip: (chip) => {
        const segments = readSegmentsFromDOM()
        const newChip: ChipSegment = { type: 'chip', ...chip }
        const newSegments: Segment[] = [...segments, newChip, { type: 'text', text: ' ' }]
        onChange(newSegments)
        renderSegmentsToDOM(newSegments)
        onChipAdd?.(newChip)
      },
      getPlainText: () => segmentsToPlainText(readSegmentsFromDOM()),
      clear: () => {
        onChange([])
        const editor = editorRef.current
        if (editor) {
          while (editor.firstChild) editor.removeChild(editor.firstChild)
        }
        events.resetUndoHistory()
        if (undoTimer.current) {
          clearTimeout(undoTimer.current)
          undoTimer.current = null
        }
        undoBaseState.current = null
      },
    }),
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, onChipAdd, events.resetUndoHistory],
  )

  // -----------------------------------------------------------------------
  // Compose event handlers
  // -----------------------------------------------------------------------

  const eventHandlers = useMemo(
    () => ({
      onPaste: events.handlePaste,
      onCopy: events.handleCopy,
      onCut: events.handleCut,
      onDrop: events.handleDrop,
      onDragOver: events.handleDragOver,
      onCompositionStart: events.handleCompositionStart,
      onCompositionEnd: events.handleCompositionEnd,
      onBlur: events.handleBlur,
    }),
    [
      events.handlePaste,
      events.handleCopy,
      events.handleCut,
      events.handleDrop,
      events.handleDragOver,
      events.handleCompositionStart,
      events.handleCompositionEnd,
      events.handleBlur,
    ],
  )

  return {
    editorRef,
    activeTrigger,
    suggestions,
    suggestionsLoading,
    selectedSuggestionIndex,
    handleInput,
    handleKeyDown,
    handleClick,
    selectSuggestion,
    dismissTrigger,
    handle,
    triggerRect,
    eventHandlers,
  }
}

// ---------------------------------------------------------------------------
// Cursor position utilities (private to this module)
// ---------------------------------------------------------------------------

type SavedCursor = {
  nodeIndex: number
  offset: number
}

function saveCursorPosition(editor: HTMLElement): SavedCursor | null {
  const range = getSelectionRange()
  if (!range) return null
  if (!editor.contains(range.startContainer)) return null

  const node = range.startContainer
  if (node === editor) {
    return { nodeIndex: range.startOffset, offset: 0 }
  }

  // Walk up to find the direct child of editor using type-safe helper
  const directChild = getDirectChildContaining(editor, node)
  if (!directChild) return null

  const nodeIndex = indexOfChildNode(editor, directChild)
  return { nodeIndex, offset: range.startOffset }
}

function restoreCursorPosition(editor: HTMLElement, saved: SavedCursor): void {
  const sel = window.getSelection()
  if (!sel) return

  const childNodes = editor.childNodes
  if (childNodes.length === 0) return

  const range = document.createRange()

  if (saved.nodeIndex >= childNodes.length) {
    const lastChild = childNodes[childNodes.length - 1]
    if (lastChild.nodeType === Node.TEXT_NODE) {
      range.setStart(lastChild, (lastChild.textContent ?? '').length)
    } else {
      range.setStartAfter(lastChild)
    }
  } else {
    const targetNode = childNodes[saved.nodeIndex]
    if (targetNode.nodeType === Node.TEXT_NODE) {
      const maxOffset = (targetNode.textContent ?? '').length
      range.setStart(targetNode, Math.min(saved.offset, maxOffset))
    } else {
      range.setStartAfter(targetNode)
    }
  }

  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

function getCursorOffset(editor: HTMLElement): number | null {
  const range = getSelectionRange()
  if (!range) return null
  if (!editor.contains(range.startContainer)) return null

  const preRange = document.createRange()
  preRange.selectNodeContents(editor)
  preRange.setEnd(range.startContainer, range.startOffset)

  return getTextLengthInRange(preRange)
}

/**
 * Create a collapsed Range at the given plain-text offset inside the editor.
 * Returns null if the offset can't be mapped to a DOM position.
 */
function createRangeAtOffset(editor: HTMLElement, targetOffset: number): Range | null {
  let remaining = targetOffset

  for (let i = 0; i < editor.childNodes.length; i++) {
    const child = editor.childNodes[i]

    if (child.nodeType === Node.TEXT_NODE) {
      const len = (child.textContent ?? '').length
      if (remaining <= len) {
        const range = document.createRange()
        range.setStart(child, remaining)
        range.collapse(true)
        return range
      }
      remaining -= len
    } else if (isChipElement(child)) {
      const trigger = child.dataset.chipTrigger ?? ''
      const display = child.dataset.chipDisplay ?? child.textContent ?? ''
      const chipLen = trigger.length + display.length
      if (remaining <= chipLen) {
        const range = document.createRange()
        range.setStartAfter(child)
        range.collapse(true)
        return range
      }
      remaining -= chipLen
    } else if (isBRElement(child)) {
      if (child.dataset.sentinel) continue // skip sentinel <br>
      if (remaining <= 1) {
        const range = document.createRange()
        range.setStartAfter(child)
        range.collapse(true)
        return range
      }
      remaining -= 1
    }
  }

  return null
}

function setCursorAtOffset(editor: HTMLElement, targetOffset: number): void {
  const sel = window.getSelection()
  if (!sel) return

  let remaining = targetOffset

  for (let i = 0; i < editor.childNodes.length; i++) {
    const child = editor.childNodes[i]

    if (child.nodeType === Node.TEXT_NODE) {
      const len = (child.textContent ?? '').length
      if (remaining <= len) {
        const range = document.createRange()
        range.setStart(child, remaining)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return
      }
      remaining -= len
    } else if (isChipElement(child)) {
      const trigger = child.dataset.chipTrigger ?? ''
      const display = child.dataset.chipDisplay ?? child.textContent ?? ''
      const chipLen = trigger.length + display.length
      if (remaining <= chipLen) {
        const range = document.createRange()
        range.setStartAfter(child)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return
      }
      remaining -= chipLen
    } else if (isBRElement(child)) {
      if (child.dataset.sentinel) continue // skip sentinel <br>
      if (remaining <= 1) {
        const range = document.createRange()
        range.setStartAfter(child)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return
      }
      remaining -= 1
    }
  }

  // Fallback: place cursor at end
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

function getTextLengthInRange(range: Range): number {
  const fragment = range.cloneContents()
  let length = 0

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      length += (node.textContent ?? '').length
    } else if (isChipElement(node)) {
      // Type-safe chip reading
      const trigger = node.dataset.chipTrigger ?? ''
      const display = node.dataset.chipDisplay ?? node.textContent ?? ''
      length += trigger.length + display.length
    } else if (isHTMLElement(node) && node.tagName === 'BR') {
      if (node.dataset.sentinel) return // skip sentinel <br>
      length += 1
    } else if (isHTMLElement(node)) {
      node.childNodes.forEach(walk)
    }
  }

  fragment.childNodes.forEach(walk)
  return length
}

/**
 * Returns the start and end plain-text offsets of the current selection.
 * Returns null if there's no selection or it's outside the editor.
 */
function getSelectionOffsets(editor: HTMLElement): { start: number; end: number } | null {
  const range = getSelectionRange()
  if (!range) return null
  if (!editor.contains(range.startContainer)) return null

  const startRange = document.createRange()
  startRange.selectNodeContents(editor)
  startRange.setEnd(range.startContainer, range.startOffset)
  const start = getTextLengthInRange(startRange)

  if (range.collapsed) return { start, end: start }

  const endRange = document.createRange()
  endRange.selectNodeContents(editor)
  endRange.setEnd(range.endContainer, range.endOffset)
  const end = getTextLengthInRange(endRange)

  return { start, end }
}

/**
 * Sets a (potentially non-collapsed) selection at the given plain-text offsets.
 * Used to restore selection after markdown wrap/unwrap operations.
 */
function setSelectionAtOffsets(editor: HTMLElement, startOffset: number, endOffset: number): void {
  const sel = window.getSelection()
  if (!sel) return

  if (startOffset === endOffset) {
    setCursorAtOffset(editor, startOffset)
    return
  }

  const startPos = findDOMPosition(editor, startOffset)
  const endPos = findDOMPosition(editor, endOffset)
  if (!startPos || !endPos) return

  const range = document.createRange()
  range.setStart(startPos.node, startPos.offset)
  range.setEnd(endPos.node, endPos.offset)
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 * Maps a plain-text offset to a DOM node + offset pair.
 * Recurses into decoration elements (markdown spans, URL anchors).
 */
function findDOMPosition(
  container: HTMLElement,
  targetOffset: number,
): { node: Node; offset: number } | null {
  let remaining = targetOffset

  for (let i = 0; i < container.childNodes.length; i++) {
    const child = container.childNodes[i]

    if (child.nodeType === Node.TEXT_NODE) {
      const len = (child.textContent ?? '').length
      if (remaining <= len) {
        return { node: child, offset: remaining }
      }
      remaining -= len
    } else if (isChipElement(child)) {
      const trigger = child.dataset.chipTrigger ?? ''
      const display = child.dataset.chipDisplay ?? child.textContent ?? ''
      const chipLen = trigger.length + display.length
      if (remaining <= chipLen) {
        // Position after the chip element
        return { node: container, offset: i + 1 }
      }
      remaining -= chipLen
    } else if (isBRElement(child)) {
      if (child.dataset.sentinel) continue // skip sentinel <br>
      if (remaining <= 1) {
        return { node: container, offset: i + 1 }
      }
      remaining -= 1
    } else if (isHTMLElement(child)) {
      // Decoration element (markdown span, URL anchor) — recurse
      const textLen = (child.textContent ?? '').length
      if (remaining <= textLen) {
        const result = findDOMPosition(child, remaining)
        if (result) return result
      }
      remaining -= textLen
    }
  }

  // Fallback: end of container
  return { node: container, offset: container.childNodes.length }
}

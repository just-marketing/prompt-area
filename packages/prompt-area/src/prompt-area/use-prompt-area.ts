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
  isValidTriggerPosition,
  segmentsToPlainText,
  plainTextToSegments,
  segmentsEqual,
  resolveChip,
  removeChipAtIndex,
  revertChipAtIndex,
  replaceTextRange,
  toggleMarkdownWrap,
  truncateSegmentsToLength,
} from './prompt-area-engine'
import {
  getListContext,
  autoFormatListPrefix,
  insertListContinuation,
  indentListItem,
  outdentListItem,
  removeListPrefix,
  normalizeListPrefixes,
} from './prompt-area-list-ops'
import {
  isHTMLElement,
  isChipElement,
  isLinkElement,
  isBRElement,
  chipNodeToSegment,
  getChipAutoResolved,
  getDirectChildContaining,
  indexOfChildNode,
  domChildIndexToSegmentIndex,
  normalizeEditorDOM,
  decorateURLsInEditor,
  decorateMarkdownInEditor,
  decorateBulletsInEditor,
  safeJsonStringify,
  getSelectionRange,
} from './dom-helpers'
import {
  saveCursorPosition,
  restoreCursorPosition,
  getCursorOffset,
  setCursorAtOffset,
  createRangeAtOffset,
  getSelectionOffsets,
  setSelectionAtOffsets,
} from './cursor-helpers'
import { usePromptAreaEvents } from './use-prompt-area-events'
import { useTriggerSearch } from './use-trigger-search'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UsePromptAreaOptions = {
  value: Segment[]
  onChange: (segments: Segment[]) => void
  triggers?: TriggerConfig[]
  disabled?: boolean
  onSubmit?: (segments: Segment[]) => void
  onEscape?: () => void
  onChipClick?: (chip: ChipSegment) => void
  onChipAdd?: (chip: ChipSegment) => void
  onChipDelete?: (chip: ChipSegment) => void
  onLinkClick?: (url: string) => void
  onPaste?: (data: { segments: Segment[]; source: 'internal' | 'external' }) => void
  onRawPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void
  onUndo?: (segments: Segment[]) => void
  onRedo?: (segments: Segment[]) => void
  onImagePaste?: (file: File) => void
  markdown?: boolean
  normalizeBullets?: boolean
  submitOnEnter?: boolean
  maxLength?: number
}

type UsePromptAreaReturn = {
  editorRef: React.RefObject<HTMLDivElement | null>
  activeTrigger: ActiveTrigger | null
  suggestions: TriggerSuggestion[]
  suggestionsLoading: boolean
  suggestionsError: string | null
  selectedSuggestionIndex: number
  handleInput: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handleClick: (e: React.MouseEvent<HTMLDivElement>) => void
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
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
  disabled = false,
  onSubmit,
  onEscape,
  onChipClick,
  onChipAdd,
  onChipDelete,
  onLinkClick,
  onPaste,
  onRawPaste,
  onUndo,
  onRedo,
  onImagePaste,
  markdown: markdownEnabled = true,
  normalizeBullets = true,
  submitOnEnter = true,
  maxLength,
}: UsePromptAreaOptions): UsePromptAreaReturn {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [activeTrigger, setActiveTrigger] = useState<ActiveTrigger | null>(null)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  // Chip whose dropdown was reopened via `reopenOnChipClick`. While set, the
  // active dropdown edits this chip in place instead of resolving typed text.
  // Cleared on dismiss and by any fresh trigger detection (typing).
  //
  // `segIndex` is the segment index at CLICK time (computed from the live DOM,
  // so it's always accurate then) — deliberately not the DOM node itself,
  // which can detach if `renderSegmentsToDOM` re-renders while the dropdown is
  // open (external value update, undo/redo). At selection time we re-verify
  // this index still holds the same chip and fall back to a trigger+value
  // search if the model shifted underneath, instead of silently no-op'ing.
  const editingChip = useRef<{ chip: ChipSegment; segIndex: number } | null>(null)

  // The DOM node of the chip currently being edited via `reopenOnChipClick`,
  // kept in lockstep with `editingChip`/`activeTrigger` (set when opened,
  // cleared by `dismissTrigger`). Used only to answer "is THIS exact chip
  // element the one whose dropdown is open right now" by reference identity —
  // never by trigger+value, which can't distinguish two chips that happen to
  // share the same value.
  const openChipNode = useRef<HTMLElement | null>(null)

  // Set by `handleMouseDown` to the chip node a mousedown landed on, but only
  // when that node === `openChipNode.current` at that instant; read and
  // cleared by the following `handleClick` to distinguish "reopen" from
  // "toggle closed" for that one click. A real `onMouseDown` (bubble-phase,
  // attached to the editor root) is used instead of piggybacking on
  // `dismissTrigger` because DOM bubbling reaches the editor root before it
  // reaches `document` (where TriggerPopover's outside-click dismiss listens),
  // so this always observes `openChipNode` before that dismiss clears it —
  // and unlike a `dismissTrigger`-driven flag, it is scoped to mousedowns on
  // this exact node, so Escape/blur/an unrelated dismiss can never poison a
  // later, unrelated click on the same chip.
  const suppressReopenChip = useRef<HTMLElement | null>(null)

  const {
    suggestions,
    suggestionsLoading,
    suggestionsError,
    search: runSearch,
    reset: resetSearch,
  } = useTriggerSearch()

  // Guard against circular DOM <-> model syncs
  const isSyncing = useRef(false)
  const lastRenderedValue = useRef<Segment[]>([])

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
        const chip = chipNodeToSegment(node)
        if (chip) segments.push(chip)
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
      if (markdownEnabled) {
        decorateMarkdownInEditor(editor)
        decorateBulletsInEditor(editor)
      }

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

  // Builds the insertChip handed to callback/launch activations: replaces the
  // trigger's range with a chip and notifies onChipAdd.
  const buildInsertChip = useCallback(
    (segments: Segment[], trigger: ActiveTrigger) => (chip: Omit<ChipSegment, 'type'>) => {
      const chipResult = resolveChip(segments, trigger, {
        value: chip.value,
        displayText: chip.displayText,
        data: chip.data,
      })
      onChange(chipResult.segments)
      renderSegmentsToDOM(chipResult.segments)
      onChipAdd?.({
        type: 'chip',
        trigger: trigger.config.char,
        value: chip.value,
        displayText: chip.displayText,
        ...(chip.data !== undefined ? { data: chip.data } : {}),
      })
      const editor = editorRef.current
      if (editor) setCursorAtOffset(editor, chipResult.cursorOffset)
    },
    [onChange, renderSegmentsToDOM, onChipAdd],
  )

  const runTriggerDetection = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const segments = readSegmentsFromDOM()
    const plainText = segmentsToPlainText(segments)
    const cursorPos = getCursorOffset(editor)

    if (cursorPos === null) return

    const detected = detectActiveTrigger(plainText, cursorPos, triggers)

    // Typing supersedes a chip-click dropdown: whichever branch we take next,
    // the popover no longer edits the clicked chip.
    editingChip.current = null
    openChipNode.current = null

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

      // Fetch suggestions for dropdown mode
      if (detected.config.mode === 'dropdown' && detected.config.onSearch) {
        runSearch(detected.query, detected.config)
      }

      // Fire callback for callback mode
      if (detected.config.mode === 'callback' && detected.config.onActivate) {
        detected.config.onActivate({
          text: plainText,
          cursorPosition: cursorPos,
          insertChip: buildInsertChip(segments, detected),
        })
      }
    } else {
      setActiveTrigger(null)
      resetSearch()
    }
  }, [triggers, readSegmentsFromDOM, buildInsertChip, resetSearch, runSearch])

  // -----------------------------------------------------------------------
  // Dismiss trigger
  // -----------------------------------------------------------------------

  const dismissTrigger = useCallback(() => {
    editingChip.current = null
    openChipNode.current = null
    setActiveTrigger(null)
    setSelectedSuggestionIndex(0)
    resetSearch()
  }, [resetSearch])

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
    markdownEnabled,
    normalizeBullets,
    onPaste,
    onRawPaste,
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

    // Normalize list prefixes (e.g., "- " → "• " when markdown is on)
    // so externally-provided segments render bullet characters correctly.
    if (markdownEnabled && normalizeBullets) {
      const normalized = normalizeListPrefixes(value, true)
      if (normalized !== value) {
        onChange(normalized)
        return // onChange will trigger a re-render with the normalized value
      }
    }

    renderSegmentsToDOM(value)
  }, [value, renderSegmentsToDOM, markdownEnabled, normalizeBullets, onChange])

  // Re-render when markdown mode changes to apply/strip decorations
  // Also convert bullet characters: • ↔ - in text segments
  const prevMarkdown = useRef(markdownEnabled)
  useEffect(() => {
    if (prevMarkdown.current === markdownEnabled) return
    prevMarkdown.current = markdownEnabled

    const converted = normalizeBullets ? normalizeListPrefixes(value, markdownEnabled) : value
    if (converted !== value) {
      onChange(converted)
    } else {
      renderSegmentsToDOM(value)
    }
  }, [markdownEnabled, normalizeBullets, renderSegmentsToDOM, value, onChange])

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

    // Enforce maxLength: if the edit pushed the editor past the cap, truncate
    // back to maxLength characters and keep the caret where the user was
    // editing (clamped to the cap) rather than forcing it to the end.
    if (maxLength != null && editor && segmentsToPlainText(segments).length > maxLength) {
      const caret = getCursorOffset(editor)
      const truncated = truncateSegmentsToLength(segments, maxLength)
      lastRenderedValue.current = truncated
      onChange(truncated)
      renderSegmentsToDOM(truncated)
      setCursorAtOffset(editor, caret != null ? Math.min(caret, maxLength) : maxLength)
      runTriggerDetection()
      return
    }

    // Check for list auto-formatting (e.g., "- " -> "bullet ")
    if (markdownEnabled && normalizeBullets && editor && savedCursorOffset !== null) {
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
      if (markdownEnabled) {
        decorateMarkdownInEditor(editor)
        decorateBulletsInEditor(editor)
      }
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
    normalizeBullets,
    maxLength,
    events,
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
          // Spawn ripple effect. `isChipElement` has already narrowed `node`
          // to HTMLElement, so no cast is needed.
          const rect = node.getBoundingClientRect()
          const ripple = document.createElement('span')
          ripple.className = 'prompt-area-chip-ripple'
          const size = Math.max(rect.width, rect.height)
          ripple.style.width = `${size}px`
          ripple.style.height = `${size}px`
          ripple.style.left = `${e.clientX - rect.left - size / 2}px`
          ripple.style.top = `${e.clientY - rect.top - size / 2}px`
          node.appendChild(ripple)
          ripple.addEventListener('animationend', () => ripple.remove())

          const chip = chipNodeToSegment(node)
          if (chip) {
            // Native chip-click dropdown: reopen this trigger's suggestions
            // anchored to the chip so the selection can replace it in place.
            // Gated on `!disabled` — a disabled composer must not accept edits
            // through any path, including this one.
            const config = triggers.find((t) => t.char === chip.trigger)
            // A click on THIS exact chip element while its own dropdown was
            // open just closed it (see `suppressReopenChip` and
            // `handleMouseDown`) — treat that as a toggle-close, not a reopen.
            const wasOpenForThisChip = suppressReopenChip.current === node
            suppressReopenChip.current = null
            if (
              !disabled &&
              !wasOpenForThisChip &&
              config?.reopenOnChipClick &&
              config.mode === 'dropdown' &&
              config.onSearch
            ) {
              const childIdx = indexOfChildNode(editor, node)
              editingChip.current = {
                chip,
                segIndex: domChildIndexToSegmentIndex(editor, childIdx),
              }
              openChipNode.current = node
              setActiveTrigger({ config, startOffset: 0, query: '' })
              setSelectedSuggestionIndex(0)
              setTriggerRect(rect)
              runSearch('', config)
            }
            onChipClick?.(chip)
          }
          return
        }
        node = node.parentNode
      }
    },
    [onChipClick, onLinkClick, triggers, runSearch, disabled],
  )

  // -----------------------------------------------------------------------
  // Chip mousedown delegation — feeds `suppressReopenChip` for handleClick's
  // toggle-close detection. See `openChipNode`/`suppressReopenChip` above for
  // why this needs to be a real mousedown listener rather than piggybacking
  // on `dismissTrigger`.
  // -----------------------------------------------------------------------

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target
    const editor = editorRef.current
    if (!editor || !(target instanceof Node)) {
      suppressReopenChip.current = null
      return
    }

    let node: Node | null = target
    while (node && node !== editor) {
      if (isChipElement(node)) {
        suppressReopenChip.current = openChipNode.current === node ? node : null
        return
      }
      node = node.parentNode
    }
    suppressReopenChip.current = null
  }, [])

  // -----------------------------------------------------------------------
  // Remove a chip node from DOM and sync model
  // -----------------------------------------------------------------------

  const removeChipNodeFromDOM = useCallback(
    (editor: HTMLElement, chipNode: HTMLElement): boolean => {
      const segments = readSegmentsFromDOM()
      const chipIdx = indexOfChildNode(editor, chipNode)
      if (chipIdx === -1) return false

      const segIdx = domChildIndexToSegmentIndex(editor, chipIdx)
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

      const segIdx = domChildIndexToSegmentIndex(editor, chipIdx)
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
  }, [removeChipNodeFromDOM, revertChipNodeToText])

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
  }, [removeChipNodeFromDOM])

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

      // Chip-click dropdown (`reopenOnChipClick`): replace the clicked chip in
      // place instead of resolving typed trigger text at the caret. Disabled
      // is re-checked here (not just at open time) in case the composer
      // became disabled while the popover was still open.
      const editing = editingChip.current
      if (editing) {
        const editor = editorRef.current
        if (editor && !disabled) {
          // Re-verify the click-time index still holds the same chip — the
          // model may have shifted (external value update, undo/redo) while
          // the dropdown was open. If it moved, recover ONLY when exactly one
          // chip in the document now matches trigger+value: with duplicates,
          // guessing risks silently editing the wrong instance, which is
          // worse than the no-op this falls back to.
          const atIndex = segments[editing.segIndex]
          const stillThere =
            atIndex?.type === 'chip' &&
            atIndex.trigger === editing.chip.trigger &&
            atIndex.value === editing.chip.value
          const segIdx = stillThere
            ? editing.segIndex
            : (() => {
                const matches: number[] = []
                segments.forEach((seg, i) => {
                  if (
                    seg.type === 'chip' &&
                    seg.trigger === editing.chip.trigger &&
                    seg.value === editing.chip.value
                  ) {
                    matches.push(i)
                  }
                })
                return matches.length === 1 ? matches[0] : -1
              })()
          const oldChip = segIdx !== -1 ? segments[segIdx] : undefined

          if (oldChip?.type === 'chip') {
            const newChip: ChipSegment = {
              type: 'chip',
              trigger: activeTrigger.config.char,
              ...chipData,
            }
            let newSegments = segments.map((seg, i) => (i === segIdx ? newChip : seg))

            // Guarantee a real landing spot after the replaced chip, mirroring
            // resolveChip's trailing-space convention (prompt-area-engine.ts):
            // if the new chip is now the last segment (or directly followed by
            // another chip), the caret would land at a bare element boundary
            // with no text node, which some engines fail to render/snap a
            // visible caret at.
            const nextSeg = newSegments[segIdx + 1]
            const insertedSpace = !nextSeg || nextSeg.type !== 'text' || nextSeg.text.length === 0
            if (insertedSpace) {
              newSegments = [
                ...newSegments.slice(0, segIdx + 1),
                { type: 'text', text: ' ' },
                ...newSegments.slice(segIdx + 1),
              ]
            }

            events.pushUndo(segments)
            onChange(newSegments)
            renderSegmentsToDOM(newSegments)

            // Same value + display text + data: treat as a no-op confirmation
            // rather than a destructive delete+add — onChipDelete is
            // documented as firing on backspace/forward-delete, not on
            // re-confirming the already-selected suggestion.
            const unchanged =
              oldChip.value === newChip.value &&
              oldChip.displayText === newChip.displayText &&
              safeJsonStringify(oldChip.data) === safeJsonStringify(newChip.data)
            if (!unchanged) {
              onChipDelete?.(oldChip)
              onChipAdd?.(newChip)
            }

            // +1 when a space was inserted, matching resolveChip's own
            // "+1 accounts for the trailing space after the chip" placement —
            // landing exactly at the chip's end would put the caret at the
            // same bare element boundary the inserted space exists to avoid.
            const caretOffset =
              segmentsToPlainText(newSegments.slice(0, segIdx + 1)).length + (insertedSpace ? 1 : 0)
            setCursorAtOffset(editor, caretOffset)
          }
        }

        dismissTrigger()
        setTimeout(() => {
          editorRef.current?.focus()
        }, 0)
        return
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
    [
      activeTrigger,
      readSegmentsFromDOM,
      onChange,
      renderSegmentsToDOM,
      dismissTrigger,
      onChipAdd,
      onChipDelete,
      events,
      disabled,
    ],
  )

  const selectSuggestion = selectSuggestionInternal

  // Chip-click dropdown: once the empty-query suggestions arrive, preselect
  // the chip's current value so the list opens "on" the existing choice.
  useEffect(() => {
    const editing = editingChip.current
    if (!editing || !activeTrigger?.config.reopenOnChipClick) return
    const idx = suggestions.findIndex((s) => s.value === editing.chip.value)
    if (idx > 0) setSelectedSuggestionIndex(idx)
  }, [suggestions, activeTrigger])

  // -----------------------------------------------------------------------
  // Handle key events
  // -----------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const applyEditResult = (
        editor: HTMLDivElement,
        result: { segments: Segment[]; cursorOffset: number },
      ) => {
        lastRenderedValue.current = result.segments
        onChange(result.segments)
        renderSegmentsToDOM(result.segments)
        setCursorAtOffset(editor, result.cursorOffset)
      }

      const tryListContinuation = (editor: HTMLDivElement): boolean => {
        if (!markdownEnabled) return false
        const segments = readSegmentsFromDOM()
        const cursorPos = getCursorOffset(editor)
        if (cursorPos === null) return false
        const plainText = segmentsToPlainText(segments)
        if (!getListContext(plainText, cursorPos)) return false
        const result = insertListContinuation(segments, cursorPos)
        if (result) applyEditResult(editor, result)
        return true
      }

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

      // 1.75 Launch triggers: a trigger with mode 'launch' fires onActivate on
      // keydown and suppresses the char so it never enters the editor — for
      // opening an external surface (dialog, palette). The DOM read is gated on
      // the typed key actually matching a launch char, so it stays off the hot
      // path. insertChip still inserts a chip at the cursor if the consumer
      // wants one after the external selection.
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.nativeEvent.isComposing &&
        e.key.length === 1
      ) {
        const launcher = triggers.find((t) => t.mode === 'launch' && t.char === e.key)
        const editor = editorRef.current
        if (launcher?.onActivate && editor) {
          const cursorPos = getCursorOffset(editor)
          if (cursorPos !== null) {
            const segments = readSegmentsFromDOM()
            const plainText = segmentsToPlainText(segments)
            if (isValidTriggerPosition(plainText, cursorPos, launcher.position)) {
              e.preventDefault()
              launcher.onActivate({
                text: plainText,
                cursorPosition: cursorPos,
                insertChip: buildInsertChip(
                  replaceTextRange(segments, cursorPos, cursorPos, launcher.char),
                  { config: launcher, startOffset: cursorPos, query: '' },
                ),
              })
              return
            }
          }
        }
      }

      // 2. Trigger dropdown navigation. Gated on the dropdown actually being
      // ON SCREEN, which matches TriggerPopover's own render condition
      // (non-empty suggestions, OR loading/error/emptyMessage) rather than
      // just `suggestions.length > 0` — otherwise a popover left open in a
      // loading/empty state (e.g. right after a chip-click reopen, before its
      // empty-query search resolves) lets Enter fall through to onSubmit and
      // Escape fall through to onEscape while still visibly on screen.
      const dropdownVisible =
        activeTrigger &&
        activeTrigger.config.mode === 'dropdown' &&
        (suggestions.length > 0 ||
          suggestionsLoading ||
          suggestionsError !== null ||
          !!activeTrigger.config.emptyMessage)
      if (dropdownVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (suggestions.length > 0) {
            setSelectedSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
          }
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          if (suggestions.length > 0) {
            setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0))
          }
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
              if (result) applyEditResult(editor, result)
              return
            }
          }
        }
      }

      // Insert a newline at the model level (avoids the browser's broken
      // contentEditable behaviour near <a> elements).
      const insertPlainNewline = (editor: HTMLDivElement): void => {
        const offsets = getSelectionOffsets(editor)
        if (!offsets) return
        const currentSegments = readSegmentsFromDOM()
        events.pushUndo(currentSegments)
        const newSegments = replaceTextRange(currentSegments, offsets.start, offsets.end, '\n')
        applyEditResult(editor, { segments: newSegments, cursorOffset: offsets.start + 1 })
      }

      // 2.8 Shift+Enter always inserts a newline (after a list-continuation check).
      if (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        const editor = editorRef.current
        if (editor && !tryListContinuation(editor)) insertPlainNewline(editor)
        return
      }

      // 3. Enter without Shift (skipping IME): continue a list, else submit when
      // `submitOnEnter` is set, else insert a newline.
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        const editor = editorRef.current
        if (editor && tryListContinuation(editor)) {
          e.preventDefault()
          return
        }
        if (submitOnEnter) {
          e.preventDefault()
          onSubmit?.(readSegmentsFromDOM())
          return
        }
        e.preventDefault()
        if (editor) insertPlainNewline(editor)
        return
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
            applyEditResult(editor, { segments: newSegments, cursorOffset: offsets.start })
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
              applyEditResult(editor, result)
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
      suggestionsLoading,
      suggestionsError,
      selectedSuggestionIndex,
      onSubmit,
      submitOnEnter,
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
      selectSuggestionInternal,
      events,
      triggers,
      buildInsertChip,
    ],
  )

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
      setText: (text) => {
        events.pushUndo(readSegmentsFromDOM())
        const segments = plainTextToSegments(text)
        onChange(segments)
        renderSegmentsToDOM(segments)
        const editor = editorRef.current
        if (editor) setCursorAtOffset(editor, text.length)
      },
      appendText: (text) => {
        const segments = readSegmentsFromDOM()
        events.pushUndo(segments)
        // Merge into the trailing text segment so the onChange value doesn't
        // carry two adjacent un-merged text segments.
        const last = segments[segments.length - 1]
        const next: Segment[] =
          last?.type === 'text'
            ? [...segments.slice(0, -1), { type: 'text', text: last.text + text }]
            : [...segments, { type: 'text', text }]
        onChange(next)
        renderSegmentsToDOM(next)
        const editor = editorRef.current
        if (editor) setCursorAtOffset(editor, segmentsToPlainText(next).length)
      },
      getCursorPosition: () => {
        const editor = editorRef.current
        return editor ? getCursorOffset(editor) : null
      },
      setCursorPosition: (offset) => {
        const editor = editorRef.current
        if (editor) setCursorAtOffset(editor, offset)
      },
      setCursorToEnd: () => {
        const editor = editorRef.current
        if (editor) setCursorAtOffset(editor, segmentsToPlainText(readSegmentsFromDOM()).length)
      },
      getSelection: () => {
        const editor = editorRef.current
        return editor ? getSelectionOffsets(editor) : null
      },
      setSelection: (start, end) => {
        const editor = editorRef.current
        if (editor) setSelectionAtOffsets(editor, start, end)
      },
    }),
    [readSegmentsFromDOM, onChange, renderSegmentsToDOM, onChipAdd, events],
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
    suggestionsError,
    selectedSuggestionIndex,
    handleInput,
    handleKeyDown,
    handleClick,
    handleMouseDown,
    selectSuggestion,
    dismissTrigger,
    handle,
    triggerRect,
    eventHandlers,
  }
}

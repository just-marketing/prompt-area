/**
 * Cursor/selection utilities for the PromptArea contentEditable.
 *
 * Invariants:
 * - All functions are synchronous. Never return a promise or cross a microtask
 *   boundary after a DOM mutation — that can cause the browser to fire
 *   `selectionchange` and reset the caret.
 * - Never cache a `Selection` or `Range` across calls. Ranges become detached
 *   after DOM mutations. Each function calls `window.getSelection()` or
 *   `getSelectionRange()` fresh.
 * - Chip nodes are treated atomically via `isChipElement` — we never descend
 *   into a contentEditable=false subtree when mapping offsets.
 */
import {
  chipNodeTextLength,
  getDirectChildContaining,
  getSelectionRange,
  indexOfChildNode,
  isBRElement,
  isChipElement,
  isHTMLElement,
} from './dom-helpers'

export type SavedCursor = {
  nodeIndex: number
  offset: number
}

export function saveCursorPosition(editor: HTMLElement): SavedCursor | null {
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

export function restoreCursorPosition(editor: HTMLElement, saved: SavedCursor): void {
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
  scrollCaretIntoView(editor)
}

export function getCursorOffset(editor: HTMLElement): number | null {
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
export function createRangeAtOffset(editor: HTMLElement, targetOffset: number): Range | null {
  const pos = findDOMPosition(editor, targetOffset)
  if (!pos) return null

  const range = document.createRange()
  range.setStart(pos.node, pos.offset)
  range.collapse(true)
  return range
}

export function setCursorAtOffset(editor: HTMLElement, targetOffset: number): void {
  const sel = window.getSelection()
  if (!sel) return

  const pos = findDOMPosition(editor, targetOffset)
  if (pos) {
    const range = document.createRange()
    range.setStart(pos.node, pos.offset)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } else {
    // Fallback: place cursor at end
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  scrollCaretIntoView(editor)
}

export function getTextLengthInRange(range: Range): number {
  const fragment = range.cloneContents()
  let length = 0

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      length += (node.textContent ?? '').length
    } else if (isChipElement(node)) {
      length += chipNodeTextLength(node)
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
export function getSelectionOffsets(editor: HTMLElement): { start: number; end: number } | null {
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
export function setSelectionAtOffsets(
  editor: HTMLElement,
  startOffset: number,
  endOffset: number,
): void {
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
  scrollCaretIntoView(editor)
}

/**
 * Scrolls the editor's own scroll box so the caret (the selection's end) is
 * visible.
 *
 * Browsers only auto-scroll the caret into view for native editing (typing,
 * arrow keys) — never for selections placed via the Selection API. Every
 * model-level edit here re-renders the DOM and re-places the selection
 * programmatically (newlines, paste, chips, undo/redo, imperative moves), and
 * the re-render clear additionally collapses scrollHeight, clamping scrollTop
 * to 0. Without this correction, once content overflows maxHeight the caret
 * lands outside the visible box (e.g. Shift+Enter after pasting long text).
 *
 * Only the editor's own scrollTop is adjusted — never ancestor scroll
 * containers or the page — so placing a caret in a blurred editor can't jump
 * the viewport.
 */
export function scrollCaretIntoView(editor: HTMLElement): void {
  if (editor.scrollHeight <= editor.clientHeight) return

  const selRange = getSelectionRange()
  if (!selRange || !editor.contains(selRange.startContainer)) return

  // Measure the selection end (where the caret sits after all placements).
  const caretRange = selRange.cloneRange()
  caretRange.collapse(false)

  let rect = caretRange.getBoundingClientRect()
  if (isZeroRect(rect)) {
    // A collapsed range at an element boundary (e.g. right after a <br>)
    // reports a zero rect, so measure a temporary zero-width space inserted at
    // the caret instead. The insertion cannot split a text node (a caret
    // inside a text node always has a real rect, so this path only runs at
    // element boundaries) and doesn't shift the live selection (boundaries
    // only move for nodes inserted strictly before them), so removing the
    // marker restores the exact DOM and selection.
    const marker = document.createTextNode('\u200b')
    caretRange.insertNode(marker)
    const markerRange = document.createRange()
    markerRange.selectNodeContents(marker)
    rect = markerRange.getBoundingClientRect()
    marker.remove()
    if (isZeroRect(rect)) return
  }

  const editorRect = editor.getBoundingClientRect()
  const visibleTop = editorRect.top + editor.clientTop
  const visibleBottom = visibleTop + editor.clientHeight

  // Assignments beyond the scrollable extent are clamped by the browser, so
  // over-asking near the edges is safe.
  if (rect.bottom > visibleBottom) {
    editor.scrollTop += rect.bottom - visibleBottom
  } else if (rect.top < visibleTop) {
    editor.scrollTop -= visibleTop - rect.top
  }
}

/** All-zero rects mean "geometry unavailable" (element-boundary caret, jsdom). */
function isZeroRect(rect: DOMRect): boolean {
  return rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0
}

/**
 * Maps a plain-text offset to a DOM node + offset pair.
 * Recurses into decoration elements (markdown spans, URL anchors).
 */
export function findDOMPosition(
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
      const chipLen = chipNodeTextLength(child)
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

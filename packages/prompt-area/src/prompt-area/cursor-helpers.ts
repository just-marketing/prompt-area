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
  isTextNode,
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
  applySelectionRange(editor, range)
}

export function getCursorOffset(editor: HTMLElement): number | null {
  const range = getSelectionRange()
  if (!range) return null
  if (!editor.contains(range.startContainer)) return null

  return getTextOffsetAtPoint(editor, range.startContainer, range.startOffset)
}

/**
 * Plain-text length a whole node contributes to cursor offsets. Counting rules
 * are shared with {@link getTextLengthInRange}'s fragment walk: text nodes by
 * length, chips atomically via {@link chipNodeTextLength}, `<br>` as one
 * character (sentinel `<br>` as zero), other elements by their children.
 */
function nodeTextContribution(node: Node): number {
  if (isTextNode(node)) return (node.textContent ?? '').length
  if (isChipElement(node)) return chipNodeTextLength(node)
  if (isHTMLElement(node)) {
    if (node.tagName === 'BR') return node.dataset.sentinel ? 0 : 1
    let length = 0
    const children = node.childNodes
    for (let i = 0; i < children.length; i++) {
      length += nodeTextContribution(children[i])
    }
    return length
  }
  return 0
}

/**
 * Plain-text offset of the DOM boundary point `(container, offset)` inside the
 * editor — the length of everything before the point, under the same counting
 * rules as {@link getTextLengthInRange}, without the `Range.cloneContents()`
 * that function needs. Cloning allocates a deep copy of the whole document
 * prefix, which made every caret-offset query on the typing hot path cost
 * O(document) in allocations; this walk only reads.
 *
 * Returns null when `container` is not inside the editor.
 */
export function getTextOffsetAtPoint(
  editor: HTMLElement,
  container: Node,
  offset: number,
): number | null {
  // Ancestor path container → … → direct child of editor (empty when the
  // container is the editor itself).
  const path: Node[] = []
  let ancestor: Node | null = container
  while (ancestor && ancestor !== editor) {
    path.push(ancestor)
    ancestor = ancestor.parentNode
  }
  if (!ancestor) return null

  let length = 0
  let parent: Node = editor
  for (let depth = path.length - 1; depth >= 0; depth--) {
    const pathChild = path[depth]
    const siblings = parent.childNodes
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i]
      if (sibling === pathChild) break
      length += nodeTextContribution(sibling)
    }
    // Chips are atomic: a boundary inside a chip subtree counts the whole chip,
    // matching the clone walk (a partial clone keeps the chip shell and its
    // data attributes, so chipNodeTextLength reads the full length).
    if (isChipElement(pathChild)) {
      return length + chipNodeTextLength(pathChild)
    }
    // Non-HTML subtrees (svg, MathML) contribute nothing in the clone walk —
    // it only recurses through HTMLElements — so a boundary inside one maps
    // to the subtree's start rather than counting its internal text.
    if (!isHTMLElement(pathChild) && !isTextNode(pathChild)) {
      return length
    }
    parent = pathChild
  }

  if (isTextNode(container)) {
    return length + Math.min(offset, (container.textContent ?? '').length)
  }
  if (isHTMLElement(container) && container.tagName === 'BR') {
    // setEnd(<br>, 0) partially includes the <br>, whose cloned shell the
    // clone walk counts as one character (zero for the sentinel).
    return length + (container.dataset.sentinel ? 0 : 1)
  }
  // Element container: children before the offset index are fully included.
  const children = container.childNodes
  const limit = Math.min(offset, children.length)
  for (let i = 0; i < limit; i++) {
    length += nodeTextContribution(children[i])
  }
  return length
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

export function setCursorAtOffset(
  editor: HTMLElement,
  targetOffset: number,
  opts?: { scroll?: boolean },
): void {
  const range = document.createRange()
  const pos = findDOMPosition(editor, targetOffset)
  if (pos) {
    range.setStart(pos.node, pos.offset)
    range.collapse(true)
  } else {
    // Fallback: place cursor at end
    range.selectNodeContents(editor)
    range.collapse(false)
  }
  applySelectionRange(editor, range, opts)
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

  const start = getTextOffsetAtPoint(editor, range.startContainer, range.startOffset)
  if (start === null) return null

  if (range.collapsed) return { start, end: start }

  // A selection dragged past the editor's edge has its end outside; treat it
  // as collapsed rather than mapping a foreign node to an arbitrary offset.
  const end = getTextOffsetAtPoint(editor, range.endContainer, range.endOffset)
  if (end === null) return { start, end: start }

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
  applySelectionRange(editor, range)
}

/**
 * Commit a Range as the document selection, then keep the caret visible.
 *
 * This is the one primitive every programmatic selection placement must go
 * through (directly, or via the helpers above) so that no placement site can
 * forget the scroll correction — the 0.6.3 bug class was exactly a placement
 * that scrolled nowhere. Pass `scroll: false` only when native editing has
 * already revealed the caret (the per-keystroke decorate echo), where the
 * correction would be a redundant forced reflow.
 */
export function applySelectionRange(
  editor: HTMLElement,
  range: Range,
  opts?: { scroll?: boolean },
): void {
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
  if (opts?.scroll !== false) {
    scrollCaretIntoView(editor)
  }
}

/**
 * Scrolls the editor's own scroll box so the caret is visible.
 *
 * Browsers only auto-scroll the caret into view for native editing (typing,
 * arrow keys) — never for selections placed via the Selection API — hence
 * this correction after programmatic placements. Its scope limits are each
 * load-bearing:
 * - Collapsed selections only. A range selection has no single caret, and a
 *   re-rendered range restore (Cmd+B over a backwards selection) must not
 *   yank the viewport to the range's document-order end — for those,
 *   renderSegmentsToDOM's scrollTop preservation keeps the view stable.
 * - Focused editors only. Imperative placements into a blurred editor
 *   (handle.appendText from a toolbar button) must not pan autoGrow's
 *   collapsed preview: its overflow is hidden, but hidden boxes still honor
 *   programmatic scrollTop and the user would have no way to scroll back.
 * - Only the editor's own scrollTop moves — never ancestor scroll containers
 *   or the page.
 */
export function scrollCaretIntoView(editor: HTMLElement): void {
  // Layout-free guards first — everything up to the overflow check reads no
  // geometry, so early exits (blurred editor, range selection) cost nothing.
  const selRange = getSelectionRange()
  if (!selRange || !selRange.collapsed) return
  if (!editor.contains(selRange.startContainer)) return
  if (!editor.contains(editor.ownerDocument.activeElement)) return
  if (editor.scrollHeight <= editor.clientHeight) return

  const rect = caretLineRect(selRange)
  if (!rect) return

  // getBoundingClientRect returns visual (post-transform) pixels while
  // clientTop/clientHeight/scrollTop are layout pixels; inside a scaled
  // ancestor (zoomed canvas, a dialog's entry animation) they differ by the
  // scale factor, so convert at the boundary — otherwise visibility is
  // misjudged and the scroll delta lands in the wrong units.
  const editorRect = editor.getBoundingClientRect()
  const scale = editor.offsetHeight > 0 ? editorRect.height / editor.offsetHeight : 1
  const visibleTop = editorRect.top + editor.clientTop * scale
  const visibleBottom = visibleTop + editor.clientHeight * scale

  // scrollTop assignments beyond the scrollable extent are clamped by the
  // browser, so over-asking near the edges is safe.
  if (rect.bottom > visibleBottom) {
    editor.scrollTop += (rect.bottom - visibleBottom) / scale
  } else if (rect.top < visibleTop) {
    editor.scrollTop -= (visibleTop - rect.top) / scale
  }
}

/**
 * Measures the viewport rect of the caret line at the end of `range`,
 * working around the element-boundary gap: a collapsed range at an element
 * boundary (right after a <br> or chip) reports an all-zero rect in every
 * engine, so a temporary zero-width space is inserted at the position and
 * measured instead. Returns null when no geometry is available (jsdom).
 *
 * The marker is only ever inserted at an element boundary, never into a Text
 * node: Range.insertNode on a Text container always splits it (even at
 * offset 0) and removing the marker does not re-merge the halves, so a
 * Text-anchored position (an empty text node, or any text node in a
 * layout-less test environment) is first re-aimed at the equivalent boundary
 * in its parent. Insertion at the boundary leaves the live selection
 * untouched (range boundaries only shift for nodes inserted strictly before
 * them), so removing the marker restores the exact DOM and selection.
 *
 * Also used to anchor the trigger popover, which previously skipped its rect
 * update entirely for element-boundary trigger positions.
 */
export function caretLineRect(range: Range): DOMRect | null {
  const caretRange = range.cloneRange()
  caretRange.collapse(false)

  let rect = caretRange.getBoundingClientRect()
  if (!isZeroRect(rect)) return rect

  const container = caretRange.startContainer
  if (isTextNode(container)) {
    if (!container.parentNode) return null
    caretRange.selectNode(container)
    caretRange.collapse(true)
  }
  const marker = document.createTextNode('\u200b')
  caretRange.insertNode(marker)
  caretRange.selectNodeContents(marker)
  rect = caretRange.getBoundingClientRect()
  marker.remove()
  return isZeroRect(rect) ? null : rect
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

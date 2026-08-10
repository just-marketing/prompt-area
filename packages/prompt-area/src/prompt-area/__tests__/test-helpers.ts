/**
 * Fake scroll geometry for caret-visibility tests — jsdom has no layout.
 *
 * The editor becomes a scroll box at viewport top 0 holding `scrollHeight`
 * px of content, with the caret line at `caretTop` (content coordinates,
 * 20px tall). Ranges anchored in a non-empty text node report the caret
 * line translated by the live scrollTop; ranges at element boundaries and
 * in empty text nodes report the zero rect, like real engines do. Emptying
 * the editor clamps the mocked scrollTop to 0, mirroring the real-browser
 * collapse-clamp that renderSegmentsToDOM's clear triggers — so tests prove
 * the post-render scroll machinery actually runs.
 *
 * Assert against `editor.scrollTop` directly — the mock's setter is the
 * same property the production code writes. Callers must register
 * `afterEach(restoreRangeRect)`: the Range.prototype patch is shared state.
 */
export function mockEditorGeometry(
  editor: HTMLElement,
  opts: { caretTop: number; scrollHeight?: number; clientHeight?: number; scrollTop?: number },
): void {
  const clientHeight = opts.clientHeight ?? 100
  let scrollTop = opts.scrollTop ?? 0
  Object.defineProperty(editor, 'scrollHeight', {
    value: opts.scrollHeight ?? 400,
    configurable: true,
  })
  Object.defineProperty(editor, 'clientHeight', { value: clientHeight, configurable: true })
  Object.defineProperty(editor, 'scrollTop', {
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = v
    },
    configurable: true,
  })
  editor.getBoundingClientRect = () => new DOMRect(0, 0, 300, clientHeight)

  const originalRemoveChild = editor.removeChild.bind(editor)
  editor.removeChild = (<T extends Node>(child: T): T => {
    const removed = originalRemoveChild(child)
    if (editor.childNodes.length === 0) scrollTop = 0
    return removed as T
  }) as typeof editor.removeChild

  Range.prototype.getBoundingClientRect = function (this: Range) {
    const { startContainer } = this
    return startContainer.nodeType === Node.TEXT_NODE && startContainer.textContent !== ''
      ? new DOMRect(0, opts.caretTop - scrollTop, 0, 20)
      : new DOMRect(0, 0, 0, 0)
  }
}

const originalRangeRect = Range.prototype.getBoundingClientRect

/** Undo mockEditorGeometry's Range.prototype patch (call in afterEach). */
export function restoreRangeRect() {
  Range.prototype.getBoundingClientRect = originalRangeRect
}

/** Place the caret at the end of the editor's content. */
export function placeCursorAtEnd(editor: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Place the caret at a character offset within the editor's first text node. */
export function placeCursor(editor: HTMLElement, offset: number) {
  const range = document.createRange()
  const node = editor.firstChild ?? editor
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

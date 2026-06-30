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

import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveCursorPosition,
  restoreCursorPosition,
  getCursorOffset,
  setCursorAtOffset,
  createRangeAtOffset,
  getSelectionOffsets,
  setSelectionAtOffsets,
  getTextLengthInRange,
  findDOMPosition,
} from '../cursor-helpers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEditor(): HTMLDivElement {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  return editor
}

function makeChip(trigger: string, display: string): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.dataset.chipTrigger = trigger
  chip.dataset.chipDisplay = display
  chip.contentEditable = 'false'
  chip.textContent = trigger + display
  return chip
}

function makeSentinelBr(): HTMLBRElement {
  const br = document.createElement('br')
  br.dataset.sentinel = 'true'
  return br
}

function placeCursor(node: Node, offset: number): void {
  const sel = window.getSelection()
  if (!sel) throw new Error('no selection')
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

function placeSelection(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number,
): void {
  const sel = window.getSelection()
  if (!sel) throw new Error('no selection')
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  sel.removeAllRanges()
  sel.addRange(range)
}

beforeEach(() => {
  document.body.innerHTML = ''
})

// ---------------------------------------------------------------------------
// getTextLengthInRange
// ---------------------------------------------------------------------------

describe('getTextLengthInRange', () => {
  it('counts plain text length', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hello'))
    const range = document.createRange()
    range.selectNodeContents(editor)
    expect(getTextLengthInRange(range)).toBe(5)
  })

  it('counts chip as trigger + displayText', () => {
    const editor = makeEditor()
    editor.appendChild(makeChip('@', 'Alice')) // 6 chars
    const range = document.createRange()
    range.selectNodeContents(editor)
    expect(getTextLengthInRange(range)).toBe(6)
  })

  it('counts BR as 1 char', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('a'))
    editor.appendChild(document.createElement('br'))
    editor.appendChild(document.createTextNode('b'))
    const range = document.createRange()
    range.selectNodeContents(editor)
    expect(getTextLengthInRange(range)).toBe(3)
  })

  it('skips sentinel BR elements', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('x'))
    editor.appendChild(makeSentinelBr())
    const range = document.createRange()
    range.selectNodeContents(editor)
    expect(getTextLengthInRange(range)).toBe(1)
  })

  it('recurses into nested decoration elements', () => {
    const editor = makeEditor()
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('bold'))
    editor.appendChild(span)
    const range = document.createRange()
    range.selectNodeContents(editor)
    expect(getTextLengthInRange(range)).toBe(4)
  })

  it('mixes text, chips, and BRs', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hi '))
    editor.appendChild(makeChip('@', 'Bob')) // 4
    editor.appendChild(document.createTextNode(' there'))
    editor.appendChild(document.createElement('br'))
    const range = document.createRange()
    range.selectNodeContents(editor)
    // 'hi ' (3) + '@Bob' (4) + ' there' (6) + br (1) = 14
    expect(getTextLengthInRange(range)).toBe(14)
  })

  it('handles a partial range that ends mid-text (setEnd inside a text node)', () => {
    // This is the path exercised by getCursorOffset and getSelectionOffsets —
    // a range that selects from the editor start and ends inside a text node.
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hi '))
    const chip = makeChip('@', 'Bob') // 4 chars
    editor.appendChild(chip)
    const tail = document.createTextNode(' world')
    editor.appendChild(tail)
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.setEnd(tail, 3) // 'hi ' (3) + '@Bob' (4) + ' wo' (3) = 10
    expect(getTextLengthInRange(range)).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// findDOMPosition
// ---------------------------------------------------------------------------

describe('findDOMPosition', () => {
  it('maps offset inside a single text node', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    const pos = findDOMPosition(editor, 3)
    expect(pos).toEqual({ node: text, offset: 3 })
  })

  it('positions at end of container when offset exceeds content', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('abc'))
    const pos = findDOMPosition(editor, 999)
    expect(pos).toEqual({ node: editor, offset: editor.childNodes.length })
  })

  it('positions after a chip when offset falls inside it', () => {
    const editor = makeEditor()
    const before = document.createTextNode('a ')
    const chip = makeChip('@', 'Bob') // 4 chars
    editor.appendChild(before)
    editor.appendChild(chip)
    // offset 3 falls inside the chip (positions 2..6). Helper places cursor
    // right after the chip.
    const pos = findDOMPosition(editor, 3)
    expect(pos).toEqual({ node: editor, offset: 2 })
  })

  it('positions after a BR when offset falls on it', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('a'))
    editor.appendChild(document.createElement('br'))
    editor.appendChild(document.createTextNode('b'))
    const pos = findDOMPosition(editor, 2) // after the br
    expect(pos).toEqual({ node: editor, offset: 2 })
  })

  it('skips sentinel BRs', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hello'))
    editor.appendChild(makeSentinelBr())
    const pos = findDOMPosition(editor, 5)
    expect(pos?.offset).toBe(5)
    expect(pos?.node.nodeType).toBe(Node.TEXT_NODE)
  })

  it('recurses into decoration elements', () => {
    const editor = makeEditor()
    const span = document.createElement('span')
    const inner = document.createTextNode('bold')
    span.appendChild(inner)
    editor.appendChild(span)
    const pos = findDOMPosition(editor, 2)
    expect(pos).toEqual({ node: inner, offset: 2 })
  })
})

// ---------------------------------------------------------------------------
// saveCursorPosition / restoreCursorPosition
// ---------------------------------------------------------------------------

describe('saveCursorPosition / restoreCursorPosition', () => {
  it('returns null when there is no selection', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hello'))
    window.getSelection()?.removeAllRanges()
    expect(saveCursorPosition(editor)).toBeNull()
  })

  it('returns null when selection is outside the editor', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hello'))
    const outside = document.createElement('div')
    const outsideText = document.createTextNode('nope')
    outside.appendChild(outsideText)
    document.body.appendChild(outside)
    placeCursor(outsideText, 2)
    expect(saveCursorPosition(editor)).toBeNull()
  })

  it('round-trips cursor through a text node', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    placeCursor(text, 3)

    const saved = saveCursorPosition(editor)
    if (!saved) throw new Error('saveCursorPosition returned null')

    // Move the cursor elsewhere
    placeCursor(text, 0)

    restoreCursorPosition(editor, saved)
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.startContainer).toBe(text)
    expect(range?.startOffset).toBe(3)
  })

  it('clamps restore offset to the target node length', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('short'))
    restoreCursorPosition(editor, { nodeIndex: 0, offset: 999 })
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.startOffset).toBe(5)
  })

  it('places cursor at end when nodeIndex is out of range', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('abc'))
    restoreCursorPosition(editor, { nodeIndex: 99, offset: 0 })
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.startContainer.nodeType).toBe(Node.TEXT_NODE)
    expect(range?.startOffset).toBe(3)
  })

  it('no-ops when editor has no children', () => {
    const editor = makeEditor()
    restoreCursorPosition(editor, { nodeIndex: 0, offset: 0 })
    // no throw = success
    expect(editor.childNodes.length).toBe(0)
  })

  it('places cursor after a non-text child when targetNode is not a text node', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('before'))
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.dataset.chipDisplay = 'Alice'
    chip.textContent = '@Alice'
    editor.appendChild(chip) // childNodes[1] — not a text node
    restoreCursorPosition(editor, { nodeIndex: 1, offset: 0 })
    const range = window.getSelection()?.getRangeAt(0)
    // setStartAfter(chip) places the cursor right after the chip element.
    expect(range?.startContainer).toBe(editor)
    expect(range?.startOffset).toBe(2)
  })

  it('saves nodeIndex when selection is on the editor itself', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('a'))
    editor.appendChild(document.createTextNode('b'))
    placeCursor(editor, 1)
    const saved = saveCursorPosition(editor)
    expect(saved).toEqual({ nodeIndex: 1, offset: 0 })
  })
})

// ---------------------------------------------------------------------------
// getCursorOffset
// ---------------------------------------------------------------------------

describe('getCursorOffset', () => {
  it('returns the plain-text offset of the cursor', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello world')
    editor.appendChild(text)
    placeCursor(text, 6)
    expect(getCursorOffset(editor)).toBe(6)
  })

  it('accounts for chips as trigger+display length', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('a '))
    editor.appendChild(makeChip('@', 'Bob')) // 4 chars
    const after = document.createTextNode(' c')
    editor.appendChild(after)
    placeCursor(after, 1)
    // 'a ' (2) + '@Bob' (4) + ' ' (1) = 7
    expect(getCursorOffset(editor)).toBe(7)
  })

  it('returns null when selection is outside the editor', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hi'))
    const outside = document.createElement('div')
    const outsideText = document.createTextNode('x')
    outside.appendChild(outsideText)
    document.body.appendChild(outside)
    placeCursor(outsideText, 0)
    expect(getCursorOffset(editor)).toBeNull()
  })

  it('returns null when there is no selection', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hi'))
    window.getSelection()?.removeAllRanges()
    expect(getCursorOffset(editor)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// setCursorAtOffset
// ---------------------------------------------------------------------------

describe('setCursorAtOffset', () => {
  it('sets cursor inside a text node at the given offset', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    setCursorAtOffset(editor, 3)
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.startContainer).toBe(text)
    expect(range?.startOffset).toBe(3)
  })

  it('positions cursor at the end of the text node when offset equals its length', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hi')
    editor.appendChild(text)
    setCursorAtOffset(editor, 2)
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.startContainer).toBe(text)
    expect(range?.startOffset).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// createRangeAtOffset
// ---------------------------------------------------------------------------

describe('createRangeAtOffset', () => {
  it('creates a collapsed range at the given offset', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    const range = createRangeAtOffset(editor, 2)
    if (!range) throw new Error('createRangeAtOffset returned null')
    expect(range.collapsed).toBe(true)
    expect(range.startContainer).toBe(text)
    expect(range.startOffset).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// getSelectionOffsets / setSelectionAtOffsets
// ---------------------------------------------------------------------------

describe('getSelectionOffsets', () => {
  it('returns equal start and end for a collapsed selection', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    placeCursor(text, 2)
    expect(getSelectionOffsets(editor)).toEqual({ start: 2, end: 2 })
  })

  it('returns distinct start and end for a range', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello world')
    editor.appendChild(text)
    placeSelection(text, 2, text, 7)
    expect(getSelectionOffsets(editor)).toEqual({ start: 2, end: 7 })
  })

  it('returns null when selection is outside the editor', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hi'))
    const outside = document.createElement('div')
    const outsideText = document.createTextNode('x')
    outside.appendChild(outsideText)
    document.body.appendChild(outside)
    placeCursor(outsideText, 0)
    expect(getSelectionOffsets(editor)).toBeNull()
  })
})

describe('setSelectionAtOffsets', () => {
  it('collapses the selection when start equals end', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello')
    editor.appendChild(text)
    setSelectionAtOffsets(editor, 2, 2)
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.collapsed).toBe(true)
    expect(range?.startOffset).toBe(2)
  })

  it('extends the selection between the two offsets', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello world')
    editor.appendChild(text)
    setSelectionAtOffsets(editor, 2, 7)
    const range = window.getSelection()?.getRangeAt(0)
    expect(range?.collapsed).toBe(false)
    expect(range?.startContainer).toBe(text)
    expect(range?.endContainer).toBe(text)
    expect(range?.startOffset).toBe(2)
    expect(range?.endOffset).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// Round-trip: offsets survive a DOM rewrite when node structure is preserved
// ---------------------------------------------------------------------------

describe('cursor round-trip across DOM rewrite', () => {
  it('restores cursor to the same plain-text offset after node replacement', () => {
    const editor = makeEditor()
    editor.appendChild(document.createTextNode('hello world'))
    setCursorAtOffset(editor, 6)
    const before = getCursorOffset(editor)
    expect(before).toBe(6)

    // Simulate a render pass: replace the text node with new text of equal length
    if (before === null) throw new Error('getCursorOffset returned null')
    editor.replaceChildren(document.createTextNode('HELLO world'))
    setCursorAtOffset(editor, before)
    expect(getCursorOffset(editor)).toBe(6)
  })
})

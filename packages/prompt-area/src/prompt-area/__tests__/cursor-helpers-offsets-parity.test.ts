import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCursorOffset,
  getSelectionOffsets,
  getTextLengthInRange,
  getTextOffsetAtPoint,
  setCursorAtOffset,
} from '../cursor-helpers'

// ---------------------------------------------------------------------------
// The allocation-free getTextOffsetAtPoint must agree with the legacy
// cloneContents-based measurement (kept as getTextLengthInRange) at every DOM
// boundary point. The sweep below generates seeded random flat editors in the
// shapes the component actually produces — text nodes, <br>s, a sentinel <br>,
// chips, and nested decoration elements — and checks every enumerable
// boundary point against the legacy oracle.
// ---------------------------------------------------------------------------

/** The pre-P1 implementation, verbatim, as the parity oracle. */
function oracleOffsetAtPoint(editor: HTMLElement, container: Node, offset: number): number {
  const preRange = document.createRange()
  preRange.selectNodeContents(editor)
  preRange.setEnd(container, offset)
  return getTextLengthInRange(preRange)
}

/** Deterministic LCG so failures reproduce. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function makeChip(trigger: string, display: string): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.dataset.chipTrigger = trigger
  chip.dataset.chipDisplay = display
  chip.contentEditable = 'false'
  chip.textContent = trigger + display
  return chip
}

function makeDecorationSpan(text: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.dataset.md = 'true'
  span.textContent = text
  return span
}

/** Heading-style wrapper: a data-md span containing marker + body spans. */
function makeHeadingSpan(level: number, text: string): HTMLSpanElement {
  const wrapper = document.createElement('span')
  wrapper.dataset.md = 'true'
  wrapper.dataset.mdHeading = String(level)
  const marker = document.createElement('span')
  marker.className = 'prompt-area-md-marker'
  marker.textContent = `${'#'.repeat(level)} `
  const body = document.createElement('span')
  body.className = 'prompt-area-md-heading-text'
  body.textContent = text
  wrapper.appendChild(marker)
  wrapper.appendChild(body)
  return wrapper
}

function makeUrlAnchor(url: string): HTMLAnchorElement {
  const anchor = document.createElement('a')
  anchor.dataset.url = 'true'
  anchor.href = url
  anchor.textContent = url
  return anchor
}

const SAMPLE_TEXTS = ['', 'a', 'hello', '  • x', '**b**', 'see #4', 'long enough text']

function buildRandomEditor(rand: () => number): HTMLDivElement {
  const editor = document.createElement('div')
  editor.setAttribute('contenteditable', 'true')
  document.body.appendChild(editor)

  const childCount = 1 + Math.floor(rand() * 7)
  for (let i = 0; i < childCount; i++) {
    const roll = rand()
    if (roll < 0.35) {
      editor.appendChild(
        document.createTextNode(SAMPLE_TEXTS[Math.floor(rand() * SAMPLE_TEXTS.length)]),
      )
    } else if (roll < 0.55) {
      editor.appendChild(document.createElement('br'))
    } else if (roll < 0.7) {
      editor.appendChild(makeChip('@', `user${Math.floor(rand() * 10)}`))
    } else if (roll < 0.82) {
      editor.appendChild(makeDecorationSpan(SAMPLE_TEXTS[1 + Math.floor(rand() * 5)]))
    } else if (roll < 0.92) {
      editor.appendChild(makeUrlAnchor('https://example.com/x'))
    } else {
      editor.appendChild(makeHeadingSpan(1 + Math.floor(rand() * 3), 'Heading text'))
    }
  }
  // Trailing sentinel <br> half the time, mirroring renderSegmentsToDOM.
  if (rand() < 0.5) {
    const sentinel = document.createElement('br')
    sentinel.dataset.sentinel = 'true'
    editor.appendChild(sentinel)
  }
  return editor
}

type BoundaryPoint = { container: Node; offset: number }

/** Every valid (container, offset) boundary point in the subtree. */
function enumerateBoundaryPoints(root: Node): BoundaryPoint[] {
  const points: BoundaryPoint[] = []
  const visit = (node: Node): void => {
    if (node instanceof Text) {
      const len = (node.textContent ?? '').length
      for (let o = 0; o <= len; o++) points.push({ container: node, offset: o })
      return
    }
    for (let o = 0; o <= node.childNodes.length; o++) points.push({ container: node, offset: o })
    node.childNodes.forEach(visit)
  }
  visit(root)
  return points
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

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('getTextOffsetAtPoint parity with the cloneContents oracle', () => {
  it('matches at every boundary point across seeded random editors', () => {
    const rand = makeRandom(0xc0ffee)
    for (let e = 0; e < 200; e++) {
      const editor = buildRandomEditor(rand)
      for (const { container, offset } of enumerateBoundaryPoints(editor)) {
        const actual = getTextOffsetAtPoint(editor, container, offset)
        const expected = oracleOffsetAtPoint(editor, container, offset)
        if (actual !== expected) {
          throw new Error(
            `editor #${e} mismatch at <${container.nodeName}>, offset ${offset}: ` +
              `got ${actual}, oracle ${expected}, html: ${editor.innerHTML}`,
          )
        }
      }
      editor.remove()
    }
  })

  it('returns null for a container outside the editor', () => {
    const editor = document.createElement('div')
    document.body.appendChild(editor)
    const outside = document.createTextNode('elsewhere')
    document.body.appendChild(outside)
    expect(getTextOffsetAtPoint(editor, outside, 0)).toBeNull()
  })

  it('counts a boundary inside a chip subtree as the whole chip', () => {
    const editor = document.createElement('div')
    document.body.appendChild(editor)
    editor.appendChild(document.createTextNode('hi '))
    const chip = makeChip('@', 'alice')
    editor.appendChild(chip)
    const chipText = chip.firstChild as Text
    // '@alice' is 6 chars; a boundary 2 chars into the chip's text still
    // counts the full chip, exactly as the partial-clone walk does.
    expect(getTextOffsetAtPoint(editor, chipText, 2)).toBe(3 + 6)
    expect(getTextOffsetAtPoint(editor, chipText, 2)).toBe(oracleOffsetAtPoint(editor, chipText, 2))
  })

  it('skips the sentinel <br> and counts real <br> containers as one character', () => {
    const editor = document.createElement('div')
    document.body.appendChild(editor)
    editor.appendChild(document.createTextNode('ab'))
    const br = document.createElement('br')
    editor.appendChild(br)
    const sentinel = document.createElement('br')
    sentinel.dataset.sentinel = 'true'
    editor.appendChild(sentinel)

    expect(getTextOffsetAtPoint(editor, br, 0)).toBe(oracleOffsetAtPoint(editor, br, 0))
    expect(getTextOffsetAtPoint(editor, sentinel, 0)).toBe(oracleOffsetAtPoint(editor, sentinel, 0))
    expect(getTextOffsetAtPoint(editor, editor, 3)).toBe(3) // ab + br
    expect(getTextOffsetAtPoint(editor, editor, 3)).toBe(oracleOffsetAtPoint(editor, editor, 3))
  })
})

describe('getCursorOffset / getSelectionOffsets parity via live selections', () => {
  it('getCursorOffset agrees with the oracle at sampled points', () => {
    const rand = makeRandom(0xbadf00d)
    for (let e = 0; e < 40; e++) {
      const editor = buildRandomEditor(rand)
      const points = enumerateBoundaryPoints(editor)
      for (let s = 0; s < 12; s++) {
        const { container, offset } = points[Math.floor(rand() * points.length)]
        placeCursor(container, offset)
        expect(getCursorOffset(editor)).toBe(oracleOffsetAtPoint(editor, container, offset))
      }
      editor.remove()
    }
  })

  it('getSelectionOffsets agrees with the oracle for non-collapsed selections', () => {
    const rand = makeRandom(0xfeed)
    for (let e = 0; e < 40; e++) {
      const editor = buildRandomEditor(rand)
      const points = enumerateBoundaryPoints(editor)
      for (let s = 0; s < 8; s++) {
        const a = points[Math.floor(rand() * points.length)]
        const b = points[Math.floor(rand() * points.length)]
        const range = document.createRange()
        range.setStart(a.container, a.offset)
        // setEnd before the start collapses the range to the end point; read
        // the normalized boundaries back as ground truth either way.
        range.setEnd(b.container, b.offset)
        const sel = window.getSelection()
        if (!sel) throw new Error('no selection')
        sel.removeAllRanges()
        sel.addRange(range)

        const offsets = getSelectionOffsets(editor)
        expect(offsets).not.toBeNull()
        expect(offsets?.start).toBe(
          oracleOffsetAtPoint(editor, range.startContainer, range.startOffset),
        )
        expect(offsets?.end).toBe(oracleOffsetAtPoint(editor, range.endContainer, range.endOffset))
      }
      editor.remove()
    }
  })

  it('setCursorAtOffset placements read back consistently with the oracle', () => {
    const editor = document.createElement('div')
    document.body.appendChild(editor)
    editor.appendChild(document.createTextNode('one '))
    editor.appendChild(makeDecorationSpan('**two**'))
    editor.appendChild(document.createElement('br'))
    editor.appendChild(document.createTextNode('three'))

    const total = getTextOffsetAtPoint(editor, editor, editor.childNodes.length) ?? 0
    expect(total).toBe('one '.length + '**two**'.length + 1 + 'three'.length)

    for (let k = 0; k <= total; k++) {
      setCursorAtOffset(editor, k, { scroll: false })
      const sel = window.getSelection()
      expect(sel?.rangeCount).toBe(1)
      const range = sel!.getRangeAt(0)
      expect(getCursorOffset(editor)).toBe(
        oracleOffsetAtPoint(editor, range.startContainer, range.startOffset),
      )
    }
  })
})

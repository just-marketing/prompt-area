import { describe, it, expect, beforeEach } from 'vitest'
import {
  serializeFragmentToPlainText,
  serializeFragmentToSegments,
  parseSegmentsFromClipboard,
  insertSegmentsAtCursor,
} from '../clipboard-helpers'
import type { Segment } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFragment(): DocumentFragment {
  return document.createDocumentFragment()
}

type ChipExtras = {
  value?: string
  chipAutoResolved?: 'true'
  chipData?: string
}

function makeChipEl(trigger: string, display: string, extras: ChipExtras = {}): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.dataset.chipTrigger = trigger
  chip.dataset.chipDisplay = display
  chip.dataset.chipValue = extras.value ?? display
  if (extras.chipAutoResolved !== undefined) chip.dataset.chipAutoResolved = extras.chipAutoResolved
  if (extras.chipData !== undefined) chip.dataset.chipData = extras.chipData
  chip.contentEditable = 'false'
  chip.textContent = trigger + display
  return chip
}

function makeEditor(): HTMLDivElement {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  return editor
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

// ---------------------------------------------------------------------------
// serializeFragmentToPlainText
// ---------------------------------------------------------------------------

describe('serializeFragmentToPlainText', () => {
  it('returns empty string for an empty fragment', () => {
    expect(serializeFragmentToPlainText(makeFragment())).toBe('')
  })

  it('serializes plain text', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createTextNode('hello'))
    expect(serializeFragmentToPlainText(fragment)).toBe('hello')
  })

  it('serializes a chip as trigger + display', () => {
    const fragment = makeFragment()
    fragment.appendChild(makeChipEl('@', 'Alice'))
    expect(serializeFragmentToPlainText(fragment)).toBe('@Alice')
  })

  it('converts BR elements to newlines', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createTextNode('a'))
    fragment.appendChild(document.createElement('br'))
    fragment.appendChild(document.createTextNode('b'))
    expect(serializeFragmentToPlainText(fragment)).toBe('a\nb')
  })

  it('mixes text, chips, and newlines', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createTextNode('hi '))
    fragment.appendChild(makeChipEl('@', 'Bob'))
    fragment.appendChild(document.createTextNode(' and '))
    fragment.appendChild(makeChipEl('#', 'readme'))
    expect(serializeFragmentToPlainText(fragment)).toBe('hi @Bob and #readme')
  })

  it('falls back to textContent when chip lacks a chipDisplay attribute', () => {
    const fragment = makeFragment()
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.textContent = '@Ghost'
    fragment.appendChild(chip)
    expect(serializeFragmentToPlainText(fragment)).toBe('@@Ghost')
  })

  it('recurses into nested wrapper elements', () => {
    const fragment = makeFragment()
    const wrapper = document.createElement('span')
    wrapper.appendChild(document.createTextNode('bold'))
    fragment.appendChild(wrapper)
    expect(serializeFragmentToPlainText(fragment)).toBe('bold')
  })
})

// ---------------------------------------------------------------------------
// serializeFragmentToSegments
// ---------------------------------------------------------------------------

describe('serializeFragmentToSegments', () => {
  it('returns empty array for an empty fragment', () => {
    expect(serializeFragmentToSegments(makeFragment())).toEqual([])
  })

  it('produces a text segment for plain text', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createTextNode('hello'))
    expect(serializeFragmentToSegments(fragment)).toEqual([{ type: 'text', text: 'hello' }])
  })

  it('skips empty text nodes', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createTextNode(''))
    fragment.appendChild(document.createTextNode('hi'))
    expect(serializeFragmentToSegments(fragment)).toEqual([{ type: 'text', text: 'hi' }])
  })

  it('produces a chip segment preserving trigger, value, displayText', () => {
    const fragment = makeFragment()
    const chip = makeChipEl('@', 'Alice', { value: 'alice-id-1' })
    fragment.appendChild(chip)
    expect(serializeFragmentToSegments(fragment)).toEqual([
      {
        type: 'chip',
        trigger: '@',
        value: 'alice-id-1',
        displayText: 'Alice',
      },
    ])
  })

  it('preserves autoResolved flag when set', () => {
    const fragment = makeFragment()
    const chip = makeChipEl('#', 'readme', { value: 'readme', chipAutoResolved: 'true' })
    fragment.appendChild(chip)
    expect(serializeFragmentToSegments(fragment)).toEqual([
      {
        type: 'chip',
        trigger: '#',
        value: 'readme',
        displayText: 'readme',
        autoResolved: true,
      },
    ])
  })

  it('parses chipData from JSON when present', () => {
    const fragment = makeFragment()
    const chip = makeChipEl('@', 'Alice', { value: 'a1', chipData: '{"role":"admin"}' })
    fragment.appendChild(chip)
    const segments = serializeFragmentToSegments(fragment)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({
      type: 'chip',
      trigger: '@',
      value: 'a1',
      displayText: 'Alice',
      data: { role: 'admin' },
    })
  })

  it('converts BR to newline text segment', () => {
    const fragment = makeFragment()
    fragment.appendChild(document.createElement('br'))
    expect(serializeFragmentToSegments(fragment)).toEqual([{ type: 'text', text: '\n' }])
  })

  it('skips chips missing the trigger attribute', () => {
    const fragment = makeFragment()
    const broken = document.createElement('span')
    // No dataset.chipTrigger, so isChipElement returns false — recurses
    broken.textContent = 'fallback'
    fragment.appendChild(broken)
    expect(serializeFragmentToSegments(fragment)).toEqual([{ type: 'text', text: 'fallback' }])
  })

  it('silently drops a chip element with trigger but missing chipValue', () => {
    // isChipElement returns true (dataset.chipTrigger is set), but the
    // `trigger && chipValue !== undefined && display` guard fails. The chip
    // is dropped without falling back to text — exercises the guard's else path.
    const fragment = makeFragment()
    const incomplete = document.createElement('span')
    incomplete.dataset.chipTrigger = '@'
    incomplete.dataset.chipDisplay = 'Alice'
    // intentionally no chipValue
    incomplete.textContent = '@Alice'
    fragment.appendChild(incomplete)
    expect(serializeFragmentToSegments(fragment)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// parseSegmentsFromClipboard
// ---------------------------------------------------------------------------

describe('parseSegmentsFromClipboard', () => {
  it('returns null for invalid JSON', () => {
    expect(parseSegmentsFromClipboard('not json')).toBeNull()
  })

  it('returns null for a non-array payload', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify({ type: 'text', text: 'hi' }))).toBeNull()
  })

  it('returns an empty array for an empty array payload', () => {
    expect(parseSegmentsFromClipboard('[]')).toEqual([])
  })

  it('parses a simple text segment', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify([{ type: 'text', text: 'hello' }]))).toEqual([
      { type: 'text', text: 'hello' },
    ])
  })

  it('parses a chip segment', () => {
    const input: Segment[] = [{ type: 'chip', trigger: '@', value: 'v1', displayText: 'Alice' }]
    expect(parseSegmentsFromClipboard(JSON.stringify(input))).toEqual(input)
  })

  it('omits the data key entirely when the input chip has no data field', () => {
    const json = JSON.stringify([{ type: 'chip', trigger: '@', value: 'v1', displayText: 'Alice' }])
    const parsed = parseSegmentsFromClipboard(json)
    expect(parsed).not.toBeNull()
    const chip = parsed?.[0]
    expect(chip).toBeDefined()
    expect(chip).not.toHaveProperty('data')
    expect(chip).not.toHaveProperty('autoResolved')
  })

  it('preserves chip data field when provided', () => {
    const input = [
      {
        type: 'chip',
        trigger: '@',
        value: 'v1',
        displayText: 'Alice',
        data: { role: 'admin' },
      },
    ]
    expect(parseSegmentsFromClipboard(JSON.stringify(input))).toEqual(input)
  })

  it('preserves autoResolved flag', () => {
    const input = [
      {
        type: 'chip',
        trigger: '#',
        value: 'readme',
        displayText: 'readme',
        autoResolved: true,
      },
    ]
    expect(parseSegmentsFromClipboard(JSON.stringify(input))).toEqual(input)
  })

  it('returns null when a segment has unknown type', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify([{ type: 'image', url: 'x' }]))).toBeNull()
  })

  it('returns null when a text segment has non-string text', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify([{ type: 'text', text: 42 }]))).toBeNull()
  })

  it('returns null when a chip segment is missing required fields', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify([{ type: 'chip', trigger: '@' }]))).toBeNull()
  })

  it('returns null when an item is not an object', () => {
    expect(parseSegmentsFromClipboard(JSON.stringify(['plain string']))).toBeNull()
  })

  it('passes through arbitrary shapes in the chip `data` field untyped', () => {
    // `data` is typed as `unknown` — JSON-serializable shapes survive round-trip
    // without coercion. The helper does not validate `data` beyond JSON.parse.
    const input = [
      { type: 'chip', trigger: '@', value: 'v1', displayText: 'A', data: null },
      { type: 'chip', trigger: '@', value: 'v2', displayText: 'B', data: [1, 2, 3] },
      { type: 'chip', trigger: '@', value: 'v3', displayText: 'C', data: { nested: { ok: true } } },
    ]
    expect(parseSegmentsFromClipboard(JSON.stringify(input))).toEqual(input)
  })
})

// ---------------------------------------------------------------------------
// insertSegmentsAtCursor
// ---------------------------------------------------------------------------

describe('insertSegmentsAtCursor', () => {
  it('appends pasted segments when there is no selection', () => {
    const editor = makeEditor()
    window.getSelection()?.removeAllRanges()
    const current: Segment[] = [{ type: 'text', text: 'hello' }]
    const pasted: Segment[] = [{ type: 'text', text: ' world' }]
    expect(insertSegmentsAtCursor(current, pasted, editor)).toEqual([
      { type: 'text', text: 'hello' },
      { type: 'text', text: ' world' },
    ])
  })

  it('inserts pasted segments at the cursor offset within a single text segment', () => {
    const editor = makeEditor()
    const text = document.createTextNode('hello world')
    editor.appendChild(text)
    placeCursor(text, 5)

    const current: Segment[] = [{ type: 'text', text: 'hello world' }]
    const pasted: Segment[] = [{ type: 'text', text: ' NEW' }]
    const result = insertSegmentsAtCursor(current, pasted, editor)
    expect(result).toEqual([{ type: 'text', text: 'hello NEW world' }])
  })

  it('inserts pasted segments at a boundary between two text segments', () => {
    const editor = makeEditor()
    const first = document.createTextNode('hello')
    const second = document.createTextNode(' world')
    editor.appendChild(first)
    editor.appendChild(second)
    placeCursor(second, 0)

    const current: Segment[] = [
      { type: 'text', text: 'hello' },
      { type: 'text', text: ' world' },
    ]
    const pasted: Segment[] = [{ type: 'text', text: ' NEW' }]
    const result = insertSegmentsAtCursor(current, pasted, editor)
    expect(result).toEqual([{ type: 'text', text: 'hello NEW world' }])
  })

  it('inserts at the beginning when cursor is at offset 0', () => {
    const editor = makeEditor()
    const text = document.createTextNode('abc')
    editor.appendChild(text)
    placeCursor(text, 0)

    const result = insertSegmentsAtCursor(
      [{ type: 'text', text: 'abc' }],
      [{ type: 'text', text: 'X' }],
      editor,
    )
    expect(result).toEqual([{ type: 'text', text: 'Xabc' }])
  })

  it('inserts at the end when cursor is at the final offset', () => {
    const editor = makeEditor()
    const text = document.createTextNode('abc')
    editor.appendChild(text)
    placeCursor(text, 3)

    const result = insertSegmentsAtCursor(
      [{ type: 'text', text: 'abc' }],
      [{ type: 'text', text: 'Z' }],
      editor,
    )
    expect(result).toEqual([{ type: 'text', text: 'abcZ' }])
  })

  it('preserves chip segments that flank the insertion point', () => {
    const editor = makeEditor()
    const before = document.createTextNode('a ')
    const chip = makeChipEl('@', 'Bob') // 4 chars
    const after = document.createTextNode(' c')
    editor.appendChild(before)
    editor.appendChild(chip)
    editor.appendChild(after)
    placeCursor(after, 0) // right after the chip, offset 6 in plain text

    const current: Segment[] = [
      { type: 'text', text: 'a ' },
      { type: 'chip', trigger: '@', value: 'bob', displayText: 'Bob' },
      { type: 'text', text: ' c' },
    ]
    const pasted: Segment[] = [{ type: 'text', text: '!' }]
    const result = insertSegmentsAtCursor(current, pasted, editor)

    // Exact shape: text, chip, pasted-text-merged-with-trailing-text.
    expect(result).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'chip', trigger: '@', value: 'bob', displayText: 'Bob' },
      { type: 'text', text: '! c' },
    ])
  })
})

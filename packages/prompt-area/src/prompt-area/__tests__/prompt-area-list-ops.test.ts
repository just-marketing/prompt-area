import { describe, it, expect } from 'vitest'
import type { Segment } from '../types'
import {
  renumberOrderedListLines,
  renumberOrderedListSegments,
  remapOffset,
  hasOrderedListRun,
  indentListItem,
  outdentListItem,
  insertListContinuation,
  getListContext,
} from '../prompt-area-list-ops'

const text = (t: string): Segment[] => [{ type: 'text', text: t }]

describe('renumberOrderedListLines — counter stack', () => {
  it('rebuilds a broken sequence (1. 1. 1. -> 1. 2. 3.)', () => {
    expect(renumberOrderedListLines('1. a\n1. b\n1. c').text).toBe('1. a\n2. b\n3. c')
  })

  it('renumbers after a deleted middle item (1,2,4 -> 1,2,3)', () => {
    expect(renumberOrderedListLines('1. a\n2. b\n4. d').text).toBe('1. a\n2. b\n3. d')
  })

  it('restarts every run at 1 regardless of the typed start (5,5 -> 1,2)', () => {
    expect(renumberOrderedListLines('5. a\n5. b').text).toBe('1. a\n2. b')
  })

  it('continues the parent level across a nested sublist', () => {
    // 1. a / ␣␣9. sub / 5. b  →  sub restarts at 1, b continues parent to 2
    expect(renumberOrderedListLines('1. a\n  9. sub\n5. b').text).toBe('1. a\n  1. sub\n2. b')
  })

  it('handles 3+ levels: continues each level, clears deeper on ascend', () => {
    const input = '1. a\n  1. b\n    1. c\n  9. d\n9. e'
    // level0: a=1,e=2 ; level1 under a: b=1,d=2 ; level2: c=1
    expect(renumberOrderedListLines(input).text).toBe('1. a\n  1. b\n    1. c\n  2. d\n2. e')
  })

  it('a blank line breaks the run (two independent lists)', () => {
    expect(renumberOrderedListLines('1. a\n2. b\n\n1. c\n1. d').text).toBe(
      '1. a\n2. b\n\n1. c\n2. d',
    )
  })

  it('a plain line breaks the run', () => {
    expect(renumberOrderedListLines('1. a\nplain\n1. b').text).toBe('1. a\nplain\n1. b')
  })

  it('a bullet at the same level breaks numbered continuity (restarts at 1)', () => {
    // level-0 counter cleared by the bullet, so the next numbered line restarts
    expect(renumberOrderedListLines('1. a\n• x\n3. b').text).toBe('1. a\n• x\n1. b')
  })

  it('a nested bullet does NOT break a shallower numbered run', () => {
    expect(renumberOrderedListLines('1. a\n  • x\n5. b').text).toBe('1. a\n  • x\n2. b')
  })

  it('is idempotent and returns the same ref when unchanged', () => {
    const input = '1. a\n2. b\n3. c'
    const first = renumberOrderedListLines(input)
    expect(first.text).toBe(input)
    expect(first.edits).toHaveLength(0)
    const second = renumberOrderedListLines(first.text)
    expect(second.text).toBe(input)
    expect(second.edits).toHaveLength(0)
  })

  it('renumbers identically in markdown-off style (numbers exist regardless)', () => {
    // "- " bullets never carry numbers; numbered lines still renumber
    expect(renumberOrderedListLines('1. a\n1. b\n- x').text).toBe('1. a\n2. b\n- x')
  })

  it('leaves paren-style 1) untouched (non-goal)', () => {
    expect(renumberOrderedListLines('1) a\n1) b').text).toBe('1) a\n1) b')
  })
})

describe('remapOffset', () => {
  // A shrink (10→9) upstream at [0,2)→"9" and a growth (9→10) further down at
  // [10,11)→"10". Net delta before a caret past both is 0, but a caret between
  // them sees only the first.
  const edits = [
    { oldStart: 0, oldEnd: 2, newText: '9' },
    { oldStart: 10, oldEnd: 11, newText: '10' },
  ]

  it('F1/F3 — positional accumulation, not a global delta', () => {
    expect(remapOffset(20, edits)).toBe(20) // past both: -1 + +1 = 0
    expect(remapOffset(6, edits)).toBe(5) // between: only the first shrink (-1)
    expect(remapOffset(0, edits)).toBe(0) // before all: unmoved
  })

  it('F2 — caret inside a shrinking number clamps into the new span', () => {
    // caret between the digits of "10" (col 1) → clamp to min(1, len "9"=1) = end of "9"
    expect(remapOffset(1, [{ oldStart: 0, oldEnd: 2, newText: '9' }])).toBe(1)
  })

  it('F6 — boundary ties: caret at oldStart pins to front, at oldEnd counts as before', () => {
    const shrink = [{ oldStart: 5, oldEnd: 7, newText: '9' }] // "10" -> "9"
    expect(remapOffset(5, shrink)).toBe(5) // at oldStart → break, no shift
    expect(remapOffset(7, shrink)).toBe(6) // at oldEnd → before, shift -1
  })
})

describe('renumberOrderedListSegments', () => {
  it('rewrites the digit runs and reports edits, leaving the same ref when unchanged', () => {
    const unchanged = renumberOrderedListSegments(text('1. a\n2. b'))
    expect(unchanged.edits).toHaveLength(0)

    const changed = renumberOrderedListSegments(text('1. a\n1. b'))
    expect(changed.segments).toEqual(text('1. a\n2. b'))
    expect(changed.edits).toHaveLength(1)
  })
})

describe('hasOrderedListRun — paste renumber gate', () => {
  it('true for a copied fragment already sequential (3,4,5)', () => {
    expect(hasOrderedListRun('3. a\n4. b\n5. c')).toBe(true)
  })

  it('true for a broken list that starts at 1 (1,1,1 / 1,2,4)', () => {
    expect(hasOrderedListRun('1. a\n1. b\n1. c')).toBe(true)
    expect(hasOrderedListRun('1. a\n2. b\n4. d')).toBe(true)
  })

  it('false for non-sequential numeric prose not starting at 1 (years)', () => {
    expect(hasOrderedListRun('1985. Born\n2020. Died')).toBe(false)
  })

  it('false for a non-sequential reference list not starting at 1 (5,10,15)', () => {
    expect(hasOrderedListRun('5. Foo\n10. Bar\n15. Baz')).toBe(false)
  })

  it('false for a single isolated numbered line', () => {
    expect(hasOrderedListRun('42. The answer')).toBe(false)
  })

  it('false for plain text with no numbered lines', () => {
    expect(hasOrderedListRun('hello\nworld')).toBe(false)
  })

  it('a plain line between numbers breaks the run', () => {
    expect(hasOrderedListRun('3. a\nplain\n4. b')).toBe(false)
  })
})

describe('indentListItem — capped one level deeper', () => {
  it('indents a sibling under the item above', () => {
    const input = text('1. a\n2. b')
    const cursor = 8 // inside "2. b"
    const result = indentListItem(input, cursor)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual(text('1. a\n  2. b'))
  })

  it('no-ops on the first item of a list (nothing to nest under)', () => {
    expect(indentListItem(text('1. a\n2. b'), 2)).toBeNull()
  })

  it('no-ops when already one level deeper than the parent', () => {
    // second line is the only child under the parent; cannot go deeper
    expect(indentListItem(text('1. a\n  2. b'), 9)).toBeNull()
  })

  it('after indent, renumber restarts the sublist at 1', () => {
    const indented = indentListItem(text('1. a\n2. b'), 8)!
    const renum = renumberOrderedListSegments(indented.segments)
    expect(renum.segments).toEqual(text('1. a\n  1. b'))
  })
})

describe('outdentListItem', () => {
  it('removes one indent level', () => {
    const result = outdentListItem(text('1. a\n  2. b'), 10)
    expect(result!.segments).toEqual(text('1. a\n2. b'))
  })
})

describe('insertListContinuation — Enter on empty item', () => {
  it('outdents one level on an empty nested item instead of exiting', () => {
    const input = text('1. a\n  2. ')
    const cursor = 10 // end, after the empty nested prefix
    const result = insertListContinuation(input, cursor)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual(text('1. a\n2. '))
  })

  it('exits the list on an empty top-level item', () => {
    const input = text('1. ')
    const result = insertListContinuation(input, 3)
    expect(result!.segments).toEqual([]) // prefix removed → empty content
  })

  it('continues the list with the next number on a non-empty item', () => {
    const result = insertListContinuation(text('1. a'), 4)
    expect(result!.segments).toEqual(text('1. a\n2. '))
  })
})

describe('getListContext (unchanged behavior after classifier refactor)', () => {
  it('detects a numbered item', () => {
    const ctx = getListContext('1. a', 4)
    expect(ctx?.listType).toBe('numbered')
    expect(ctx?.number).toBe(1)
  })

  it('detects an indented bullet', () => {
    const ctx = getListContext('  • a', 5)
    expect(ctx?.listType).toBe('bullet')
    expect(ctx?.indent).toBe(1)
    expect(ctx?.marker).toBe('•')
  })
})

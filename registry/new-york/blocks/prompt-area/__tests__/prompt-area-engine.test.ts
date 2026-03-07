import { describe, it, expect } from 'vitest'
import type { Segment, TriggerConfig, ActiveTrigger, ChipSegment } from '../types'
import {
  segmentsToPlainText,
  plainTextToSegments,
  detectActiveTrigger,
  resolveChip,
  removeChipAtIndex,
  revertChipAtIndex,
  resolveTriggersInSegments,
  replaceTextRange,
  getListContext,
  autoFormatListPrefix,
  insertListContinuation,
  indentListItem,
  outdentListItem,
  removeListPrefix,
  isValidTriggerPosition,
  parseInlineMarkdown,
  toggleMarkdownWrap,
  segmentsEqual,
} from '../prompt-area-engine'

// ---------------------------------------------------------------------------
// Test trigger configs
// ---------------------------------------------------------------------------

const slashTrigger: TriggerConfig = {
  char: '/',
  position: 'start',
  mode: 'dropdown',
}

const mentionTrigger: TriggerConfig = {
  char: '@',
  position: 'any',
  mode: 'dropdown',
}

const hashTrigger: TriggerConfig = {
  char: '#',
  position: 'any',
  mode: 'dropdown',
}

const triggers = [slashTrigger, mentionTrigger, hashTrigger]

// ===========================================================================
// segmentsToPlainText
// ===========================================================================

describe('segmentsToPlainText', () => {
  it('converts a single text segment to plain text', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    expect(segmentsToPlainText(segments)).toBe('hello world')
  })

  it('converts multiple text segments to plain text', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'text', text: 'world' },
    ]
    expect(segmentsToPlainText(segments)).toBe('hello world')
  })

  it('converts chip segments using displayText', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' how are you?' },
    ]
    expect(segmentsToPlainText(segments)).toBe('hello @Alice how are you?')
  })

  it('handles multiple chips', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' and ' },
      { type: 'chip', trigger: '@', value: 'user-2', displayText: 'Bob' },
    ]
    expect(segmentsToPlainText(segments)).toBe('@Alice and @Bob')
  })

  it('returns empty string for empty segments', () => {
    expect(segmentsToPlainText([])).toBe('')
  })

  it('handles chip with hash trigger', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'Check ' },
      { type: 'chip', trigger: '#', value: 'doc-1', displayText: 'readme' },
    ]
    expect(segmentsToPlainText(segments)).toBe('Check #readme')
  })

  it('handles chip with slash trigger', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '/', value: 'cmd-1', displayText: 'summarize' },
      { type: 'text', text: ' the document' },
    ]
    expect(segmentsToPlainText(segments)).toBe('/summarize the document')
  })
})

// ===========================================================================
// plainTextToSegments
// ===========================================================================

describe('plainTextToSegments', () => {
  it('wraps plain text in a single text segment', () => {
    expect(plainTextToSegments('hello')).toEqual([{ type: 'text', text: 'hello' }])
  })

  it('returns empty array for empty string', () => {
    expect(plainTextToSegments('')).toEqual([])
  })

  it('preserves whitespace', () => {
    expect(plainTextToSegments('  hello  ')).toEqual([{ type: 'text', text: '  hello  ' }])
  })

  it('preserves newlines', () => {
    expect(plainTextToSegments('line1\nline2')).toEqual([{ type: 'text', text: 'line1\nline2' }])
  })
})

// ===========================================================================
// isValidTriggerPosition
// ===========================================================================

describe('isValidTriggerPosition', () => {
  describe('position: "start"', () => {
    it('is valid at position 0', () => {
      expect(isValidTriggerPosition('/', 0, 'start')).toBe(true)
    })

    it('is valid after a newline', () => {
      expect(isValidTriggerPosition('hello\n/', 6, 'start')).toBe(true)
    })

    it('is invalid in the middle of text', () => {
      expect(isValidTriggerPosition('hello /', 6, 'start')).toBe(false)
    })

    it('is invalid after other characters', () => {
      expect(isValidTriggerPosition('a/', 1, 'start')).toBe(false)
    })
  })

  describe('position: "any"', () => {
    it('is valid at position 0', () => {
      expect(isValidTriggerPosition('@', 0, 'any')).toBe(true)
    })

    it('is valid after a space', () => {
      expect(isValidTriggerPosition('hello @', 6, 'any')).toBe(true)
    })

    it('is valid after a newline', () => {
      expect(isValidTriggerPosition('hello\n@', 6, 'any')).toBe(true)
    })

    it('is invalid in the middle of a word', () => {
      expect(isValidTriggerPosition('email@', 5, 'any')).toBe(false)
    })

    it('is valid after a tab', () => {
      expect(isValidTriggerPosition('hello\t@', 6, 'any')).toBe(true)
    })
  })
})

// ===========================================================================
// detectActiveTrigger
// ===========================================================================

describe('detectActiveTrigger', () => {
  it('detects a slash trigger at the start of input', () => {
    const result = detectActiveTrigger('/sum', 4, triggers)
    expect(result).toEqual({
      config: slashTrigger,
      startOffset: 0,
      query: 'sum',
    })
  })

  it('detects an @ trigger after a space', () => {
    const result = detectActiveTrigger('hello @ali', 10, triggers)
    expect(result).toEqual({
      config: mentionTrigger,
      startOffset: 6,
      query: 'ali',
    })
  })

  it('detects a # trigger after a space', () => {
    const result = detectActiveTrigger('check #rea', 10, triggers)
    expect(result).toEqual({
      config: hashTrigger,
      startOffset: 6,
      query: 'rea',
    })
  })

  it('returns null when no trigger is detected', () => {
    const result = detectActiveTrigger('hello world', 11, triggers)
    expect(result).toBeNull()
  })

  it('does not detect slash trigger mid-text', () => {
    const result = detectActiveTrigger('path/to/file', 12, triggers)
    expect(result).toBeNull()
  })

  it('does not detect @ trigger when part of email-like text', () => {
    const result = detectActiveTrigger('user@domain', 11, triggers)
    expect(result).toBeNull()
  })

  it('detects trigger with empty query (just the trigger char)', () => {
    const result = detectActiveTrigger('hello @', 7, triggers)
    expect(result).toEqual({
      config: mentionTrigger,
      startOffset: 6,
      query: '',
    })
  })

  it('detects slash trigger after a newline', () => {
    const result = detectActiveTrigger('hello\n/sum', 10, triggers)
    expect(result).toEqual({
      config: slashTrigger,
      startOffset: 6,
      query: 'sum',
    })
  })

  it('detects the nearest trigger when multiple could match', () => {
    const result = detectActiveTrigger('@alice @bob', 11, triggers)
    expect(result).toEqual({
      config: mentionTrigger,
      startOffset: 7,
      query: 'bob',
    })
  })

  it('returns null when cursor is before the trigger', () => {
    const result = detectActiveTrigger('hello @alice', 5, triggers)
    expect(result).toBeNull()
  })

  it('stops searching at whitespace (trigger word ended)', () => {
    const result = detectActiveTrigger('hello @alice is here', 20, triggers)
    expect(result).toBeNull()
  })

  it('returns null with empty text', () => {
    expect(detectActiveTrigger('', 0, triggers)).toBeNull()
  })

  it('returns null with no triggers configured', () => {
    expect(detectActiveTrigger('/hello', 6, [])).toBeNull()
  })
})

// ===========================================================================
// resolveChip
// ===========================================================================

describe('resolveChip', () => {
  it('replaces the trigger text with a chip and trailing space', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello @alice' }]
    const activeTrigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 6,
      query: 'alice',
    }
    const result = resolveChip(segments, activeTrigger, {
      value: 'user-1',
      displayText: 'Alice',
    })

    expect(result.segments).toEqual([
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' ' },
    ])
  })

  it('replaces trigger at the start of text', () => {
    const segments: Segment[] = [{ type: 'text', text: '/summarize' }]
    const activeTrigger: ActiveTrigger = {
      config: slashTrigger,
      startOffset: 0,
      query: 'summarize',
    }
    const result = resolveChip(segments, activeTrigger, {
      value: 'cmd-1',
      displayText: 'summarize',
    })

    expect(result.segments).toEqual([
      { type: 'chip', trigger: '/', value: 'cmd-1', displayText: 'summarize' },
      { type: 'text', text: ' ' },
    ])
  })

  it('preserves text after the trigger', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hey @alice how are you' }]
    const activeTrigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 4,
      query: 'alice',
    }
    const result = resolveChip(segments, activeTrigger, {
      value: 'user-1',
      displayText: 'Alice',
    })

    expect(result.segments).toEqual([
      { type: 'text', text: 'hey ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' how are you' },
    ])
  })

  it('handles resolve when trigger is in a segment after chips', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' and @bob' },
    ]
    const activeTrigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 5, // relative to the text segment's contribution to plain text
      query: 'bob',
    }

    // The plain text is "@Alice and @bob" - the trigger starts at offset 11
    // We need to reconsider - the activeTrigger.startOffset is relative to
    // the full plain text view
    const correctedTrigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 11,
      query: 'bob',
    }
    const result = resolveChip(segments, correctedTrigger, {
      value: 'user-2',
      displayText: 'Bob',
    })

    expect(result.segments).toEqual([
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' and ' },
      { type: 'chip', trigger: '@', value: 'user-2', displayText: 'Bob' },
      { type: 'text', text: ' ' },
    ])
  })

  it('attaches data to the resolved chip', () => {
    const segments: Segment[] = [{ type: 'text', text: '@alice' }]
    const activeTrigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 0,
      query: 'alice',
    }
    const result = resolveChip(segments, activeTrigger, {
      value: 'user-1',
      displayText: 'Alice',
      data: { role: 'admin' },
    })

    expect(result.segments[0]).toEqual({
      type: 'chip',
      trigger: '@',
      value: 'user-1',
      displayText: 'Alice',
      data: { role: 'admin' },
    })
  })
})

// ===========================================================================
// removeChipAtIndex
// ===========================================================================

describe('removeChipAtIndex', () => {
  it('removes a chip by segment index', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' world' },
    ]
    const result = removeChipAtIndex(segments, 1)
    expect(result).toEqual([{ type: 'text', text: 'hello  world' }])
  })

  it('removes a chip at the start', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '/', value: 'cmd-1', displayText: 'summarize' },
      { type: 'text', text: ' the doc' },
    ]
    const result = removeChipAtIndex(segments, 0)
    expect(result).toEqual([{ type: 'text', text: ' the doc' }])
  })

  it('removes a chip at the end', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'with ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
    ]
    const result = removeChipAtIndex(segments, 1)
    expect(result).toEqual([{ type: 'text', text: 'with ' }])
  })

  it('merges adjacent text segments after removal', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'a' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: 'b' },
    ]
    const result = removeChipAtIndex(segments, 1)
    // Adjacent text segments should be merged into one
    expect(result).toEqual([{ type: 'text', text: 'ab' }])
  })

  it('returns original segments if index is out of bounds', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(removeChipAtIndex(segments, 5)).toEqual(segments)
  })

  it('returns original segments if index is a text segment', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
    ]
    expect(removeChipAtIndex(segments, 0)).toEqual(segments)
  })
})

// ===========================================================================
// parseInlineMarkdown
// ===========================================================================

describe('parseInlineMarkdown', () => {
  it('detects bold text with **', () => {
    const result = parseInlineMarkdown('hello **world** end')
    expect(result).toEqual([
      { type: 'plain', text: 'hello ' },
      { type: 'bold', text: 'world' },
      { type: 'plain', text: ' end' },
    ])
  })

  it('detects italic text with *', () => {
    const result = parseInlineMarkdown('hello *world* end')
    expect(result).toEqual([
      { type: 'plain', text: 'hello ' },
      { type: 'italic', text: 'world' },
      { type: 'plain', text: ' end' },
    ])
  })

  it('detects URLs', () => {
    const result = parseInlineMarkdown('visit https://example.com today')
    expect(result).toEqual([
      { type: 'plain', text: 'visit ' },
      { type: 'url', text: 'https://example.com' },
      { type: 'plain', text: ' today' },
    ])
  })

  it('detects http URLs', () => {
    const result = parseInlineMarkdown('go to http://example.com/path')
    expect(result).toEqual([
      { type: 'plain', text: 'go to ' },
      { type: 'url', text: 'http://example.com/path' },
    ])
  })

  it('returns plain text when no markdown', () => {
    const result = parseInlineMarkdown('hello world')
    expect(result).toEqual([{ type: 'plain', text: 'hello world' }])
  })

  it('handles multiple markdown elements', () => {
    const result = parseInlineMarkdown('**bold** and *italic*')
    expect(result).toEqual([
      { type: 'bold', text: 'bold' },
      { type: 'plain', text: ' and ' },
      { type: 'italic', text: 'italic' },
    ])
  })

  it('returns empty array for empty string', () => {
    expect(parseInlineMarkdown('')).toEqual([])
  })

  it('handles bold and italic together', () => {
    const result = parseInlineMarkdown('***both***')
    // Bold wraps italic: **<em>both</em>** → detect as bold containing italic
    // For simplicity, treat *** as bold+italic combined
    expect(result).toEqual([{ type: 'bold-italic', text: 'both' }])
  })
})

// ===========================================================================
// resolveChip with autoResolved
// ===========================================================================

describe('resolveChip with autoResolved', () => {
  it('marks the chip as auto-resolved when flag is true', () => {
    const segments: Segment[] = [{ type: 'text', text: '#readme' }]
    const trigger: ActiveTrigger = {
      config: hashTrigger,
      startOffset: 0,
      query: 'readme',
    }
    const result = resolveChip(segments, trigger, {
      value: 'readme',
      displayText: 'readme',
      autoResolved: true,
    })

    const chip = result.segments.find((s): s is ChipSegment => s.type === 'chip')
    expect(chip).toBeDefined()
    expect(chip?.autoResolved).toBe(true)
  })

  it('does not set autoResolved when flag is absent', () => {
    const segments: Segment[] = [{ type: 'text', text: '#readme' }]
    const trigger: ActiveTrigger = {
      config: hashTrigger,
      startOffset: 0,
      query: 'readme',
    }
    const result = resolveChip(segments, trigger, {
      value: 'readme',
      displayText: 'readme',
    })

    const chip = result.segments.find((s): s is ChipSegment => s.type === 'chip')
    expect(chip).toBeDefined()
    expect(chip?.autoResolved).toBeUndefined()
  })
})

// ===========================================================================
// revertChipAtIndex
// ===========================================================================

describe('revertChipAtIndex', () => {
  it('reverts an auto-resolved chip to plain text', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
      { type: 'text', text: ' world' },
    ]
    const result = revertChipAtIndex(segments, 1)

    expect(result).not.toBeNull()
    expect(result!.revertedText).toBe('#readme')
    expect(result!.segments).toEqual([{ type: 'text', text: 'hello #readme world' }])
  })

  it('returns null for non-auto-resolved chip', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
    ]
    expect(revertChipAtIndex(segments, 0)).toBeNull()
  })

  it('returns null for text segment', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(revertChipAtIndex(segments, 0)).toBeNull()
  })

  it('returns null for out-of-bounds index', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(revertChipAtIndex(segments, -1)).toBeNull()
    expect(revertChipAtIndex(segments, 5)).toBeNull()
  })

  it('reverts chip at the start of segments', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '#', value: 'tag', displayText: 'tag', autoResolved: true },
      { type: 'text', text: ' rest' },
    ]
    const result = revertChipAtIndex(segments, 0)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: '#tag rest' }])
    expect(result!.revertedText).toBe('#tag')
  })

  it('reverts chip at the end of segments', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'before ' },
      { type: 'chip', trigger: '#', value: 'end', displayText: 'end', autoResolved: true },
    ]
    const result = revertChipAtIndex(segments, 1)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: 'before #end' }])
  })

  it('merges adjacent text segments after revert', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'a' },
      { type: 'chip', trigger: '#', value: 'b', displayText: 'b', autoResolved: true },
      { type: 'text', text: 'c' },
    ]
    const result = revertChipAtIndex(segments, 1)
    expect(result!.segments).toEqual([{ type: 'text', text: 'a#bc' }])
  })

  it('handles standalone auto-resolved chip', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '#', value: 'only', displayText: 'only', autoResolved: true },
    ]
    const result = revertChipAtIndex(segments, 0)
    expect(result!.segments).toEqual([{ type: 'text', text: '#only' }])
    expect(result!.revertedText).toBe('#only')
  })
})

// ===========================================================================
// resolveTriggersInSegments
// ===========================================================================

const hashTriggerWithResolve: TriggerConfig = {
  char: '#',
  position: 'any',
  mode: 'dropdown',
  resolveOnSpace: true,
}

const mentionTriggerNoResolve: TriggerConfig = {
  char: '@',
  position: 'any',
  mode: 'dropdown',
}

describe('resolveTriggersInSegments', () => {
  it('resolves a single trigger pattern into a chip', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello #readme world' }]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])

    expect(result).toEqual([
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
      { type: 'text', text: ' world' },
    ])
  })

  it('resolves multiple trigger patterns', () => {
    const segments: Segment[] = [{ type: 'text', text: '#readme and #faq' }]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])

    expect(result).toEqual([
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
      { type: 'text', text: ' and ' },
      { type: 'chip', trigger: '#', value: 'faq', displayText: 'faq', autoResolved: true },
    ])
  })

  it('does not resolve triggers without resolveOnSpace', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello @alice' }]
    const result = resolveTriggersInSegments(segments, [mentionTriggerNoResolve])

    expect(result).toEqual(segments) // Unchanged
  })

  it('does not resolve email-like patterns', () => {
    const segments: Segment[] = [{ type: 'text', text: 'user@example.com' }]
    const result = resolveTriggersInSegments(segments, [
      { ...mentionTriggerNoResolve, resolveOnSpace: true },
    ])

    // @ is not at a word boundary, so it should not resolve
    expect(result).toEqual(segments)
  })

  it('resolves trigger at start of text', () => {
    const segments: Segment[] = [{ type: 'text', text: '#readme rest' }]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])

    expect(result).toEqual([
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
      { type: 'text', text: ' rest' },
    ])
  })

  it('preserves existing chip segments', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' check #readme' },
    ]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])

    expect(result).toEqual([
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' check ' },
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
    ])
  })

  it('returns original segments when no matches', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])
    expect(result).toEqual(segments)
  })

  it('returns original segments when no resolveOnSpace triggers', () => {
    const segments: Segment[] = [{ type: 'text', text: '#readme' }]
    const result = resolveTriggersInSegments(segments, [hashTrigger]) // hashTrigger has no resolveOnSpace
    expect(result).toEqual(segments)
  })

  it('handles trigger after newline', () => {
    const segments: Segment[] = [{ type: 'text', text: 'line1\n#readme' }]
    const result = resolveTriggersInSegments(segments, [hashTriggerWithResolve])

    expect(result).toEqual([
      { type: 'text', text: 'line1\n' },
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
    ])
  })
})

// ===========================================================================
// replaceTextRange
// ===========================================================================

describe('replaceTextRange', () => {
  it('replaces text within a single segment', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    const result = replaceTextRange(segments, 6, 11, 'earth')
    expect(result).toEqual([{ type: 'text', text: 'hello earth' }])
  })

  it('replaces at the start of text', () => {
    const segments: Segment[] = [{ type: 'text', text: '- item' }]
    const result = replaceTextRange(segments, 0, 2, '\u25CF ')
    expect(result).toEqual([{ type: 'text', text: '\u25CF item' }])
  })

  it('inserts text at a position (empty range)', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    const result = replaceTextRange(segments, 5, 5, '\n\u25CF ')
    expect(result).toEqual([{ type: 'text', text: 'hello\n\u25CF ' }])
  })

  it('preserves chip segments', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' - item' },
    ]
    // Plain text: "@Alice - item", range is 7..9 (the "- ")
    const result = replaceTextRange(segments, 7, 9, '\u25CF ')
    expect(result).toEqual([
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' \u25CF item' },
    ])
  })
})

// ===========================================================================
// getListContext
// ===========================================================================

describe('getListContext', () => {
  it('detects bullet line with ●', () => {
    const result = getListContext('\u25CF item', 7)
    expect(result).not.toBeNull()
    expect(result!.listType).toBe('bullet')
    expect(result!.indent).toBe(0)
    expect(result!.prefix).toBe('\u25CF ')
    expect(result!.contentStart).toBe(2)
  })

  it('detects bullet line with dash', () => {
    const result = getListContext('- item', 6)
    expect(result).not.toBeNull()
    expect(result!.listType).toBe('bullet')
  })

  it('detects indented bullet', () => {
    const result = getListContext('  \u25CF nested', 10)
    expect(result).not.toBeNull()
    expect(result!.indent).toBe(1)
    expect(result!.prefix).toBe('  \u25CF ')
  })

  it('detects numbered list', () => {
    const result = getListContext('1. first', 8)
    expect(result).not.toBeNull()
    expect(result!.listType).toBe('numbered')
    expect(result!.number).toBe(1)
    expect(result!.prefix).toBe('1. ')
  })

  it('detects multi-digit numbered list', () => {
    const result = getListContext('12. twelfth', 11)
    expect(result).not.toBeNull()
    expect(result!.number).toBe(12)
  })

  it('detects indented numbered list', () => {
    const result = getListContext('  2. second', 11)
    expect(result).not.toBeNull()
    expect(result!.indent).toBe(1)
    expect(result!.number).toBe(2)
  })

  it('returns null for plain text', () => {
    expect(getListContext('hello world', 11)).toBeNull()
  })

  it('returns null for empty text', () => {
    expect(getListContext('', 0)).toBeNull()
  })

  it('detects list context on a specific line in multi-line text', () => {
    const text = 'header\n\u25CF item1\n\u25CF item2'
    const result = getListContext(text, text.length)
    expect(result).not.toBeNull()
    expect(result!.listType).toBe('bullet')
    expect(result!.lineStart).toBe(text.lastIndexOf('\n') + 1)
  })
})

// ===========================================================================
// autoFormatListPrefix
// ===========================================================================

describe('autoFormatListPrefix', () => {
  it('converts "- " to "● "', () => {
    const segments: Segment[] = [{ type: 'text', text: '- ' }]
    const result = autoFormatListPrefix(segments, 2)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: '\u25CF ' }])
    expect(result!.cursorOffset).toBe(2)
  })

  it('converts "* " to "● "', () => {
    const segments: Segment[] = [{ type: 'text', text: '* ' }]
    const result = autoFormatListPrefix(segments, 2)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: '\u25CF ' }])
  })

  it('converts indented "  - " to "  ● "', () => {
    const segments: Segment[] = [{ type: 'text', text: '  - ' }]
    const result = autoFormatListPrefix(segments, 4)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: '  \u25CF ' }])
    expect(result!.cursorOffset).toBe(4)
  })

  it('returns null for non-list text', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(autoFormatListPrefix(segments, 5)).toBeNull()
  })

  it('returns null for "- x" (content after marker)', () => {
    const segments: Segment[] = [{ type: 'text', text: '- x' }]
    expect(autoFormatListPrefix(segments, 3)).toBeNull()
  })

  it('converts "- " on a new line', () => {
    const segments: Segment[] = [{ type: 'text', text: 'line1\n- ' }]
    const result = autoFormatListPrefix(segments, 8)
    expect(result).not.toBeNull()
    expect(result!.segments).toEqual([{ type: 'text', text: 'line1\n\u25CF ' }])
  })
})

// ===========================================================================
// insertListContinuation
// ===========================================================================

describe('insertListContinuation', () => {
  it('continues a bullet list on Enter', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item1' }]
    const result = insertListContinuation(segments, 7)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('\u25CF item1\n\u25CF ')
  })

  it('continues a numbered list with incremented number', () => {
    const segments: Segment[] = [{ type: 'text', text: '1. first' }]
    const result = insertListContinuation(segments, 8)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('1. first\n2. ')
  })

  it('exits list mode when content is empty (just prefix)', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item1\n\u25CF ' }]
    const result = insertListContinuation(segments, 10)
    expect(result).not.toBeNull()
    // The empty bullet line should be removed
    expect(segmentsToPlainText(result!.segments)).toBe('\u25CF item1\n')
  })

  it('returns null for non-list line', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(insertListContinuation(segments, 5)).toBeNull()
  })

  it('preserves indentation level', () => {
    const segments: Segment[] = [{ type: 'text', text: '  \u25CF nested' }]
    const result = insertListContinuation(segments, 10)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('  \u25CF nested\n  \u25CF ')
  })
})

// ===========================================================================
// indentListItem / outdentListItem
// ===========================================================================

describe('indentListItem', () => {
  it('indents a bullet item by 2 spaces', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item' }]
    const result = indentListItem(segments, 6)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('  \u25CF item')
    expect(result!.cursorOffset).toBe(8) // original 6 + 2
  })

  it('returns null for non-list line', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(indentListItem(segments, 5)).toBeNull()
  })
})

describe('outdentListItem', () => {
  it('outdents a bullet item by 2 spaces', () => {
    const segments: Segment[] = [{ type: 'text', text: '  \u25CF item' }]
    const result = outdentListItem(segments, 8)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('\u25CF item')
    expect(result!.cursorOffset).toBe(6) // original 8 - 2
  })

  it('returns null for already at indent 0', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item' }]
    expect(outdentListItem(segments, 6)).toBeNull()
  })

  it('returns null for non-list line', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(outdentListItem(segments, 5)).toBeNull()
  })
})

// ===========================================================================
// removeListPrefix
// ===========================================================================

describe('removeListPrefix', () => {
  it('removes bullet prefix when cursor is at content start', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item' }]
    const result = removeListPrefix(segments, 2)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('item')
    expect(result!.cursorOffset).toBe(0)
  })

  it('removes numbered prefix', () => {
    const segments: Segment[] = [{ type: 'text', text: '1. item' }]
    const result = removeListPrefix(segments, 3)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('item')
  })

  it('returns null when cursor is in content (past prefix)', () => {
    const segments: Segment[] = [{ type: 'text', text: '\u25CF item' }]
    expect(removeListPrefix(segments, 5)).toBeNull()
  })

  it('returns null for non-list line', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(removeListPrefix(segments, 0)).toBeNull()
  })

  it('preserves indentation in cursor offset', () => {
    const segments: Segment[] = [{ type: 'text', text: '  \u25CF item' }]
    const result = removeListPrefix(segments, 4)
    expect(result).not.toBeNull()
    expect(segmentsToPlainText(result!.segments)).toBe('  item')
    expect(result!.cursorOffset).toBe(2) // indent * 2
  })
})

// ---------------------------------------------------------------------------
// toggleMarkdownWrap
// ---------------------------------------------------------------------------

describe('toggleMarkdownWrap', () => {
  describe('bold (**)', () => {
    it('wraps selected text in bold markers', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
      const result = toggleMarkdownWrap(segments, 6, 11, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('hello **world**')
      expect(result!.selectionStart).toBe(8)
      expect(result!.selectionEnd).toBe(13)
    })

    it('unwraps already-bolded text', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello **world**' }]
      // Selection is inside the markers: "world" at 8..13
      const result = toggleMarkdownWrap(segments, 8, 13, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('hello world')
      expect(result!.selectionStart).toBe(6)
      expect(result!.selectionEnd).toBe(11)
    })

    it('wraps text at the start of content', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
      const result = toggleMarkdownWrap(segments, 0, 5, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('**hello** world')
    })

    it('wraps text at the end of content', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
      const result = toggleMarkdownWrap(segments, 6, 11, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('hello **world**')
    })

    it('wraps entire content', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello' }]
      const result = toggleMarkdownWrap(segments, 0, 5, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('**hello**')
      expect(result!.selectionStart).toBe(2)
      expect(result!.selectionEnd).toBe(7)
    })

    it('wraps text spanning chip segments', () => {
      const segments: Segment[] = [
        { type: 'text', text: 'hello ' },
        { type: 'chip', trigger: '@', value: 'u1', displayText: 'Alice' },
        { type: 'text', text: ' world' },
      ]
      // Plain text: "hello @Alice world" (18 chars), select all
      const result = toggleMarkdownWrap(segments, 0, 18, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('**hello @Alice world**')
    })
  })

  describe('italic (*)', () => {
    it('wraps selected text in italic markers', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
      const result = toggleMarkdownWrap(segments, 6, 11, '*')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('hello *world*')
      expect(result!.selectionStart).toBe(7)
      expect(result!.selectionEnd).toBe(12)
    })

    it('unwraps already-italicized text', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello *world*' }]
      const result = toggleMarkdownWrap(segments, 7, 12, '*')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('hello world')
      expect(result!.selectionStart).toBe(6)
      expect(result!.selectionEnd).toBe(11)
    })

    it('does not falsely match italic inside bold markers', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello **world**' }]
      // Select "world" at 8..13 — the surrounding * are part of **
      const result = toggleMarkdownWrap(segments, 8, 13, '*')
      expect(result).not.toBeNull()
      // Should WRAP (not unwrap) since the * is part of ** not standalone *
      expect(segmentsToPlainText(result!.segments)).toBe('hello ***world***')
    })
  })

  describe('edge cases', () => {
    it('returns null for collapsed selection', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
      expect(toggleMarkdownWrap(segments, 5, 5, '**')).toBeNull()
    })

    it('wraps within a multi-segment text', () => {
      const segments: Segment[] = [
        { type: 'text', text: 'aaa ' },
        { type: 'text', text: 'bbb ccc' },
      ]
      // Plain text: "aaa bbb ccc", select "bbb" (4..7)
      const result = toggleMarkdownWrap(segments, 4, 7, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('aaa **bbb** ccc')
    })

    it('handles wrap at start when markers cannot be present', () => {
      const segments: Segment[] = [{ type: 'text', text: 'ab' }]
      // Selection: 0..2, marker **, not enough preceding chars for unwrap check
      const result = toggleMarkdownWrap(segments, 0, 2, '**')
      expect(result).not.toBeNull()
      expect(segmentsToPlainText(result!.segments)).toBe('**ab**')
    })
  })
})

// ===========================================================================
// segmentsEqual
// ===========================================================================

describe('segmentsEqual', () => {
  it('returns true for identical references', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(segmentsEqual(segments, segments)).toBe(true)
  })

  it('returns true for empty arrays', () => {
    expect(segmentsEqual([], [])).toBe(true)
  })

  it('returns true for equal text segments', () => {
    const a: Segment[] = [{ type: 'text', text: 'hello world' }]
    const b: Segment[] = [{ type: 'text', text: 'hello world' }]
    expect(segmentsEqual(a, b)).toBe(true)
  })

  it('returns false for different text content', () => {
    const a: Segment[] = [{ type: 'text', text: 'hello' }]
    const b: Segment[] = [{ type: 'text', text: 'world' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns false for different lengths', () => {
    const a: Segment[] = [{ type: 'text', text: 'hello' }]
    const b: Segment[] = [
      { type: 'text', text: 'hello' },
      { type: 'text', text: ' world' },
    ]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns true for equal chip segments', () => {
    const a: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    const b: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    expect(segmentsEqual(a, b)).toBe(true)
  })

  it('returns false when chip trigger differs', () => {
    const a: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    const b: Segment[] = [{ type: 'chip', trigger: '#', value: 'user-1', displayText: 'Alice' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns false when chip value differs', () => {
    const a: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    const b: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-2', displayText: 'Alice' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns false when chip displayText differs', () => {
    const a: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    const b: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Bob' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns false when chip autoResolved differs', () => {
    const a: Segment[] = [
      { type: 'chip', trigger: '#', value: 'readme', displayText: 'readme', autoResolved: true },
    ]
    const b: Segment[] = [{ type: 'chip', trigger: '#', value: 'readme', displayText: 'readme' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns false when types differ at same index', () => {
    const a: Segment[] = [{ type: 'text', text: '@Alice' }]
    const b: Segment[] = [{ type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' }]
    expect(segmentsEqual(a, b)).toBe(false)
  })

  it('returns true for mixed text and chip segments', () => {
    const a: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' world' },
    ]
    const b: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' world' },
    ]
    expect(segmentsEqual(a, b)).toBe(true)
  })

  it('ignores chip data field (only compares structural fields)', () => {
    const a: Segment[] = [
      {
        type: 'chip',
        trigger: '@',
        value: 'user-1',
        displayText: 'Alice',
        data: { role: 'admin' },
      },
    ]
    const b: Segment[] = [
      {
        type: 'chip',
        trigger: '@',
        value: 'user-1',
        displayText: 'Alice',
        data: { role: 'member' },
      },
    ]
    // segmentsEqual does not compare data field — only trigger, value, displayText, autoResolved
    expect(segmentsEqual(a, b)).toBe(true)
  })
})

// ===========================================================================
// replaceTextRange — additional edge cases for bug fix patterns
// ===========================================================================

describe('replaceTextRange (selection delete and newline patterns)', () => {
  it('deletes entire content (select-all + delete)', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    const result = replaceTextRange(segments, 0, 11, '')
    expect(result).toEqual([])
  })

  it('deletes selection spanning a URL-containing text', () => {
    const segments: Segment[] = [{ type: 'text', text: 'visit https://example.com today' }]
    // "visit https://example.com today" is 31 chars
    const result = replaceTextRange(segments, 0, 31, '')
    expect(result).toEqual([])
  })

  it('deletes selection that includes a chip', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hello ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' world' },
    ]
    // Plain text: "hello @Alice world" (18 chars), delete all
    const result = replaceTextRange(segments, 0, 18, '')
    expect(result).toEqual([])
  })

  it('deletes partial selection around a chip', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'before ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' after' },
    ]
    // Plain text: "before @Alice after" (19 chars), delete "@Alice " (7..13)
    // Chip is at offset 7..13, text " after" starts at 13
    const result = replaceTextRange(segments, 7, 14, '')
    expect(result).toEqual([{ type: 'text', text: 'before after' }])
  })

  it('inserts newline at cursor position (Shift+Enter)', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    const result = replaceTextRange(segments, 5, 5, '\n')
    expect(result).toEqual([{ type: 'text', text: 'hello\n world' }])
  })

  it('inserts newline at the end of text', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]
    const result = replaceTextRange(segments, 5, 5, '\n')
    expect(result).toEqual([{ type: 'text', text: 'hello\n' }])
  })

  it('replaces selection with newline (Shift+Enter with selection)', () => {
    const segments: Segment[] = [{ type: 'text', text: 'hello world' }]
    const result = replaceTextRange(segments, 5, 11, '\n')
    expect(result).toEqual([{ type: 'text', text: 'hello\n' }])
  })

  it('inserts newline after a chip', () => {
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' hello' },
    ]
    // Plain text: "@Alice hello", insert \n at offset 6 (right after chip)
    const result = replaceTextRange(segments, 6, 6, '\n')
    expect(result).toEqual([
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: '\n hello' },
    ])
  })

  it('deletes within a multi-segment document preserving untouched segments', () => {
    const segments: Segment[] = [
      { type: 'text', text: '\u25CF item one' },
      { type: 'text', text: '\n\u25CF item two' },
    ]
    // Plain text: "● item one\n● item two" (22 chars)
    // "one" starts at offset 7, "\n● " is offsets 10-13
    // Delete range 7..13 removes "one\n● " → "● item item two"
    const result = replaceTextRange(segments, 7, 13, '')
    expect(segmentsToPlainText(result)).toBe('\u25CF item item two')
  })
})

// ===========================================================================
// resolveChip — cursor calculation with duplicate display text
// ===========================================================================

describe('resolveChip cursor offset', () => {
  it('places cursor after chip + trailing space', () => {
    const segments: Segment[] = [{ type: 'text', text: '@alice' }]
    const trigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 0,
      query: 'alice',
    }
    const result = resolveChip(segments, trigger, {
      value: 'user-1',
      displayText: 'Alice',
    })
    // "@Alice " — cursor after space = 7
    expect(result.cursorOffset).toBe(7)
  })

  it('calculates correct cursor offset with duplicate display text', () => {
    // Two chips both display "Alice", resolve a third "Alice" at the end
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' ' },
      { type: 'chip', trigger: '@', value: 'user-2', displayText: 'Alice' },
      { type: 'text', text: ' @alice' },
    ]
    // Plain text: "@Alice @Alice @alice" (20 chars)
    const trigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 14,
      query: 'alice',
    }
    const result = resolveChip(segments, trigger, {
      value: 'user-3',
      displayText: 'Alice',
    })

    // All three chips have displayText "Alice" — cursor must land after the THIRD one
    // "@Alice" (6) + " " (1) + "@Alice" (6) + " " (1) + "@Alice" (6) + " " (1) = 21
    expect(result.cursorOffset).toBe(21)
  })

  it('places cursor after the second identical chip (not the first)', () => {
    // First "@Alice" chip already exists, now resolving a second identical one
    const segments: Segment[] = [
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Alice' },
      { type: 'text', text: ' @alice' },
    ]
    // Plain text: "@Alice @alice" (13 chars)
    const trigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 7,
      query: 'alice',
    }
    const result = resolveChip(segments, trigger, {
      value: 'user-1',
      displayText: 'Alice',
    })

    // "@Alice" (6) + " " (1) + "@Alice" (6) + " " (1) = 14
    // Cursor must be after the SECOND (newly inserted) chip, not the first
    expect(result.cursorOffset).toBe(14)
  })

  it('calculates correct cursor when resolving after text and chips', () => {
    const segments: Segment[] = [
      { type: 'text', text: 'hey ' },
      { type: 'chip', trigger: '@', value: 'user-1', displayText: 'Bob' },
      { type: 'text', text: ' ping @carol' },
    ]
    // Plain text: "hey @Bob ping @carol" (20 chars)
    const trigger: ActiveTrigger = {
      config: mentionTrigger,
      startOffset: 14,
      query: 'carol',
    }
    const result = resolveChip(segments, trigger, {
      value: 'user-2',
      displayText: 'Carol',
    })

    // "hey " (4) + "@Bob" (4) + " ping " (6) + "@Carol" (6) + " " (1) = 21
    expect(result.cursorOffset).toBe(21)
  })
})

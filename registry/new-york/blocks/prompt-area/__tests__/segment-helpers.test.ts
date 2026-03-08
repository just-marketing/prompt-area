import { describe, it, expect } from 'vitest'
import {
  text,
  chip,
  isSegmentsEmpty,
  hasChips,
  getChips,
  getChipsByTrigger,
  segmentsToPlainText,
  plainTextToSegments,
} from '../segment-helpers'
import type { Segment } from '../types'

describe('segment-helpers', () => {
  // -----------------------------------------------------------------------
  // Factories
  // -----------------------------------------------------------------------

  describe('text()', () => {
    it('creates a TextSegment', () => {
      expect(text('hello')).toEqual({ type: 'text', text: 'hello' })
    })

    it('handles empty string', () => {
      expect(text('')).toEqual({ type: 'text', text: '' })
    })
  })

  describe('chip()', () => {
    it('creates a ChipSegment', () => {
      const result = chip({ trigger: '@', value: 'u1', displayText: 'Alice' })
      expect(result).toEqual({
        type: 'chip',
        trigger: '@',
        value: 'u1',
        displayText: 'Alice',
      })
    })

    it('passes through optional fields', () => {
      const result = chip({
        trigger: '#',
        value: 'tag1',
        displayText: 'react',
        data: { color: 'blue' },
        autoResolved: true,
      })
      expect(result.data).toEqual({ color: 'blue' })
      expect(result.autoResolved).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Predicates
  // -----------------------------------------------------------------------

  describe('isSegmentsEmpty()', () => {
    it('returns true for empty array', () => {
      expect(isSegmentsEmpty([])).toBe(true)
    })

    it('returns true for whitespace-only text', () => {
      expect(isSegmentsEmpty([text(''), text('  '), text('\n')])).toBe(true)
    })

    it('returns false when there is real text', () => {
      expect(isSegmentsEmpty([text('hello')])).toBe(false)
    })

    it('returns false when there is a chip', () => {
      expect(
        isSegmentsEmpty([text(''), chip({ trigger: '@', value: 'u1', displayText: 'Alice' })]),
      ).toBe(false)
    })
  })

  describe('hasChips()', () => {
    it('returns false for text-only segments', () => {
      expect(hasChips([text('hello')])).toBe(false)
    })

    it('returns true when a chip is present', () => {
      expect(
        hasChips([text('hi '), chip({ trigger: '@', value: 'u1', displayText: 'Alice' })]),
      ).toBe(true)
    })
  })

  describe('getChips()', () => {
    it('extracts only chip segments', () => {
      const segments: Segment[] = [
        text('hi '),
        chip({ trigger: '@', value: 'u1', displayText: 'Alice' }),
        text(' and '),
        chip({ trigger: '@', value: 'u2', displayText: 'Bob' }),
      ]
      const chips = getChips(segments)
      expect(chips).toHaveLength(2)
      expect(chips[0].displayText).toBe('Alice')
      expect(chips[1].displayText).toBe('Bob')
    })

    it('returns empty array for text-only', () => {
      expect(getChips([text('hello')])).toEqual([])
    })
  })

  describe('getChipsByTrigger()', () => {
    it('filters chips by trigger character', () => {
      const segments: Segment[] = [
        chip({ trigger: '@', value: 'u1', displayText: 'Alice' }),
        chip({ trigger: '#', value: 't1', displayText: 'react' }),
        chip({ trigger: '@', value: 'u2', displayText: 'Bob' }),
      ]
      const mentions = getChipsByTrigger(segments, '@')
      expect(mentions).toHaveLength(2)
      expect(mentions[0].displayText).toBe('Alice')

      const tags = getChipsByTrigger(segments, '#')
      expect(tags).toHaveLength(1)
      expect(tags[0].displayText).toBe('react')
    })
  })

  // -----------------------------------------------------------------------
  // Re-exports
  // -----------------------------------------------------------------------

  describe('re-exported utilities', () => {
    it('segmentsToPlainText works', () => {
      const segments: Segment[] = [
        text('Hello '),
        chip({ trigger: '@', value: 'u1', displayText: 'Alice' }),
      ]
      expect(segmentsToPlainText(segments)).toBe('Hello @Alice')
    })

    it('plainTextToSegments works', () => {
      expect(plainTextToSegments('hello')).toEqual([{ type: 'text', text: 'hello' }])
      expect(plainTextToSegments('')).toEqual([])
    })
  })
})

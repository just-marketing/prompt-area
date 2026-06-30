import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import { truncateSegmentsToLength, segmentsToPlainText } from '../prompt-area-engine'
import type { Segment } from '../types'

const chip = (trigger: string, displayText: string): Segment => ({
  type: 'chip',
  trigger,
  value: displayText,
  displayText,
})

describe('truncateSegmentsToLength', () => {
  it('returns segments unchanged when under the limit', () => {
    const segs: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(truncateSegmentsToLength(segs, 10)).toEqual(segs)
  })

  it('keeps text that lands exactly on the limit', () => {
    const segs: Segment[] = [{ type: 'text', text: 'hello' }]
    expect(truncateSegmentsToLength(segs, 5)).toEqual(segs)
  })

  it('slices a text segment that crosses the limit', () => {
    const segs: Segment[] = [{ type: 'text', text: 'hello world' }]
    expect(truncateSegmentsToLength(segs, 5)).toEqual([{ type: 'text', text: 'hello' }])
  })

  it('counts a chip as trigger + displayText and slices the following text', () => {
    // '@bob' = 4 chars; cap 6 keeps the chip + 2 chars of the next text
    const segs: Segment[] = [chip('@', 'bob'), { type: 'text', text: ' hello' }]
    expect(truncateSegmentsToLength(segs, 6)).toEqual([
      chip('@', 'bob'),
      { type: 'text', text: ' h' },
    ])
  })

  it('drops a chip that would cross the limit (cannot be partial)', () => {
    // 'hi ' = 3 fits; '@alice' = 6 would cross cap 5 -> dropped
    const segs: Segment[] = [{ type: 'text', text: 'hi ' }, chip('@', 'alice')]
    expect(truncateSegmentsToLength(segs, 5)).toEqual([{ type: 'text', text: 'hi ' }])
  })

  it('returns empty for a non-positive limit', () => {
    expect(truncateSegmentsToLength([{ type: 'text', text: 'x' }], 0)).toEqual([])
  })
})

describe('PromptArea maxLength prop', () => {
  function renderWithCap(maxLength: number) {
    const onChangeSpy = vi.fn()
    function Wrap() {
      const [value, setValue] = useState<Segment[]>([])
      return (
        <PromptArea
          value={value}
          maxLength={maxLength}
          onChange={(s) => {
            onChangeSpy(s)
            setValue(s)
          }}
        />
      )
    }
    render(<Wrap />)
    return { editor: screen.getByRole('textbox') as HTMLDivElement, onChangeSpy }
  }

  it('truncates typed input past the cap (editor + onChange)', () => {
    const { editor, onChangeSpy } = renderWithCap(5)
    act(() => {
      editor.textContent = 'hello world'
      fireEvent.input(editor)
    })
    const last = onChangeSpy.mock.calls.at(-1)?.[0] as Segment[]
    expect(segmentsToPlainText(last)).toBe('hello')
    expect(editor.textContent).toBe('hello')
  })

  it('leaves input at or under the cap untouched', () => {
    const { editor, onChangeSpy } = renderWithCap(20)
    act(() => {
      editor.textContent = 'short text'
      fireEvent.input(editor)
    })
    const last = onChangeSpy.mock.calls.at(-1)?.[0] as Segment[]
    expect(segmentsToPlainText(last)).toBe('short text')
    expect(editor.textContent).toBe('short text')
  })
})

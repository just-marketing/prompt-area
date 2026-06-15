import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptAreaState } from '../use-prompt-area-state'
import type { Segment } from '../types'

describe('usePromptAreaState', () => {
  it('starts with empty value by default', () => {
    const { result } = renderHook(() => usePromptAreaState())
    expect(result.current.bind.value).toEqual([])
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.hasChips).toBe(false)
    expect(result.current.plainText).toBe('')
    expect(result.current.chips).toEqual([])
  })

  it('accepts an initial value', () => {
    const initial: Segment[] = [{ type: 'text', text: 'hello' }]
    const { result } = renderHook(() => usePromptAreaState({ initialValue: initial }))
    expect(result.current.bind.value).toEqual(initial)
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.plainText).toBe('hello')
  })

  it('updates value via bind.onChange', () => {
    const { result } = renderHook(() => usePromptAreaState())
    act(() => {
      result.current.bind.onChange([{ type: 'text', text: 'world' }])
    })
    expect(result.current.bind.value).toEqual([{ type: 'text', text: 'world' }])
    expect(result.current.plainText).toBe('world')
    expect(result.current.isEmpty).toBe(false)
  })

  it('derives hasChips and chips correctly', () => {
    const { result } = renderHook(() => usePromptAreaState())
    act(() => {
      result.current.bind.onChange([
        { type: 'text', text: 'hi ' },
        { type: 'chip', trigger: '@', value: 'u1', displayText: 'Alice' },
        { type: 'text', text: ' and ' },
        { type: 'chip', trigger: '#', value: 't1', displayText: 'react' },
      ])
    })
    expect(result.current.hasChips).toBe(true)
    expect(result.current.chips).toHaveLength(2)
    expect(result.current.chips[0].displayText).toBe('Alice')
    expect(result.current.chips[1].displayText).toBe('react')
    expect(result.current.plainText).toBe('hi @Alice and #react')
  })

  it('clear() resets value when no ref is attached', () => {
    const { result } = renderHook(() => usePromptAreaState())
    act(() => {
      result.current.bind.onChange([{ type: 'text', text: 'data' }])
    })
    expect(result.current.isEmpty).toBe(false)

    act(() => {
      result.current.clear()
    })
    expect(result.current.bind.value).toEqual([])
    expect(result.current.isEmpty).toBe(true)
  })

  it('provides a stable bind.ref object', () => {
    const { result, rerender } = renderHook(() => usePromptAreaState())
    const ref1 = result.current.bind.ref
    rerender()
    expect(result.current.bind.ref).toBe(ref1)
  })
})

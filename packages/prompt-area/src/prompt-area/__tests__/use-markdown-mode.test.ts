import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMarkdownMode, oppositeMode } from '../use-markdown-mode'
import type { PromptAreaMode } from '../use-markdown-mode'

describe('oppositeMode', () => {
  it('flips between markdown and plain', () => {
    expect(oppositeMode('markdown')).toBe('plain')
    expect(oppositeMode('plain')).toBe('markdown')
  })
})

describe('useMarkdownMode', () => {
  it('defaults to markdown mode', () => {
    const { result } = renderHook(() => useMarkdownMode())
    expect(result.current.mode).toBe('markdown')
    expect(result.current.markdown).toBe(true)
    expect(result.current.isPlainText).toBe(false)
  })

  it('respects initialMode', () => {
    const { result } = renderHook(() => useMarkdownMode({ initialMode: 'plain' }))
    expect(result.current.mode).toBe('plain')
    expect(result.current.markdown).toBe(false)
    expect(result.current.isPlainText).toBe(true)
  })

  it('toggle() flips the mode', () => {
    const { result } = renderHook(() => useMarkdownMode())
    act(() => result.current.toggle())
    expect(result.current.mode).toBe('plain')
    expect(result.current.markdown).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.mode).toBe('markdown')
    expect(result.current.markdown).toBe(true)
  })

  it('setMode() switches to an explicit mode', () => {
    const { result } = renderHook(() => useMarkdownMode())
    act(() => result.current.setMode('plain'))
    expect(result.current.mode).toBe('plain')
  })

  it('notifies onModeChange only on actual changes', () => {
    const onModeChange = vi.fn()
    const { result } = renderHook(() => useMarkdownMode({ onModeChange }))

    act(() => result.current.setMode('markdown')) // already markdown → no-op
    expect(onModeChange).not.toHaveBeenCalled()

    act(() => result.current.toggle())
    expect(onModeChange).toHaveBeenCalledTimes(1)
    expect(onModeChange).toHaveBeenLastCalledWith('plain')
  })

  it('supports controlled mode', () => {
    const onModeChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ mode }: { mode: PromptAreaMode }) => useMarkdownMode({ mode, onModeChange }),
      { initialProps: { mode: 'markdown' as PromptAreaMode } },
    )
    expect(result.current.mode).toBe('markdown')

    // Toggling a controlled hook reports the change but does not self-update.
    act(() => result.current.toggle())
    expect(onModeChange).toHaveBeenCalledWith('plain')
    expect(result.current.mode).toBe('markdown')

    // The parent drives the value.
    rerender({ mode: 'plain' })
    expect(result.current.mode).toBe('plain')
    expect(result.current.isPlainText).toBe(true)
  })
})

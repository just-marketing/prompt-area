import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { StrictMode } from 'react'
import { PromptArea } from '../prompt-area'
import type { Segment } from '../types'

// ---------------------------------------------------------------------------
// autoGrow height syncs are coalesced into one requestAnimationFrame callback
// per frame. Each sync is a forced reflow (height:auto → read scrollHeight →
// height:px), so several inputs inside one frame must produce exactly one
// measurement, and unmounting must cancel a pending one.
// ---------------------------------------------------------------------------

describe('autoGrow rAF coalescing', () => {
  const defaultProps = {
    value: [] as Segment[],
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function instrumentScrollHeight(editor: HTMLElement): { count: () => number } {
    let reads = 0
    Object.defineProperty(editor, 'scrollHeight', {
      configurable: true,
      get() {
        reads++
        return 180
      },
    })
    return { count: () => reads }
  }

  it('measures once per frame no matter how many inputs arrive', () => {
    render(<PromptArea {...defaultProps} autoGrow />)
    const editor = screen.getByRole('textbox')
    const reads = instrumentScrollHeight(editor)

    // Focus performs its one synchronous expand measurement and the
    // focus-driven effect schedules a rAF sync.
    fireEvent.focus(editor)
    const afterFocus = reads.count()
    expect(afterFocus).toBe(1)

    // Three inputs in the same frame: no synchronous measurements…
    fireEvent.input(editor)
    fireEvent.input(editor)
    fireEvent.input(editor)
    expect(reads.count()).toBe(afterFocus)

    // …and flushing the frame runs exactly one coalesced measurement.
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(reads.count()).toBe(afterFocus + 1)

    // A quiet next frame measures nothing.
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(reads.count()).toBe(afterFocus + 1)
  })

  it('cancels a pending measurement on unmount', () => {
    const { unmount } = render(<PromptArea {...defaultProps} autoGrow />)
    const editor = screen.getByRole('textbox')
    const reads = instrumentScrollHeight(editor)

    fireEvent.focus(editor)
    fireEvent.input(editor)
    const beforeUnmount = reads.count()

    unmount()
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(reads.count()).toBe(beforeUnmount)
  })

  it('keeps measuring under StrictMode double-mount (guard is not latched by cleanup)', () => {
    render(
      <StrictMode>
        <PromptArea {...defaultProps} autoGrow />
      </StrictMode>,
    )
    const editor = screen.getByRole('textbox')
    const reads = instrumentScrollHeight(editor)

    fireEvent.focus(editor)
    fireEvent.input(editor)
    const before = reads.count()
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    // The pending-rAF cleanup of the StrictMode remount must not leave the
    // scheduler thinking a frame is still pending.
    expect(reads.count()).toBeGreaterThan(before)
  })

  it('does not measure at all while blurred', () => {
    render(<PromptArea {...defaultProps} autoGrow />)
    const editor = screen.getByRole('textbox')
    const reads = instrumentScrollHeight(editor)

    fireEvent.input(editor)
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(reads.count()).toBe(0)
  })
})

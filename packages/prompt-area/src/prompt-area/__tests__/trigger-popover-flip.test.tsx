import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TriggerPopover } from '../trigger-popover'
import type { TriggerSuggestion } from '../types'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

const sampleSuggestions: TriggerSuggestion[] = [
  { value: 'alice', label: 'Alice' },
  { value: 'bob', label: 'Bob' },
]

function defaultProps(overrides: Partial<Parameters<typeof TriggerPopover>[0]> = {}) {
  return {
    suggestions: sampleSuggestions,
    loading: false,
    selectedIndex: 0,
    onSelect: vi.fn(),
    onDismiss: vi.fn(),
    triggerRect: new DOMRect(100, 200, 10, 20),
    triggerChar: '@',
    ...overrides,
  }
}

function setViewport({ height, width }: { height?: number; width?: number }) {
  if (height !== undefined) {
    Object.defineProperty(window, 'innerHeight', {
      value: height,
      configurable: true,
      writable: true,
    })
  }
  if (width !== undefined) {
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      configurable: true,
      writable: true,
    })
  }
}

describe('TriggerPopover flip-above positioning', () => {
  let originalHeight: number
  let originalWidth: number

  beforeEach(() => {
    vi.clearAllMocks()
    originalHeight = window.innerHeight
    originalWidth = window.innerWidth
  })

  afterEach(() => {
    setViewport({ height: originalHeight, width: originalWidth })
  })

  it('anchors below the trigger (top set, bottom unset) when there is room below', () => {
    setViewport({ height: 768, width: 1024 })
    // bottom = 220, spaceBelow = 768 - 220 = 548 >= 240 (popoverMaxHeight) => below
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(100, 200, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.top).toBe('224px') // triggerRect.bottom + 4
    expect(style.bottom).toBe('')
  })

  it('flips above the trigger (bottom set, top unset) when there is not enough room below', () => {
    setViewport({ height: 600, width: 1024 })
    // top = 560, bottom = 580, spaceBelow = 600 - 580 = 20 < 240
    // triggerRect.top (560) > spaceBelow (20) => flip above
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(100, 560, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.bottom).toBe('44px') // innerHeight - triggerRect.top + 4 = 600 - 560 + 4
    expect(style.top).toBe('')
  })

  it('stays below when room below is small but still larger than room above', () => {
    setViewport({ height: 300, width: 1024 })
    // top = 80, bottom = 100, spaceBelow = 300 - 100 = 200 < 240 (cramped)
    // but triggerRect.top (80) <= spaceBelow (200) => do NOT flip
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(100, 80, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.top).toBe('104px') // triggerRect.bottom + 4
    expect(style.bottom).toBe('')
  })

  it('keeps position fixed and left clamped while flipping above', () => {
    setViewport({ height: 600, width: 1024 })
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(100, 560, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.position).toBe('fixed')
    // left = min(triggerRect.left=100, innerWidth - popoverMaxWidth - 8)
    // popoverMaxWidth = min(320, 1024 - 16) = 320 => min(100, 1024 - 320 - 8 = 696) = 100
    expect(style.left).toBe('100px')
    expect(style.zIndex).toBe('50')
  })

  it('clamps left to viewport when the trigger is near the right edge', () => {
    setViewport({ height: 600, width: 400 })
    // popoverMaxWidth = min(320, 400 - 16 = 384) = 320
    // left = min(triggerRect.left=380, 400 - 320 - 8 = 72) = 72 => max(8, 72) = 72
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(380, 560, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.left).toBe('72px')
    expect(style.maxWidth).toBe('320px')
  })

  it('flips above using the bottom anchor derived from the viewport height', () => {
    setViewport({ height: 500, width: 1024 })
    // top = 470, bottom = 490, spaceBelow = 500 - 490 = 10 < 240, top (470) > 10 => flip
    render(<TriggerPopover {...defaultProps({ triggerRect: new DOMRect(100, 470, 10, 20) })} />)

    const style = screen.getByRole('listbox').style
    expect(style.bottom).toBe('34px') // 500 - 470 + 4
    expect(style.top).toBe('')
  })
})

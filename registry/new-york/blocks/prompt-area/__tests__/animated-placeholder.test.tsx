import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AnimatedPlaceholder } from '../animated-placeholder'

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid="motion-div" {...filterDOMProps(props)}>
        {children}
      </div>
    ),
  },
}))

// Filter out non-DOM props to avoid React warnings
function filterDOMProps(props: Record<string, unknown>) {
  const domProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (['initial', 'animate', 'exit', 'transition'].includes(key)) continue
    domProps[key] = value
  }
  return domProps
}

describe('AnimatedPlaceholder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the first text', () => {
    render(<AnimatedPlaceholder texts={['Hello', 'World']} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders with aria-hidden', () => {
    const { container } = render(<AnimatedPlaceholder texts={['Hello']} />)
    const wrapper = container.firstElementChild!
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
  })

  it('has pointer-events-none class', () => {
    const { container } = render(<AnimatedPlaceholder texts={['Hello']} />)
    const wrapper = container.firstElementChild!
    expect(wrapper.className).toContain('pointer-events-none')
  })

  it('cycles through texts at interval', () => {
    render(<AnimatedPlaceholder texts={['First', 'Second', 'Third']} interval={1000} />)
    expect(screen.getByText('First')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Second')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Third')).toBeInTheDocument()

    // Wraps back to first
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('uses default interval of 3000ms', () => {
    render(<AnimatedPlaceholder texts={['A', 'B']} />)
    expect(screen.getByText('A')).toBeInTheDocument()

    // Should not change at 2999ms
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(screen.getByText('A')).toBeInTheDocument()

    // Should change at 3000ms
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('does not start interval with single text', () => {
    render(<AnimatedPlaceholder texts={['Only']} />)
    expect(screen.getByText('Only')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    // Still showing same text
    expect(screen.getByText('Only')).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<AnimatedPlaceholder texts={['A', 'B']} />)

    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})

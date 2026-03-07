import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { ActionBar } from '../action-bar'

describe('ActionBar', () => {
  it('renders a toolbar element', () => {
    render(<ActionBar />)
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  it('renders left slot content', () => {
    render(<ActionBar left={<button>Left</button>} />)
    expect(screen.getByText('Left')).toBeInTheDocument()
  })

  it('renders right slot content', () => {
    render(<ActionBar right={<button>Right</button>} />)
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('renders both slots simultaneously', () => {
    render(<ActionBar left={<button>Left</button>} right={<button>Right</button>} />)
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('applies disabled styling', () => {
    render(<ActionBar disabled />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toHaveAttribute('aria-disabled', 'true')
    expect(toolbar.className).toContain('pointer-events-none')
    expect(toolbar.className).toContain('opacity-50')
  })

  it('does not set aria-disabled when not disabled', () => {
    render(<ActionBar />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).not.toHaveAttribute('aria-disabled')
  })

  it('applies custom className', () => {
    render(<ActionBar className="custom-class" />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.className).toContain('custom-class')
  })

  it('forwards ref to root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ActionBar ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current?.getAttribute('role')).toBe('toolbar')
  })

  it('uses default aria-label', () => {
    render(<ActionBar />)
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Action bar')
  })

  it('sets custom aria-label', () => {
    render(<ActionBar aria-label="Chat actions" />)
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Chat actions')
  })

  it('sets data-test-id', () => {
    render(<ActionBar data-test-id="action-bar" />)
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-test-id', 'action-bar')
  })

  it('has correct displayName', () => {
    expect(ActionBar.displayName).toBe('ActionBar')
  })

  it('does not render left wrapper when left is not provided', () => {
    render(<ActionBar right={<button>Right</button>} />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.children).toHaveLength(1)
  })

  it('does not render right wrapper when right is not provided', () => {
    render(<ActionBar left={<button>Left</button>} />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.children).toHaveLength(1)
  })

  it('renders no children when both slots are empty', () => {
    render(<ActionBar />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.children).toHaveLength(0)
  })
})

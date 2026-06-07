import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { StatusBar } from '../status-bar'

describe('StatusBar', () => {
  it('renders a group element', () => {
    render(<StatusBar />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('renders left slot content', () => {
    render(<StatusBar left={<span>Branch: main</span>} />)
    expect(screen.getByText('Branch: main')).toBeInTheDocument()
  })

  it('renders right slot content', () => {
    render(<StatusBar right={<span>Opus 4.8</span>} />)
    expect(screen.getByText('Opus 4.8')).toBeInTheDocument()
  })

  it('renders both slots simultaneously', () => {
    render(<StatusBar left={<span>Left</span>} right={<span>Right</span>} />)
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('applies disabled styling', () => {
    render(<StatusBar disabled />)
    const status = screen.getByRole('group')
    expect(status).toHaveAttribute('aria-disabled', 'true')
    expect(status.className).toContain('pointer-events-none')
    expect(status.className).toContain('opacity-50')
  })

  it('does not set aria-disabled when not disabled', () => {
    render(<StatusBar />)
    const status = screen.getByRole('group')
    expect(status).not.toHaveAttribute('aria-disabled')
  })

  it('applies custom className', () => {
    render(<StatusBar className="custom-class" />)
    const status = screen.getByRole('group')
    expect(status.className).toContain('custom-class')
  })

  it('forwards ref to root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<StatusBar ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current?.getAttribute('role')).toBe('group')
  })

  it('uses default aria-label', () => {
    render(<StatusBar />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Status bar')
  })

  it('sets custom aria-label', () => {
    render(<StatusBar aria-label="Context info" />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Context info')
  })

  it('sets data-test-id', () => {
    render(<StatusBar data-test-id="status-bar" />)
    expect(screen.getByRole('group')).toHaveAttribute('data-test-id', 'status-bar')
  })

  it('does not render left wrapper when left is not provided', () => {
    render(<StatusBar right={<span>Right</span>} />)
    const status = screen.getByRole('group')
    expect(status.children).toHaveLength(1)
  })

  it('does not render right wrapper when right is not provided', () => {
    render(<StatusBar left={<span>Left</span>} />)
    const status = screen.getByRole('group')
    expect(status.children).toHaveLength(1)
  })

  it('renders no children when both slots are empty', () => {
    render(<StatusBar />)
    const status = screen.getByRole('group')
    expect(status.children).toHaveLength(0)
  })
})

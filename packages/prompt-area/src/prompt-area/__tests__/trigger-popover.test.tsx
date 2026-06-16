import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TriggerPopover } from '../trigger-popover'
import type { TriggerSuggestion } from '../types'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

const baseTriggerRect = new DOMRect(100, 200, 10, 20)

const sampleSuggestions: TriggerSuggestion[] = [
  { value: 'alice', label: 'Alice', description: 'Engineer' },
  { value: 'bob', label: 'Bob' },
  { value: 'carol', label: 'Carol', icon: '👩' },
]

function defaultProps(overrides: Partial<Parameters<typeof TriggerPopover>[0]> = {}) {
  return {
    suggestions: sampleSuggestions,
    loading: false,
    selectedIndex: 0,
    onSelect: vi.fn(),
    onDismiss: vi.fn(),
    triggerRect: baseTriggerRect,
    triggerChar: '@',
    ...overrides,
  }
}

describe('TriggerPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when triggerRect is null', () => {
    const { container } = render(<TriggerPopover {...defaultProps({ triggerRect: null })} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when no suggestions, not loading, no error, no emptyMessage', () => {
    const { container } = render(
      <TriggerPopover {...defaultProps({ suggestions: [], loading: false, error: undefined })} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders suggestions as listbox options', () => {
    render(<TriggerPopover {...defaultProps()} />)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('renders suggestion labels', () => {
    render(<TriggerPopover {...defaultProps()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('renders suggestion descriptions when present', () => {
    render(<TriggerPopover {...defaultProps()} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
  })

  it('renders suggestion icons when present', () => {
    render(<TriggerPopover {...defaultProps()} />)
    expect(screen.getByText('👩')).toBeInTheDocument()
  })

  it('marks selected suggestion with aria-selected', () => {
    render(<TriggerPopover {...defaultProps({ selectedIndex: 1 })} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('applies bg-accent class to selected item', () => {
    render(<TriggerPopover {...defaultProps({ selectedIndex: 0 })} />)
    const options = screen.getAllByRole('option')
    expect(options[0].className).toContain('bg-accent')
  })

  it('calls onSelect when a suggestion is clicked', () => {
    const onSelect = vi.fn()
    render(<TriggerPopover {...defaultProps({ onSelect })} />)

    const option = screen.getAllByRole('option')[1]
    fireEvent.mouseDown(option)

    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[1])
  })

  it('shows loading state', () => {
    render(<TriggerPopover {...defaultProps({ suggestions: [], loading: true })} />)
    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(
      <TriggerPopover
        {...defaultProps({ suggestions: [], loading: false, error: 'Search failed' })}
      />,
    )
    expect(screen.getByText('Search failed')).toBeInTheDocument()
  })

  it('shows empty message when no suggestions and emptyMessage is set', () => {
    render(
      <TriggerPopover
        {...defaultProps({ suggestions: [], loading: false, emptyMessage: 'No matches found' })}
      />,
    )
    expect(screen.getByText('No matches found')).toBeInTheDocument()
  })

  it('sets aria-label with trigger char', () => {
    render(<TriggerPopover {...defaultProps({ triggerChar: '#' })} />)
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', '# suggestions')
  })

  it('calls onDismiss when clicking outside the popover', () => {
    const onDismiss = vi.fn()
    render(<TriggerPopover {...defaultProps({ onDismiss })} />)

    fireEvent.mouseDown(document.body)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('does not call onDismiss when clicking inside the popover', () => {
    const onDismiss = vi.fn()
    render(<TriggerPopover {...defaultProps({ onDismiss })} />)

    const listbox = screen.getByRole('listbox')
    fireEvent.mouseDown(listbox)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('positions popover using triggerRect', () => {
    render(<TriggerPopover {...defaultProps()} />)
    const listbox = screen.getByRole('listbox')
    const style = listbox.style
    expect(style.position).toBe('fixed')
    expect(style.zIndex).toBe('50')
  })

  it('renders with loading state when suggestions are present but loading is true', () => {
    render(<TriggerPopover {...defaultProps({ loading: true })} />)
    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument()
  })
})

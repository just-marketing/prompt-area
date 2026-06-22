import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { CompactPromptArea } from '../compact-prompt-area'
import type { PromptAreaHandle, Segment } from '@/registry/new-york/blocks/prompt-area/types'

describe('CompactPromptArea', () => {
  afterEach(cleanup)

  const empty: Segment[] = []

  it('renders the inner PromptArea textbox', () => {
    render(<CompactPromptArea value={empty} onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('exposes the full imperative handle via the forwarded ref', () => {
    const ref = createRef<PromptAreaHandle>()
    render(<CompactPromptArea ref={ref} value={empty} onChange={vi.fn()} />)

    expect(ref.current).not.toBeNull()
    expect(typeof ref.current?.focus).toBe('function')
    expect(typeof ref.current?.blur).toBe('function')
    expect(typeof ref.current?.insertChip).toBe('function')
    expect(typeof ref.current?.getPlainText).toBe('function')
    expect(typeof ref.current?.clear).toBe('function')
  })

  it('forwards getPlainText() to the inner area', () => {
    const ref = createRef<PromptAreaHandle>()
    const value: Segment[] = [
      { type: 'text', text: 'Hello ' },
      { type: 'chip', trigger: '@', value: 'u1', displayText: 'Alice' },
    ]
    render(<CompactPromptArea ref={ref} value={value} onChange={vi.fn()} />)

    expect(ref.current?.getPlainText()).toBe('Hello @Alice')
  })

  it('forwards focus() to the inner editor', () => {
    const ref = createRef<PromptAreaHandle>()
    render(<CompactPromptArea ref={ref} value={empty} onChange={vi.fn()} />)

    act(() => ref.current?.focus())
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('forwards clear() to the inner area', () => {
    const ref = createRef<PromptAreaHandle>()
    const onChange = vi.fn()
    render(
      <CompactPromptArea ref={ref} value={[{ type: 'text', text: 'draft' }]} onChange={onChange} />,
    )

    act(() => ref.current?.clear())
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('forwards insertChip() to the inner area and fires onChipAdd', () => {
    const ref = createRef<PromptAreaHandle>()
    const onChange = vi.fn()
    const onChipAdd = vi.fn()
    render(<CompactPromptArea ref={ref} value={empty} onChange={onChange} onChipAdd={onChipAdd} />)

    act(() => ref.current?.insertChip({ trigger: '@', value: 'u1', displayText: 'Alice' }))

    expect(onChipAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'chip', trigger: '@', value: 'u1', displayText: 'Alice' }),
    )
    expect(onChange).toHaveBeenCalled()
  })

  it('returns an empty string from getPlainText() when empty', () => {
    const ref = createRef<PromptAreaHandle>()
    render(<CompactPromptArea ref={ref} value={empty} onChange={vi.fn()} />)
    expect(ref.current?.getPlainText()).toBe('')
  })
})

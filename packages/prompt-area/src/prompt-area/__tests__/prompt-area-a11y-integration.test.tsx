import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { createRef } from 'react'
import { PromptArea } from '../prompt-area'
import type { PromptAreaHandle, Segment, PromptAreaImage, PromptAreaFile } from '../types'

expect.extend(toHaveNoViolations)

// ---------------------------------------------------------------------------
// 1. Accessibility audits
// ---------------------------------------------------------------------------

describe('PromptArea accessibility audits', () => {
  const defaultProps = {
    value: [] as Segment[],
    onChange: vi.fn(),
  }

  it('empty state has no a11y violations', async () => {
    const { container } = render(<PromptArea {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with text content has no a11y violations', async () => {
    const { container } = render(
      <PromptArea {...defaultProps} value={[{ type: 'text', text: 'Hello world' }]} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with chip content has no a11y violations', async () => {
    const { container } = render(
      <PromptArea
        {...defaultProps}
        value={[
          { type: 'text', text: 'Hey ' },
          { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
          { type: 'text', text: ' check this' },
        ]}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('disabled state has no a11y violations', async () => {
    const { container } = render(<PromptArea {...defaultProps} disabled />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with images attached has no a11y violations', async () => {
    const images: PromptAreaImage[] = [
      { id: '1', url: 'https://example.com/img1.png', alt: 'Screenshot' },
    ]
    const { container } = render(<PromptArea {...defaultProps} images={images} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with files attached has no a11y violations', async () => {
    const files: PromptAreaFile[] = [
      { id: '1', name: 'report.pdf', size: 1024, type: 'application/pdf' },
    ]
    const { container } = render(<PromptArea {...defaultProps} files={files} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('editor has proper role="textbox"', () => {
    render(<PromptArea {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('editor has aria-label', () => {
    render(<PromptArea {...defaultProps} aria-label="Chat input" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Chat input')
  })

  it('editor has aria-multiline="true"', () => {
    render(<PromptArea {...defaultProps} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true')
  })

  it('disabled editor has aria-disabled="true"', () => {
    render(<PromptArea {...defaultProps} disabled />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-disabled', 'true')
  })
})

// ---------------------------------------------------------------------------
// 2. Integration tests for user workflows
// ---------------------------------------------------------------------------

describe('PromptArea integration workflows', () => {
  it('type then submit workflow calls onSubmit with segments', () => {
    const onSubmit = vi.fn()
    const segments: Segment[] = [{ type: 'text', text: 'hello' }]

    render(<PromptArea value={segments} onChange={vi.fn()} onSubmit={onSubmit} />)
    const editor = screen.getByRole('textbox')

    // Simulate typing by firing input event
    fireEvent.input(editor, {
      target: { textContent: 'hello' },
    })

    // Press Enter to submit
    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onSubmit).toHaveBeenCalledWith(segments)
  })

  it('clear via imperative handle empties editor', () => {
    const onChange = vi.fn()
    const ref = createRef<PromptAreaHandle>()

    render(
      <PromptArea value={[{ type: 'text', text: 'some content' }]} onChange={onChange} ref={ref} />,
    )

    act(() => {
      ref.current!.clear()
    })

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('getPlainText returns concatenated text from segments', () => {
    const ref = createRef<PromptAreaHandle>()
    const segments: Segment[] = [
      { type: 'text', text: 'Hello ' },
      { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
      { type: 'text', text: ' how are you?' },
    ]

    render(<PromptArea value={segments} onChange={vi.fn()} ref={ref} />)

    const plainText = ref.current!.getPlainText()
    expect(plainText).toContain('Hello')
    expect(plainText).toContain('Alice')
    expect(plainText).toContain('how are you?')
  })

  it('focus and blur via imperative handle', () => {
    const ref = createRef<PromptAreaHandle>()

    render(<PromptArea value={[]} onChange={vi.fn()} ref={ref} />)
    const editor = screen.getByRole('textbox')

    act(() => {
      ref.current!.focus()
    })
    expect(document.activeElement).toBe(editor)

    act(() => {
      ref.current!.blur()
    })
    expect(document.activeElement).not.toBe(editor)
  })

  it('paste image triggers onImagePaste', () => {
    const onImagePaste = vi.fn()

    render(<PromptArea value={[]} onChange={vi.fn()} onImagePaste={onImagePaste} />)
    const editor = screen.getByRole('textbox')

    const file = new File(['pixels'], 'photo.png', { type: 'image/png' })
    const clipboardData = {
      files: [file],
      items: [] as DataTransferItem[],
      getData: () => '',
    }

    fireEvent.paste(editor, { clipboardData })

    expect(onImagePaste).toHaveBeenCalledWith(file)
  })

  it('disabled editor has contentEditable false', () => {
    const onChange = vi.fn()

    render(<PromptArea value={[]} onChange={onChange} disabled />)
    const editor = screen.getByRole('textbox')

    // Disabled state sets contentEditable to false, preventing user input
    expect(editor).toHaveAttribute('contenteditable', 'false')
    expect(editor).toHaveAttribute('aria-disabled', 'true')
  })
})

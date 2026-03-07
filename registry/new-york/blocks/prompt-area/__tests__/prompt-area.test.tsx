import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PromptArea } from '../prompt-area'
import type { PromptAreaHandle, PromptAreaImage, Segment } from '../types'

describe('PromptArea', () => {
  const defaultProps = {
    value: [] as Segment[],
    onChange: vi.fn(),
  }

  it('renders a textbox element', () => {
    render(<PromptArea {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows placeholder when empty', () => {
    render(<PromptArea {...defaultProps} placeholder="Type here..." />)
    expect(screen.getByText('Type here...')).toBeInTheDocument()
  })

  it('hides placeholder when value is non-empty', () => {
    render(
      <PromptArea
        {...defaultProps}
        value={[{ type: 'text', text: 'hello' }]}
        placeholder="Type here..."
      />,
    )
    expect(screen.queryByText('Type here...')).not.toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const { container } = render(<PromptArea {...defaultProps} className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('disables contentEditable when disabled', () => {
    render(<PromptArea {...defaultProps} disabled />)
    const editor = screen.getByRole('textbox')
    expect(editor).toHaveAttribute('contenteditable', 'false')
    expect(editor).toHaveAttribute('aria-disabled', 'true')
  })

  it('has correct displayName', () => {
    expect(PromptArea.displayName).toBe('PromptArea')
  })

  it('exposes imperative handle via ref', () => {
    const ref = createRef<PromptAreaHandle>()
    render(<PromptArea {...defaultProps} ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(typeof ref.current?.focus).toBe('function')
    expect(typeof ref.current?.blur).toBe('function')
    expect(typeof ref.current?.insertChip).toBe('function')
    expect(typeof ref.current?.getPlainText).toBe('function')
    expect(typeof ref.current?.clear).toBe('function')
  })

  it('sets aria-label', () => {
    render(<PromptArea {...defaultProps} aria-label="Message input" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Message input')
  })

  it('sets data-test-id', () => {
    render(<PromptArea {...defaultProps} data-test-id="prompt-input" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-test-id', 'prompt-input')
  })

  describe('image support', () => {
    const sampleImages: PromptAreaImage[] = [
      { id: '1', url: 'https://example.com/img1.png', alt: 'First' },
      { id: '2', url: 'https://example.com/img2.png', alt: 'Second' },
    ]

    it('renders images above the editor by default', () => {
      const { container } = render(<PromptArea {...defaultProps} images={sampleImages} />)
      const imageList = screen.getByRole('list', { name: 'Attached images' })
      const editor = screen.getByRole('textbox')
      // Image list should come before the editor wrapper in DOM order
      const children = Array.from(container.firstElementChild!.children)
      const editorWrapper = editor.closest('.prompt-area-container > div:not([role="list"])')!
      expect(children.indexOf(imageList)).toBeLessThan(children.indexOf(editorWrapper))
    })

    it('renders images below the editor when imagePosition is "below"', () => {
      const { container } = render(
        <PromptArea {...defaultProps} images={sampleImages} imagePosition="below" />,
      )
      const imageList = screen.getByRole('list', { name: 'Attached images' })
      const editor = screen.getByRole('textbox')
      const children = Array.from(container.firstElementChild!.children)
      const editorWrapper = editor.closest('.prompt-area-container > div:not([role="list"])')!
      expect(children.indexOf(imageList)).toBeGreaterThan(children.indexOf(editorWrapper))
    })

    it('does not render image strip when images is empty', () => {
      render(<PromptArea {...defaultProps} images={[]} />)
      expect(screen.queryByRole('list', { name: 'Attached images' })).not.toBeInTheDocument()
    })

    it('does not render image strip when images prop is omitted', () => {
      render(<PromptArea {...defaultProps} />)
      expect(screen.queryByRole('list', { name: 'Attached images' })).not.toBeInTheDocument()
    })

    it('calls onImageRemove when clicking X on an image', async () => {
      const user = userEvent.setup()
      const onImageRemove = vi.fn()
      render(<PromptArea {...defaultProps} images={sampleImages} onImageRemove={onImageRemove} />)
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])
      expect(onImageRemove).toHaveBeenCalledWith(sampleImages[0])
    })

    it('calls onImagePaste when pasting an image file', () => {
      const onImagePaste = vi.fn()
      render(<PromptArea {...defaultProps} onImagePaste={onImagePaste} />)
      const editor = screen.getByRole('textbox')

      const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })
      const clipboardData = {
        files: [file],
        getData: () => '',
      }

      fireEvent.paste(editor, { clipboardData })
      expect(onImagePaste).toHaveBeenCalledWith(file)
    })

    it('does not call onChange when pasting an image file', () => {
      const onChange = vi.fn()
      const onImagePaste = vi.fn()
      render(<PromptArea value={[]} onChange={onChange} onImagePaste={onImagePaste} />)
      const editor = screen.getByRole('textbox')

      const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })
      const clipboardData = {
        files: [file],
        getData: () => '',
      }

      fireEvent.paste(editor, { clipboardData })
      expect(onImagePaste).toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})

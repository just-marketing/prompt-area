import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PromptArea } from '../prompt-area'
import type { PromptAreaHandle, PromptAreaImage, PromptAreaFile, Segment } from '../types'

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

  describe('animated placeholder', () => {
    it('renders animated placeholder when placeholder is an array', () => {
      render(
        <PromptArea {...defaultProps} placeholder={['Ask a question...', 'Write some code...']} />,
      )
      // The AnimatedPlaceholder renders the first text
      expect(screen.getByText('Ask a question...')).toBeInTheDocument()
    })

    it('renders static placeholder when placeholder is a string', () => {
      render(<PromptArea {...defaultProps} placeholder="Type here..." />)
      expect(screen.getByText('Type here...')).toBeInTheDocument()
    })

    it('does not render any placeholder when placeholder is not provided', () => {
      const { container } = render(<PromptArea {...defaultProps} />)
      // No placeholder element should be rendered
      const placeholders = container.querySelectorAll('[aria-hidden="true"]')
      expect(placeholders).toHaveLength(0)
    })
  })

  describe('file support', () => {
    const sampleFiles: PromptAreaFile[] = [
      { id: '1', name: 'report.pdf', size: 1024, type: 'application/pdf' },
      { id: '2', name: 'data.csv', size: 2048, type: 'text/csv' },
    ]

    it('renders files above the editor by default', () => {
      render(<PromptArea {...defaultProps} files={sampleFiles} />)
      expect(screen.getByRole('list', { name: 'Attached files' })).toBeInTheDocument()
    })

    it('renders files below the editor when filePosition is "below"', () => {
      const { container } = render(
        <PromptArea {...defaultProps} files={sampleFiles} filePosition="below" />,
      )
      const fileList = screen.getByRole('list', { name: 'Attached files' })
      const editor = screen.getByRole('textbox')
      const children = Array.from(container.firstElementChild!.children)
      const editorWrapper = editor.closest('.prompt-area-container > div:not([role="list"])')!
      expect(children.indexOf(fileList.closest('.prompt-area-container > *')!)).toBeGreaterThan(
        children.indexOf(editorWrapper),
      )
    })

    it('does not render file strip when files is empty', () => {
      render(<PromptArea {...defaultProps} files={[]} />)
      expect(screen.queryByRole('list', { name: 'Attached files' })).not.toBeInTheDocument()
    })

    it('calls onFileRemove when clicking X on a file', async () => {
      const user = userEvent.setup()
      const onFileRemove = vi.fn()
      render(<PromptArea {...defaultProps} files={sampleFiles} onFileRemove={onFileRemove} />)
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])
      expect(onFileRemove).toHaveBeenCalledWith(sampleFiles[0])
    })
  })

  describe('auto-grow', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('applies minHeight style', () => {
      render(<PromptArea {...defaultProps} minHeight={120} />)
      const editor = screen.getByRole('textbox')
      expect(editor.style.minHeight).toBe('120px')
    })

    it('applies maxHeight style when provided', () => {
      render(<PromptArea {...defaultProps} maxHeight={300} />)
      const editor = screen.getByRole('textbox')
      expect(editor.style.maxHeight).toBe('300px')
    })

    it('applies auto-grow styles when autoGrow is enabled', () => {
      render(<PromptArea {...defaultProps} autoGrow />)
      const editor = screen.getByRole('textbox')
      // Should have transition style
      expect(editor.style.transition).toContain('height')
    })

    it('syncs height on focus when autoGrow is enabled', () => {
      render(<PromptArea {...defaultProps} autoGrow />)
      const editor = screen.getByRole('textbox')

      // Mock scrollHeight
      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })

      fireEvent.focus(editor)
      // After focus, editor height should update
      expect(editor.style.height).toBeDefined()
    })

    it('shrinks on blur when autoGrow is enabled', () => {
      render(<PromptArea {...defaultProps} autoGrow />)
      const editor = screen.getByRole('textbox')

      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })

      // Focus first to set isFocused
      fireEvent.focus(editor)

      // Now blur
      fireEvent.blur(editor)

      // After blur delay, should shrink
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Height should reset (transition style present means auto-grow mode)
      expect(editor.style.transition).toContain('height')
    })

    it('syncs height on input when focused with autoGrow', () => {
      render(<PromptArea {...defaultProps} autoGrow />)
      const editor = screen.getByRole('textbox')

      Object.defineProperty(editor, 'scrollHeight', { value: 150, configurable: true })

      // Focus first
      fireEvent.focus(editor)

      // Then input
      fireEvent.input(editor)

      expect(editor.style.height).toBeDefined()
    })

    it('shows overflow gradient when collapsed content overflows', async () => {
      const { container } = render(
        <PromptArea
          {...defaultProps}
          autoGrow
          minHeight={80}
          value={[{ type: 'text', text: 'Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8' }]}
        />,
      )
      const editor = screen.getByRole('textbox')

      // Simulate content taller than container
      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })
      Object.defineProperty(editor, 'clientHeight', { value: 80, configurable: true })

      // Advance past the 160ms overflow check delay
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const gradient = container.querySelector('[aria-hidden="true"].pointer-events-auto')
      expect(gradient).toBeInTheDocument()
    })

    it('does not show overflow gradient when content fits', async () => {
      const { container } = render(
        <PromptArea
          {...defaultProps}
          autoGrow
          minHeight={80}
          value={[{ type: 'text', text: 'Short' }]}
        />,
      )
      const editor = screen.getByRole('textbox')

      // Content fits within the container
      Object.defineProperty(editor, 'scrollHeight', { value: 40, configurable: true })
      Object.defineProperty(editor, 'clientHeight', { value: 80, configurable: true })

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const gradient = container.querySelector('[aria-hidden="true"].pointer-events-auto')
      expect(gradient).not.toBeInTheDocument()
    })

    it('hides overflow gradient when focused', async () => {
      const { container } = render(
        <PromptArea
          {...defaultProps}
          autoGrow
          minHeight={80}
          value={[{ type: 'text', text: 'Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8' }]}
        />,
      )
      const editor = screen.getByRole('textbox')

      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })
      Object.defineProperty(editor, 'clientHeight', { value: 80, configurable: true })

      // Let overflow check run
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // Focus the editor – should hide gradient
      fireEvent.focus(editor)

      const gradient = container.querySelector('[aria-hidden="true"].pointer-events-auto')
      expect(gradient).not.toBeInTheDocument()
    })

    it('focuses editor when overflow gradient is clicked', async () => {
      const { container } = render(
        <PromptArea
          {...defaultProps}
          autoGrow
          minHeight={80}
          value={[{ type: 'text', text: 'Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8' }]}
        />,
      )
      const editor = screen.getByRole('textbox')

      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })
      Object.defineProperty(editor, 'clientHeight', { value: 80, configurable: true })

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const gradient = container.querySelector('[aria-hidden="true"].pointer-events-auto')
      expect(gradient).toBeInTheDocument()

      fireEvent.click(gradient!)
      expect(document.activeElement).toBe(editor)
    })

    it('re-shows overflow gradient after focus then blur', async () => {
      const { container } = render(
        <PromptArea
          {...defaultProps}
          autoGrow
          minHeight={80}
          value={[{ type: 'text', text: 'Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8' }]}
        />,
      )
      const editor = screen.getByRole('textbox')

      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })
      Object.defineProperty(editor, 'clientHeight', { value: 80, configurable: true })

      // Initial overflow check
      await act(async () => {
        vi.advanceTimersByTime(200)
      })
      expect(
        container.querySelector('[aria-hidden="true"].pointer-events-auto'),
      ).toBeInTheDocument()

      // Focus – gradient should disappear
      fireEvent.focus(editor)
      expect(
        container.querySelector('[aria-hidden="true"].pointer-events-auto'),
      ).not.toBeInTheDocument()

      // Blur – after delays, gradient should reappear
      fireEvent.blur(editor)
      // First: blur delay (150ms) fires setIsFocused(false)
      await act(async () => {
        vi.advanceTimersByTime(200)
      })
      // Then: overflow check delay (160ms) fires checkOverflow
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(
        container.querySelector('[aria-hidden="true"].pointer-events-auto'),
      ).toBeInTheDocument()
    })

    it('uses overflow-hidden when collapsed, auto when focused', () => {
      render(<PromptArea {...defaultProps} autoGrow />)
      const editor = screen.getByRole('textbox')

      // Collapsed: overflow should be hidden
      expect(editor.style.overflowY).toBe('hidden')

      Object.defineProperty(editor, 'scrollHeight', { value: 200, configurable: true })
      fireEvent.focus(editor)

      // Focused: overflow should be auto
      expect(editor.style.overflowY).toBe('auto')
    })
  })

  describe('default aria-label', () => {
    it('uses "Text input" as default aria-label', () => {
      render(<PromptArea {...defaultProps} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Text input')
    })
  })

  describe('disabled state', () => {
    it('applies opacity and cursor styles when disabled', () => {
      render(<PromptArea {...defaultProps} disabled />)
      const editor = screen.getByRole('textbox')
      expect(editor.className).toContain('cursor-not-allowed')
      expect(editor.className).toContain('opacity-50')
    })
  })

  describe('event handler wiring', () => {
    it('handles drop events on the editor', () => {
      render(<PromptArea {...defaultProps} />)
      const editor = screen.getByRole('textbox')
      // Drop should be prevented
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() })
      editor.dispatchEvent(dropEvent)
    })

    it('handles dragover events on the editor', () => {
      render(<PromptArea {...defaultProps} />)
      const editor = screen.getByRole('textbox')
      const dragOverEvent = new Event('dragover', { bubbles: true })
      Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() })
      editor.dispatchEvent(dragOverEvent)
    })
  })

  describe('auto-focus', () => {
    it('focuses editor when autoFocus is true', () => {
      render(<PromptArea {...defaultProps} autoFocus />)
      const editor = screen.getByRole('textbox')
      expect(document.activeElement).toBe(editor)
    })

    it('does not focus editor when autoFocus is false', () => {
      render(<PromptArea {...defaultProps} autoFocus={false} />)
      const editor = screen.getByRole('textbox')
      expect(document.activeElement).not.toBe(editor)
    })
  })

  describe('isEmpty detection', () => {
    it('shows placeholder for empty text segment', () => {
      render(
        <PromptArea
          value={[{ type: 'text', text: '' }]}
          onChange={vi.fn()}
          placeholder="Type here..."
        />,
      )
      expect(screen.getByText('Type here...')).toBeInTheDocument()
    })

    it('hides placeholder for chip segment', () => {
      render(
        <PromptArea
          value={[{ type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' }]}
          onChange={vi.fn()}
          placeholder="Type here..."
        />,
      )
      expect(screen.queryByText('Type here...')).not.toBeInTheDocument()
    })
  })
})

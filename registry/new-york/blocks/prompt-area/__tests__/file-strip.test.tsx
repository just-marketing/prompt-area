import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileStrip } from '../file-strip'
import type { PromptAreaFile } from '../types'

const sampleFiles: PromptAreaFile[] = [
  { id: '1', name: 'report.pdf', size: 2_458_000, type: 'application/pdf' },
  { id: '2', name: 'data.csv', size: 847_200, type: 'text/csv' },
]

const manyFiles: PromptAreaFile[] = [
  { id: '1', name: 'a.pdf', size: 1000, type: 'application/pdf' },
  { id: '2', name: 'b.csv', size: 2000, type: 'text/csv' },
  { id: '3', name: 'c.txt', size: 3000, type: 'text/plain' },
  { id: '4', name: 'd.json', size: 4000, type: 'application/json' },
]

describe('FileStrip', () => {
  it('renders nothing when files array is empty', () => {
    const { container } = render(<FileStrip files={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders correct number of file cards', () => {
    render(<FileStrip files={sampleFiles} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('displays filename and metadata', () => {
    render(<FileStrip files={sampleFiles} />)
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
    expect(screen.getByText('data.csv')).toBeInTheDocument()
    // Metadata line: extension + size
    expect(screen.getByText('PDF · 2.3 MB')).toBeInTheDocument()
    expect(screen.getByText('CSV · 827.3 KB')).toBeInTheDocument()
  })

  it('calls onRemove with correct file when X is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<FileStrip files={sampleFiles} onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons).toHaveLength(2)

    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith(sampleFiles[0])

    await user.click(removeButtons[1])
    expect(onRemove).toHaveBeenCalledWith(sampleFiles[1])
  })

  it('does not render remove buttons when onRemove is not provided', () => {
    render(<FileStrip files={sampleFiles} />)
    // sampleFiles has 2 items (<=3), so no expand button either
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('calls onClick with correct file when card is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<FileStrip files={sampleFiles} onClick={onClick} />)

    const items = screen.getAllByRole('listitem')
    await user.click(items[0])
    expect(onClick).toHaveBeenCalledWith(sampleFiles[0])
  })

  it('shows loading spinner when file.loading is true', () => {
    const loadingFiles: PromptAreaFile[] = [{ id: '1', name: 'uploading.pdf', loading: true }]
    render(<FileStrip files={loadingFiles} />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('does not show loading spinner when file.loading is false', () => {
    render(<FileStrip files={sampleFiles} />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('has accessible list structure', () => {
    render(<FileStrip files={sampleFiles} />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Attached files')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('collapses to first 3 files with "+N more" when more than 3 files', () => {
    render(<FileStrip files={manyFiles} />)
    // Only first 3 visible initially
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    // Compact cards should have w-36 class
    for (const item of items) {
      expect(item.className).toContain('w-36')
    }
    // "+1 more" button visible
    expect(screen.getByText('+1 more')).toBeInTheDocument()
    // Compact mode hides metadata secondary line
    expect(screen.queryByText(/KB/)).not.toBeInTheDocument()
  })

  it('opens popover with hidden files when "+N more" is clicked', async () => {
    const user = userEvent.setup()
    render(<FileStrip files={manyFiles} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)

    await user.click(screen.getByText('+1 more'))
    // 3 inline + 1 hidden in popover
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByLabelText('More attached files')).toBeInTheDocument()
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('closes popover when "Show less" is clicked', async () => {
    const user = userEvent.setup()
    render(<FileStrip files={manyFiles} />)

    await user.click(screen.getByText('+1 more'))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)

    await user.click(screen.getByText('Show less'))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByLabelText('More attached files')).not.toBeInTheDocument()
    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })

  it('uses normal mode with 3 or fewer files', () => {
    render(<FileStrip files={sampleFiles} />)
    const items = screen.getAllByRole('listitem')
    // Normal cards should have w-48 class
    for (const item of items) {
      expect(item.className).toContain('w-48')
    }
    // Metadata is visible
    expect(screen.getByText('PDF · 2.3 MB')).toBeInTheDocument()
  })

  it('truncates long filenames via title attribute', () => {
    const longFile: PromptAreaFile[] = [
      { id: '1', name: 'very-long-filename-that-should-be-truncated.pdf' },
    ]
    render(<FileStrip files={longFile} />)
    const nameEl = screen.getByTitle('very-long-filename-that-should-be-truncated.pdf')
    expect(nameEl).toBeInTheDocument()
    expect(nameEl).toHaveClass('truncate')
  })

  it('stopPropagation on remove button click', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClick = vi.fn()
    render(<FileStrip files={sampleFiles} onRemove={onRemove} onClick={onClick} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})

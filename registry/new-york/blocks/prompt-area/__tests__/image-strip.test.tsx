import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageStrip } from '../image-strip'
import type { PromptAreaImage } from '../types'

const sampleImages: PromptAreaImage[] = [
  { id: '1', url: 'https://example.com/img1.png', alt: 'First image' },
  { id: '2', url: 'https://example.com/img2.png', alt: 'Second image' },
]

describe('ImageStrip', () => {
  it('renders nothing when images array is empty', () => {
    const { container } = render(<ImageStrip images={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders correct number of image thumbnails', () => {
    render(<ImageStrip images={sampleImages} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('renders images with object-cover class', () => {
    render(<ImageStrip images={sampleImages} />)
    const images = screen.getAllByRole('img')
    for (const img of images) {
      expect(img).toHaveClass('object-cover')
    }
  })

  it('renders images with correct alt text', () => {
    render(<ImageStrip images={sampleImages} />)
    expect(screen.getByAltText('First image')).toBeInTheDocument()
    expect(screen.getByAltText('Second image')).toBeInTheDocument()
  })

  it('uses default alt text when not provided', () => {
    render(<ImageStrip images={[{ id: '1', url: 'https://example.com/img.png' }]} />)
    expect(screen.getByAltText('Attached image')).toBeInTheDocument()
  })

  it('calls onRemove with correct image when X is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<ImageStrip images={sampleImages} onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons).toHaveLength(2)

    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith(sampleImages[0])

    await user.click(removeButtons[1])
    expect(onRemove).toHaveBeenCalledWith(sampleImages[1])
  })

  it('does not render remove buttons when onRemove is not provided', () => {
    render(<ImageStrip images={sampleImages} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('shows loading spinner when image.loading is true', () => {
    const loadingImages: PromptAreaImage[] = [
      { id: '1', url: 'https://example.com/img.png', loading: true },
    ]
    render(<ImageStrip images={loadingImages} />)
    // The spinner has animate-spin class
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('does not show loading spinner when image.loading is false', () => {
    render(<ImageStrip images={sampleImages} />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('has accessible list structure', () => {
    render(<ImageStrip images={sampleImages} />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Attached images')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('calls onClick when clicking an image thumbnail', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ImageStrip images={sampleImages} onClick={onClick} />)

    const items = screen.getAllByRole('listitem')
    await user.click(items[0])
    expect(onClick).toHaveBeenCalledWith(sampleImages[0])
  })

  it('applies cursor-pointer class when onClick is provided', () => {
    render(<ImageStrip images={sampleImages} onClick={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0].className).toContain('cursor-pointer')
  })

  it('does not apply cursor-pointer class when onClick is not provided', () => {
    render(<ImageStrip images={sampleImages} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0].className).not.toContain('cursor-pointer')
  })

  it('applies custom className', () => {
    const { container } = render(<ImageStrip images={sampleImages} className="custom-class" />)
    expect(container.firstElementChild).toHaveClass('custom-class')
  })
})

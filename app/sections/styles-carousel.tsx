'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StyleLogo, type StyleLogoId } from '@/components/style-logo'

// The style examples are heavy, interactive composers, so load each on demand.
const ChatGptInputExample = dynamic(() =>
  import('@/app/examples/chatgpt-input').then((m) => ({ default: m.ChatGptInputExample })),
)
const CodexInputExample = dynamic(() =>
  import('@/app/examples/codex-input').then((m) => ({ default: m.CodexInputExample })),
)
const ClaudeInputExample = dynamic(() =>
  import('@/app/examples/claude-input').then((m) => ({ default: m.ClaudeInputExample })),
)
const ClaudeCodeInputExample = dynamic(() =>
  import('@/app/examples/claude-code-input').then((m) => ({ default: m.ClaudeCodeInputExample })),
)
const PerplexityInputExample = dynamic(() =>
  import('@/app/examples/perplexity-input').then((m) => ({ default: m.PerplexityInputExample })),
)

type Slide = {
  id: StyleLogoId
  label: string
  vendor: string
  render: () => ReactNode
}

// Carousel order mirrors the vendor grouping in the picker: OpenAI, then
// Anthropic, then Perplexity.
const SLIDES: Slide[] = [
  { id: 'chatgpt', label: 'ChatGPT', vendor: 'OpenAI', render: () => <ChatGptInputExample /> },
  { id: 'codex', label: 'Codex', vendor: 'OpenAI', render: () => <CodexInputExample /> },
  { id: 'claude', label: 'Claude', vendor: 'Anthropic', render: () => <ClaudeInputExample /> },
  {
    id: 'claude-code',
    label: 'Claude Code',
    vendor: 'Anthropic',
    render: () => <ClaudeCodeInputExample />,
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    vendor: 'Perplexity',
    render: () => <PerplexityInputExample />,
  },
]

// Group consecutive slides by vendor (keeping each slide's carousel index) so
// the picker labels stay in sync with SLIDES.
const GROUPS = SLIDES.reduce<{ vendor: string; items: { slide: Slide; index: number }[] }[]>(
  (acc, slide, index) => {
    const last = acc[acc.length - 1]
    if (last && last.vendor === slide.vendor) last.items.push({ slide, index })
    else acc.push({ vendor: slide.vendor, items: [{ slide, index }] })
    return acc
  },
  [],
)

const ARROW =
  'bg-background/80 hover:bg-accent text-foreground absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors sm:size-10'

export function StylesCarousel() {
  const [active, setActive] = useState(0)
  // Track travel direction so the entering slide animates in from the right when
  // moving forward and from the left when moving back.
  const [dir, setDir] = useState(0)

  const goTo = (index: number) => {
    setDir(Math.sign(index - active))
    setActive(index)
  }
  const step = (delta: 1 | -1) => {
    setDir(delta)
    setActive((a) => (a + delta + SLIDES.length) % SLIDES.length)
  }

  const activeSlide = SLIDES[active]

  return (
    <div className="flex flex-col gap-8">
      {/* Carousel viewport */}
      <div
        className="relative"
        role="group"
        aria-roledescription="carousel"
        aria-label="Built-in agent styles">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous style"
          className={cn(ARROW, 'left-0 lg:left-4')}>
          <ChevronLeft className="size-5" />
        </button>

        {/* Every slide stays mounted; we only toggle visibility. Swapping/
            remounting these heavy composers on each step reset the page scroll,
            so instead the inactive ones are hidden (display:none keeps their
            menus from being clipped) and the active one animates in. */}
        <div className="mx-auto flex min-h-[19rem] w-full max-w-2xl items-center px-12 lg:px-0">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              aria-hidden={i !== active || undefined}
              className={
                i === active
                  ? cn(
                      'animate-in fade-in w-full duration-300 ease-out',
                      dir > 0 && 'slide-in-from-right-6',
                      dir < 0 && 'slide-in-from-left-6',
                    )
                  : 'hidden'
              }>
              {slide.render()}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next style"
          className={cn(ARROW, 'right-0 lg:right-4')}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Vendor picker — grouped tiles that jump the carousel to a style */}
      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
        {GROUPS.map((group) => (
          <div key={group.vendor} className="flex flex-col items-center gap-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {group.vendor}
            </span>
            <div className="flex gap-3">
              {group.items.map(({ slide, index }) => {
                const isActive = index === active
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-pressed={isActive}
                    aria-label={`Show the ${slide.label} style`}
                    className={cn(
                      'group flex w-32 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center transition-colors sm:w-36',
                      isActive
                        ? 'border-foreground/30 bg-accent ring-foreground/15 ring-1'
                        : 'hover:bg-accent',
                    )}>
                    <StyleLogo
                      id={slide.id}
                      className={cn(
                        'size-12 transition-transform duration-200',
                        isActive ? 'scale-110' : 'group-hover:scale-110',
                      )}
                    />
                    <span className="text-sm font-medium">{slide.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Deep link to the active style on the full styles page */}
      <div className="flex justify-center">
        <Link
          href={`/styles#${activeSlide.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors">
          See the {activeSlide.label} style in full
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

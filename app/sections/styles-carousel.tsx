'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { StyleLogo, type StyleLogoId } from '@/components/style-logo'

// The style examples are heavy, interactive composers, so load each on demand.
const JumaInputExample = dynamic(() =>
  import('@/app/examples/juma-input').then((m) => ({ default: m.JumaInputExample })),
)
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
const GeminiInputExample = dynamic(() =>
  import('@/app/examples/gemini-input').then((m) => ({ default: m.GeminiInputExample })),
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

// Carousel order mirrors the vendor grouping in the picker: Juma first (it's the
// home brand), then OpenAI, Anthropic, Google, and Perplexity.
const SLIDES: Slide[] = [
  { id: 'juma', label: 'Juma', vendor: 'Juma', render: () => <JumaInputExample /> },
  { id: 'chatgpt', label: 'ChatGPT', vendor: 'OpenAI', render: () => <ChatGptInputExample /> },
  { id: 'codex', label: 'Codex', vendor: 'OpenAI', render: () => <CodexInputExample /> },
  { id: 'claude', label: 'Claude', vendor: 'Anthropic', render: () => <ClaudeInputExample /> },
  {
    id: 'claude-code',
    label: 'Claude Code',
    vendor: 'Anthropic',
    render: () => <ClaudeCodeInputExample />,
  },
  { id: 'gemini', label: 'Gemini', vendor: 'Google', render: () => <GeminiInputExample /> },
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

// Round nav button. On desktop the arrows sit in the gutter beside the composer;
// on mobile that gutter would squeeze the composer, so they move to a row below.
const ARROW_BASE =
  'bg-background hover:bg-accent text-foreground size-10 items-center justify-center rounded-full border shadow-sm transition-colors'

export function StylesCarousel() {
  const [active, setActive] = useState(0)
  // Track travel direction so the entering slide animates in from the right when
  // moving forward and from the left when moving back.
  const [dir, setDir] = useState(0)

  // Record which style the visitor chose to preview (skipping no-op re-selects),
  // tagged by how they got there — a provider logo tile or the prev/next arrows.
  const trackSelect = (index: number, method: 'logo' | 'arrow') => {
    if (index === active) return
    const slide = SLIDES[index]
    track('style_selected', {
      style: slide.id,
      vendor: slide.vendor,
      method,
      location: 'home_carousel',
    })
  }

  const goTo = (index: number) => {
    trackSelect(index, 'logo')
    setDir(Math.sign(index - active))
    setActive(index)
  }
  const step = (delta: 1 | -1) => {
    const next = (active + delta + SLIDES.length) % SLIDES.length
    trackSelect(next, 'arrow')
    setDir(delta)
    setActive(next)
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
          className={cn(
            ARROW_BASE,
            'absolute top-1/2 left-4 z-10 hidden -translate-y-1/2 lg:flex',
          )}>
          <ChevronLeft className="size-5" />
        </button>

        {/* Every slide stays mounted; we only toggle visibility. Swapping/
            remounting these heavy composers on each step reset the page scroll,
            so instead the inactive ones are hidden (display:none keeps their
            menus from being clipped) and the active one animates in. */}
        <div className="mx-auto flex min-h-[19rem] w-full max-w-2xl items-center">
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
          className={cn(
            ARROW_BASE,
            'absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 lg:flex',
          )}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* On mobile the side arrows would squeeze the composer, so show them in a
          row beneath it instead. */}
      <div className="flex justify-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous style"
          className={cn(ARROW_BASE, 'flex')}>
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next style"
          className={cn(ARROW_BASE, 'flex')}>
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

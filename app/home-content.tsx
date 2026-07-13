'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Loader2, Sparkles, X } from 'lucide-react'
import { InstallMethodTabs } from '@/components/install-method-tabs'
import { InstallCta } from '@/components/install-cta'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'
import { RotatingTitle } from '@/components/rotating-title'
import { FeaturesGrid } from './sections/features-grid'
import { ComponentsCascade } from './sections/components-cascade'
import { StylesCarousel } from './sections/styles-carousel'
import { USERS, COMMANDS, TAGS } from './sections/mock-data'
import {
  type ChipSegment,
  type Segment,
  type TriggerConfig,
  type PromptAreaFile,
  type PromptAreaImage,
} from 'prompt-area'

const CodexInputExample = dynamic(() =>
  import('./examples/codex-input').then((m) => ({ default: m.CodexInputExample })),
)

// Seed the hero composer with a realistic prompt so it shows off mentions,
// commands, tags, markdown, and file + image attachments — fully interactive.
const HERO_SEGMENTS: Segment[] = [
  { type: 'chip', trigger: '/', value: 'summarize', displayText: 'summarize' },
  { type: 'text', text: ' the brief from ' },
  { type: 'chip', trigger: '@', value: 'strategist', displayText: 'Strategist' },
  { type: 'text', text: ' and ' },
  { type: 'chip', trigger: '@', value: 'copywriter', displayText: 'Copywriter' },
  { type: 'text', text: ', tag anything ' },
  { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
  { type: 'text', text: ', and return **key messages** with *action items*.' },
]

const HERO_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accessibilityLabel: 'mention',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    accessibilityLabel: 'command',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    // Clicking a #tag chip reopens the native tag dropdown anchored to the
    // chip; picking a suggestion swaps the chip in place.
    reopenOnChipClick: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    accessibilityLabel: 'tag',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const HERO_FILES: PromptAreaFile[] = [
  {
    id: 'hero-file-1',
    name: 'Q3-2026-campaign-brief.pdf',
    size: 3_420_000,
    type: 'application/pdf',
  },
]

// Rendered as a real thumbnail (not a file-card icon) in the attachment area
// alongside the PDF, so the hero shows the composer's image-preview support
// next to plain file attachments.
const HERO_IMAGES: PromptAreaImage[] = [
  {
    id: 'hero-image-1',
    url: '/brand-moodboard.png',
    alt: 'Brand moodboard',
  },
]

const TOAST_DURATION_MS = 3200
const TOAST_EXIT_MS = 300
const MAX_TOASTS = 4

type HeroToastData = { id: number; title: string; description?: string; leaving?: boolean }

/**
 * One toast in the hero's mention-toast stack. Enter and exit both animate
 * the same two things in sync: the card (opacity + slide) and its grid row
 * (1fr ↔ 0fr), so the rest of the stack glides to its new position instead
 * of jumping when a toast appears or leaves.
 */
function HeroToast({ toast }: { toast: HeroToastData }) {
  // Mount collapsed, then open on the next frame so the entrance transitions.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    let raf2: number | undefined
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2 !== undefined) cancelAnimationFrame(raf2)
    }
  }, [])
  const open = entered && !toast.leaving

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
      <div className="min-h-0 overflow-hidden">
        {/* px/pt give the clipped box room for the card's shadow and act as
            the spacing between stacked toasts, collapsing along with the row. */}
        <div
          role="status"
          className={cn(
            'px-4 pt-2 pb-1 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none',
            open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          )}>
          <div className="bg-popover flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              @
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{toast.title}</div>
              {toast.description && (
                <div className="text-muted-foreground text-xs">{toast.description}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomeContent() {
  // Fire `demo_interacted` once, the first time the visitor focuses or types in
  // the live hero composer — our best signal that they actually tried the
  // component (autocapture can't see typing into a contentEditable).
  const demoTracked = useRef(false)
  const handleDemoInteract = useCallback(() => {
    if (demoTracked.current) return
    demoTracked.current = true
    track('demo_interacted', { location: 'hero' })
  }, [])

  // Every chip in the hero composer does something when clicked, so visitors
  // learn the chips are live objects, not styled text: #tags reopen the native
  // tag dropdown (via `reopenOnChipClick` on the trigger — picking one swaps
  // the chip in place), @mentions pop a "notified" toast, and /commands run a
  // mock execution with a result card.
  //
  // Toasts stack: each mention click pushes its own toast with its own
  // lifetime. A toast leaves in two phases — `leaving` plays the exit
  // animation (fade + slide + row collapse, see HeroToast) and only then is
  // it removed — so neighbors glide into place instead of jumping.
  const [toasts, setToasts] = useState<HeroToastData[]>([])
  // Ref mirror of `toasts` so push/dismiss can read the up-to-date list
  // synchronously (e.g. to pick a cap-eviction victim) without effects.
  const toastsRef = useRef<HeroToastData[]>([])
  const toastSeq = useRef(0)
  const toastTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const [command, setCommand] = useState<{
    chip: ChipSegment
    status: 'running' | 'done'
  } | null>(null)

  const updateToasts = useCallback((updater: (prev: HeroToastData[]) => HeroToastData[]) => {
    toastsRef.current = updater(toastsRef.current)
    setToasts(toastsRef.current)
  }, [])

  const beginToastDismiss = useCallback(
    (id: number) => {
      updateToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      const timer = setTimeout(() => {
        toastTimers.current.delete(timer)
        updateToasts((prev) => prev.filter((t) => t.id !== id))
      }, TOAST_EXIT_MS)
      toastTimers.current.add(timer)
    },
    [updateToasts],
  )

  const pushToast = useCallback(
    (toast: { title: string; description?: string }) => {
      const id = ++toastSeq.current
      updateToasts((prev) => [...prev, { id, ...toast }])
      // Over the cap: the oldest active toast leaves through the same
      // animated exit instead of vanishing.
      const active = toastsRef.current.filter((t) => !t.leaving)
      if (active.length > MAX_TOASTS) beginToastDismiss(active[0].id)
      const timer = setTimeout(() => {
        toastTimers.current.delete(timer)
        beginToastDismiss(id)
      }, TOAST_DURATION_MS)
      toastTimers.current.add(timer)
    },
    [updateToasts, beginToastDismiss],
  )

  // Clear any in-flight toast timers on unmount.
  useEffect(() => {
    const timers = toastTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleChipClick = useCallback(
    (chip: ChipSegment) => {
      track('demo_chip_clicked', { location: 'hero', trigger: chip.trigger, value: chip.value })

      if (chip.trigger === '@') {
        const user = USERS.find((u) => u.value === chip.value)
        pushToast({
          title: `${chip.displayText} notified`,
          description: user ? `${user.description} — looped in on this prompt.` : undefined,
        })
      } else if (chip.trigger === '/') {
        setCommand({ chip, status: 'running' })
      }
    },
    [pushToast],
  )

  // Let the mock command "run" briefly before showing its result.
  useEffect(() => {
    if (command?.status !== 'running') return
    const timer = setTimeout(
      () => setCommand((cur) => (cur?.status === 'running' ? { ...cur, status: 'done' } : cur)),
      1200,
    )
    return () => clearTimeout(timer)
  }, [command])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-16 sm:pt-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          {/* Copy + install — staggered into place on load */}
          <RevealGroup
            trigger="mount"
            className="flex min-w-0 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <RevealItem>
              <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                npm + shadcn · zero dependencies
              </span>
            </RevealItem>
            <RevealItem>
              <RotatingTitle className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl" />
            </RevealItem>
            <RevealItem>
              <p className="text-muted-foreground max-w-2xl text-lg text-balance">
                A production-grade textarea for AI chat interfaces — @mentions, /commands, #tags,
                inline markdown, and file attachments in one contentEditable component.
              </p>
            </RevealItem>
            <RevealItem className="w-full max-w-xl min-w-0">
              <InstallMethodTabs location="hero" />
            </RevealItem>
            <RevealItem className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
              <Link
                href="/docs"
                onClick={() => track('cta_clicked', { cta: 'get_started', location: 'hero' })}
                className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90">
                Get started
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="https://github.com/just-marketing/prompt-area"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('github_clicked', { location: 'hero' })}
                className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
                Star on GitHub
                <ArrowUpRight className="size-3.5" />
              </a>
            </RevealItem>
          </RevealGroup>
          {/* Live demo — Codex-style composer seeded with real content. Opacity-only
              (lift=false) so the composer's pop-up menus aren't anchored to a
              transformed ancestor. */}
          <div
            id="demo"
            className="w-full min-w-0 scroll-mt-20"
            onFocusCapture={handleDemoInteract}
            onInputCapture={handleDemoInteract}>
            <Reveal lift={false} delay={0.15} trigger="mount">
              {/* Local Suspense boundary: the lazy composer suspends during
                  SSR, and without this it bubbles to the layout-level boundary
                  — React then wraps the ENTIRE page body in a hidden deferred
                  segment, so nothing paints until the full HTML has parsed.
                  Scoped here, only the demo pops in late; the fallback
                  reserves its footprint so the swap causes no layout shift. */}
              <Suspense
                fallback={
                  <div
                    aria-hidden
                    className="bg-card min-h-[13rem] rounded-[24px] border border-[#ececec] shadow-sm dark:border-0 dark:bg-[#2d2d2d]"
                  />
                }>
                <CodexInputExample
                  initialSegments={HERO_SEGMENTS}
                  triggers={HERO_TRIGGERS}
                  initialFiles={HERO_FILES}
                  initialImages={HERO_IMAGES}
                  markdown
                  minHeight={76}
                  onChipClick={handleChipClick}
                />
              </Suspense>

              {/* Mock /command execution — proves slash-command chips are runnable. */}
              {command && (
                <div className="bg-muted/50 animate-in fade-in slide-in-from-bottom-2 mt-2 rounded-lg border p-3 text-sm duration-300">
                  {command.status === 'running' ? (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      Running{' '}
                      <span className="text-violet-700 dark:text-violet-400">
                        /{command.chip.value}
                      </span>{' '}
                      on {HERO_FILES[0].name}…
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                          <Sparkles className="size-3.5 text-violet-700 dark:text-violet-400" />
                          <span className="text-violet-700 dark:text-violet-400">
                            /{command.chip.value}
                          </span>
                          · {HERO_FILES[0].name}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCommand(null)}
                          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors"
                          aria-label="Dismiss summary">
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <div>
                        <span className="font-semibold">Key messages:</span> Q4 doubles down on
                        enterprise buyers with an AI-assist angle; budget shifts 30% from paid
                        social to lifecycle email.
                      </div>
                      <div>
                        <span className="font-semibold">Action items:</span>{' '}
                        <em>
                          Strategist locks the channel plan by Friday; Copywriter drafts three hero
                          variants.
                        </em>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Reveal>

            {/* Mention toasts — each @mention chip click "notifies" that
                teammate. Toasts stack bottom-up, newest nearest the edge. */}
            {toasts.length > 0 && (
              <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center">
                {toasts.map((toast) => (
                  <HeroToast key={toast.id} toast={toast} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/20 border-y">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
          <Reveal className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Everything in one input</h2>
            <p className="text-muted-foreground">
              One component replaces five libraries — no ProseMirror, Slate, or Lexical.
            </p>
          </Reveal>
          <FeaturesGrid />
        </div>
      </section>

      {/* Components */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Components &amp; layouts</h2>
          <p className="text-muted-foreground">
            Compose the input with companions to build full chat experiences.
          </p>
        </Reveal>
        <ComponentsCascade />
      </section>

      {/* Built-in styles */}
      <section className="bg-muted/20 border-y">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
          <Reveal className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Built-in agent styles</h2>
            <p className="text-muted-foreground">
              Real, copy-paste compositions modeled on the agent UIs you already know.
            </p>
          </Reveal>
          <Reveal lift={false} delay={0.05}>
            <StylesCarousel />
          </Reveal>
        </div>
      </section>

      {/* Comparison teaser */}
      <section className="border-y">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <Reveal className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">A modern alternative</h2>
            <p className="text-muted-foreground max-w-2xl">
              Lighter than Tiptap, Lexical, or Plate for chat inputs — and a drop-in upgrade from
              react-mentions. See the honest, side-by-side breakdowns.
            </p>
            <Link
              href="/compare"
              onClick={() =>
                track('cta_clicked', { cta: 'compare_alternatives', location: 'home' })
              }
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
              Compare alternatives
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 py-20">
        <Reveal>
          <InstallCta location="home" />
        </Reveal>
      </section>
    </div>
  )
}

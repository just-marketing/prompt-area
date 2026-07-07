'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUp,
  Paperclip,
  Mic,
  TextCursorInput,
  PanelBottom,
  Info,
  Minimize2,
  MessagesSquare,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'

type CardId = 'prompt-area' | 'action-bar' | 'status-bar' | 'compact' | 'chat' | 'inspector'

type ComponentCard = {
  id: CardId
  href: string
  title: string
  desc: string
  icon: LucideIcon
}

const COMPONENTS: ComponentCard[] = [
  {
    id: 'prompt-area',
    href: '/docs/components/prompt-area',
    title: 'Prompt Area',
    desc: 'The core rich-text input with chips.',
    icon: TextCursorInput,
  },
  {
    id: 'action-bar',
    href: '/docs/components/action-bar',
    title: 'Action Bar',
    desc: 'Toolbar with attach, mic, send.',
    icon: PanelBottom,
  },
  {
    id: 'status-bar',
    href: '/docs/components/status-bar',
    title: 'Status Bar',
    desc: 'Contextual info bar.',
    icon: Info,
  },
  {
    id: 'compact',
    href: '/docs/components/compact-prompt-area',
    title: 'Compact Area',
    desc: 'Pill-shaped expanding input.',
    icon: Minimize2,
  },
  {
    id: 'chat',
    href: '/docs/components/chat-prompt-layout',
    title: 'Chat Layout',
    desc: 'Full-height chat layout.',
    icon: MessagesSquare,
  },
  {
    id: 'inspector',
    href: '/docs/inspector',
    title: 'Inspector',
    desc: 'Live event & API playground.',
    icon: Activity,
  },
]

// A smooth gradation: each column lifts a step higher than the last so the row
// climbs evenly to the right. One value per column, in px.
const OFFSETS = [70, 56, 42, 28, 14, 0]

// ── Covers ────────────────────────────────────────────────────────────────
// Each card previews the real component with a few styled shapes instead of a
// generic icon. Hover micro-interactions and idle blink/pulse give it life;
// all motion is gated behind `motion-safe` / a reduced-motion media query.

const COVER_SHELL =
  'border-border/70 bg-muted/40 relative flex h-24 shrink-0 overflow-hidden rounded-xl border'
const LINE = 'bg-foreground/10 rounded-full'

function Cover({ id }: { id: CardId }) {
  switch (id) {
    case 'prompt-area':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full flex-col justify-center gap-2 p-3">
            <div className="flex items-center gap-1">
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 transition-transform duration-200 group-hover:scale-105 dark:text-blue-400">
                @Ana
              </span>
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600 transition-transform duration-200 group-hover:scale-105 dark:text-green-400">
                #brief
              </span>
              <span className="pa-caret bg-foreground/70 h-3.5 w-px" />
            </div>
            <div className={cn(LINE, 'h-1.5 w-3/4')} />
            <div className={cn(LINE, 'h-1.5 w-2/5')} />
          </div>
        </div>
      )
    case 'action-bar':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full items-center justify-between p-3">
            <div className="flex items-center gap-1.5">
              <span className="border-border bg-background text-muted-foreground grid size-5 place-items-center rounded-md border">
                <Paperclip className="size-2.5" />
              </span>
              <span className="border-border bg-background text-muted-foreground grid size-5 place-items-center rounded-md border">
                <Mic className="size-2.5" />
              </span>
            </div>
            <span className="bg-foreground inline-flex size-6 items-center justify-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5">
              <ArrowUp className="text-background size-3" />
            </span>
          </div>
        </div>
      )
    case 'status-bar':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full flex-col justify-center p-3">
            <div className="border-border bg-background flex items-center gap-2 rounded-md border px-2 py-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
              <span className={cn(LINE, 'h-1.5 w-10')} />
              <span className="text-muted-foreground ml-auto text-[10px] tabular-nums">1.2k</span>
            </div>
          </div>
        </div>
      )
    case 'compact':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full items-center p-3">
            <div className="border-border bg-background flex h-7 w-3/5 items-center gap-2 rounded-full border px-3 transition-[width] duration-300 ease-out group-hover:w-full">
              <span className={cn(LINE, 'h-1.5 flex-1')} />
              <span className="bg-foreground/80 inline-flex size-4 shrink-0 items-center justify-center rounded-full">
                <ArrowRight className="text-background size-2.5 -rotate-90" />
              </span>
            </div>
          </div>
        </div>
      )
    case 'chat':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full flex-col justify-center gap-1.5 p-3">
            <div className="bg-muted flex max-w-[72%] flex-col gap-1 self-start rounded-2xl rounded-bl-sm px-2.5 py-1.5">
              <span className={cn(LINE, 'h-1 w-12')} />
            </div>
            <div className="bg-foreground/85 flex max-w-[72%] flex-col gap-1 self-end rounded-2xl rounded-br-sm px-2.5 py-1.5">
              <span className="bg-background/70 h-1 w-10 rounded-full" />
            </div>
            {/* typing indicator slides in on hover */}
            <div className="bg-muted flex items-center gap-0.5 self-start rounded-2xl rounded-bl-sm px-2.5 py-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="bg-foreground/40 size-1 rounded-full" />
              <span className="bg-foreground/40 size-1 rounded-full" />
              <span className="bg-foreground/40 size-1 rounded-full" />
            </div>
          </div>
        </div>
      )
    case 'inspector':
      return (
        <div className={COVER_SHELL}>
          <div className="flex w-full flex-col justify-center gap-1.5 p-3 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-violet-500/15 px-1 text-[9px] text-violet-600 dark:text-violet-400">
                change
              </span>
              <span className={cn(LINE, 'h-1 flex-1')} />
            </div>
            <div className="flex items-center gap-1.5 transition-transform duration-200 group-hover:translate-x-0.5">
              <span className="rounded bg-emerald-500/15 px-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                submit
              </span>
              <span className={cn(LINE, 'h-1 w-3/5')} />
            </div>
          </div>
        </div>
      )
  }
}

const CARD_CLASS =
  'group border-border bg-card hover:border-foreground/25 flex flex-col gap-3 overflow-hidden rounded-2xl border p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lg'

function CardFace({ c }: { c: ComponentCard }) {
  const Icon = c.icon
  return (
    <Link href={c.href} className={cn(CARD_CLASS, 'h-full')}>
      <Cover id={c.id} />
      <div className="flex flex-1 flex-col px-2 pt-1 pb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="text-foreground/70 group-hover:text-foreground size-3.5 shrink-0 transition-colors" />
          <span className="truncate text-sm font-semibold">{c.title}</span>
        </div>
        <span className="text-muted-foreground mt-1 line-clamp-2 min-h-10 text-xs leading-relaxed">
          {c.desc}
        </span>
        <span className="text-muted-foreground group-hover:text-foreground mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium transition-colors">
          Explore
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

// One desktop column: an entrance fade plus a gentle, per-column scroll drift
// so the row moves as you scroll rather than sitting flat like a static deck.
// The drift is a CSS scroll-driven animation (`.cascade-drift` in globals.css)
// — free of any scroll-listener JS, and a no-op in browsers without scroll
// timelines or with reduced motion, which just show the static offset shelf.
function CascadeColumn({ c, index }: { c: ComponentCard; index: number }) {
  // Alternate drift direction and vary the range a touch so columns separate
  // in depth instead of moving as one block.
  const dir = index % 2 === 0 ? 1 : -1
  const range = 22 + (index % 3) * 8

  return (
    <Reveal
      lift={false}
      delay={index * 0.05}
      className="min-w-0 flex-1"
      style={{ marginTop: OFFSETS[index] ?? 0 }}>
      <div className="cascade-drift" style={{ '--drift': `${dir * range}px` } as CSSProperties}>
        <CardFace c={c} />
      </div>
    </Reveal>
  )
}

export function ComponentsCascade() {
  return (
    <>
      {/* Desktop — staggered, drifting shelf of preview cards. */}
      <div className="hidden items-start gap-4 lg:flex">
        {COMPONENTS.map((c, i) => (
          <CascadeColumn key={c.id} c={c} index={i} />
        ))}
      </div>

      {/* Mobile / tablet — plain responsive grid. Per-card reveals (not a group
          stagger) so the cascade still lands when the grid is one tall column. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {COMPONENTS.map((c) => (
          <Reveal key={c.id} className="h-full">
            <CardFace c={c} />
          </Reveal>
        ))}
      </div>
    </>
  )
}

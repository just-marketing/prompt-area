'use client'

import Link from 'next/link'
import {
  ArrowRight,
  TextCursorInput,
  PanelBottom,
  Info,
  Minimize2,
  MessagesSquare,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'

type ComponentCard = {
  href: string
  title: string
  desc: string
  icon: LucideIcon
}

const COMPONENTS: ComponentCard[] = [
  {
    href: '/docs/components/prompt-area',
    title: 'Prompt Area',
    desc: 'The core rich-text input.',
    icon: TextCursorInput,
  },
  {
    href: '/docs/components/action-bar',
    title: 'Action Bar',
    desc: 'Toolbar with attach, mic, send.',
    icon: PanelBottom,
  },
  {
    href: '/docs/components/status-bar',
    title: 'Status Bar',
    desc: 'Contextual info bar.',
    icon: Info,
  },
  {
    href: '/docs/components/compact-prompt-area',
    title: 'Compact Prompt Area',
    desc: 'Pill-shaped expanding input.',
    icon: Minimize2,
  },
  {
    href: '/docs/components/chat-prompt-layout',
    title: 'Chat Prompt Layout',
    desc: 'Full-height chat layout.',
    icon: MessagesSquare,
  },
  {
    href: '/docs/inspector',
    title: 'Inspector',
    desc: 'Live event & API playground.',
    icon: Activity,
  },
]

// Per-column lift (px) for the desktop cascade. The row steps up toward the
// right so it reads as a deliberate, shingled deck rather than a flat grid;
// the gap each card leaves at the bottom is filled with a hatched placeholder.
const LIFT_STEP = 14
const COL_HEIGHT = 360
const CARD_HEIGHT = 224

function CardFace({ c }: { c: ComponentCard }) {
  const Icon = c.icon
  return (
    <span className="flex h-full flex-col p-5">
      <Icon className="text-foreground/70 group-hover:text-foreground size-5 shrink-0 transition-colors" />
      <span className="mt-4 text-sm leading-tight font-semibold">{c.title}</span>
      <span className="text-muted-foreground mt-1.5 line-clamp-3 text-xs leading-relaxed">
        {c.desc}
      </span>
      <ArrowRight className="text-muted-foreground group-hover:text-foreground mt-auto size-4 shrink-0 transition-all group-hover:translate-x-0.5" />
    </span>
  )
}

const CARD_CLASS =
  'group border-border bg-card hover:border-foreground/20 block overflow-hidden rounded-xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md'

export function ComponentsCascade() {
  return (
    <>
      {/* Desktop — shingled depth cascade. Each column lifts its card by a
          stepped offset and fills the space beneath with a hatched placeholder
          so the row reads as a layered deck. */}
      <RevealGroup trigger="scroll" stagger={0.06} className="hidden items-stretch gap-3 lg:flex">
        {COMPONENTS.map((c, i) => {
          const lift = (COMPONENTS.length - 1 - i) * LIFT_STEP
          return (
            <RevealItem key={c.href} className="flex-1">
              <div className="flex flex-col" style={{ height: COL_HEIGHT }}>
                <Link
                  href={c.href}
                  style={{ marginTop: lift, height: CARD_HEIGHT }}
                  className={CARD_CLASS}>
                  <CardFace c={c} />
                </Link>
                {/* Hatched "empty slot" filling the rest of the column to a
                    shared baseline — the texture that sells the depth. */}
                <div
                  aria-hidden
                  className="bg-hatch border-border/60 mt-3 min-h-0 flex-1 rounded-xl border"
                />
              </div>
            </RevealItem>
          )
        })}
      </RevealGroup>

      {/* Mobile / tablet — plain responsive grid. Per-card reveals (not a group
          stagger) so the cascade still lands when the grid is one tall column. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {COMPONENTS.map((c) => (
          <Reveal key={c.href} className="h-full">
            <Link href={c.href} className={cn(CARD_CLASS, 'h-full')}>
              <CardFace c={c} />
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  )
}

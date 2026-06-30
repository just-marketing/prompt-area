'use client'

import {
  AtSign,
  Type,
  RotateCcw,
  Paperclip,
  PanelBottom,
  Moon,
  Keyboard,
  Puzzle,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

// Shared motion vocabulary with the page's Reveal primitive: the same
// "ease-out-expo" settle so cards glide in and decelerate, reading as premium.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const DURATION = 0.7
// How far off-screen a card starts. The clip wrapper hides this travel, so the
// card appears to enter from the section's edge.
const OFFSET = 220

const FEATURES = [
  {
    icon: AtSign,
    title: 'Trigger-Based Chips',
    description:
      'Type @, /, or # to invoke mentions, commands, and tags that resolve into structured chips.',
  },
  {
    icon: Type,
    title: 'Inline Markdown',
    description:
      'Bold, italic, lists, and auto-linked URLs render live as you type. Keyboard shortcuts included.',
  },
  {
    icon: RotateCcw,
    title: 'Undo & Redo',
    description:
      'Full history stack with Ctrl+Z / Ctrl+Shift+Z. Every action is tracked and reversible.',
  },
  {
    icon: Paperclip,
    title: 'File & Image Attachments',
    description:
      'Paste screenshots or attach files with thumbnails, loading states, and remove buttons built in.',
  },
  {
    icon: PanelBottom,
    title: 'Action Bar',
    description:
      'A toolbar component with left and right slots that pairs with PromptArea for a complete chat input.',
  },
  {
    icon: Moon,
    title: 'Dark Mode Ready',
    description:
      'Full light and dark theme support via CSS variables. Adapts automatically to your app\u2019s theme.',
  },
  {
    icon: Keyboard,
    title: 'Accessible by Default',
    description:
      'ARIA labels, keyboard navigation, screen reader announcements, and focus management built in.',
  },
  {
    icon: Puzzle,
    title: 'shadcn Registry',
    description:
      'Install with one command. No extra dependencies. Copy-paste friendly and fully customizable.',
  },
]

export function FeaturesGrid() {
  const reduce = useReducedMotion()

  // Cards converge from the section's edges to the center, row by row, as you
  // scroll: the left column slides in from the left, the right column from the
  // right. Each card triggers its own scroll reveal (rather than one group
  // stagger), so the two cards sharing a row — which cross the trigger line at
  // the same moment — animate together and meet in the middle. When the grid
  // collapses to a single column on mobile, the alternating left/right origin
  // turns into a gentle zig-zag instead of breaking.
  const cardClass = 'flex items-start gap-3 rounded-lg border p-4'

  return (
    // overflow-x-clip so a card's off-screen starting position never adds a
    // horizontal scrollbar while it travels in.
    <div className="overflow-x-clip">
      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature, i) => {
          const inner = (
            <>
              <div className="bg-muted shrink-0 rounded-md p-2">
                <feature.icon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{feature.title}</div>
                <div className="text-muted-foreground text-xs">{feature.description}</div>
              </div>
            </>
          )

          if (reduce) {
            return (
              <div key={feature.title} className={cardClass}>
                {inner}
              </div>
            )
          }

          // Even index → left column → enter from the left; odd → from the right.
          const fromLeft = i % 2 === 0
          return (
            <motion.div
              key={feature.title}
              className={cardClass}
              initial={{ opacity: 0, x: fromLeft ? -OFFSET : OFFSET }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
              transition={{ duration: DURATION, ease: EASE }}>
              {inner}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

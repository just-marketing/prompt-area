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
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex items-start gap-3 rounded-lg border p-4">
          <div className="bg-muted shrink-0 rounded-md p-2">
            <feature.icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{feature.title}</div>
            <div className="text-muted-foreground text-xs">{feature.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

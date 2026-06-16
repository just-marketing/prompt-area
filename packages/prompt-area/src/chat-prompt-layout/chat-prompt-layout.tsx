'use client'

import { cn } from '@/lib/utils'
import type { ChatPromptLayoutProps } from './types'
import { useScrollObserver } from './use-scroll-observer'

const NAV_BUTTON_CLASS =
  'pointer-events-auto rounded-full border bg-background p-2 shadow-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors animate-in fade-in-0 zoom-in-95 duration-150'

type IconProps = { className?: string }

/** Shared SVG wrapper matching the lucide icon defaults (no dependency). */
function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}>
      {children}
    </svg>
  )
}

const ArrowUp = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Svg>
)
const ArrowDown = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </Svg>
)

/**
 * ChatPromptLayout - A full-height chat layout with scrollable messages
 * and a bottom-anchored prompt slot.
 *
 * Pass chat messages as `children` and the prompt area via the `prompt`
 * prop. Contextual scroll buttons appear when the user scrolls away
 * from the top or bottom of the messages area.
 *
 * @example
 * ```tsx
 * <ChatPromptLayout
 *   className="h-[600px]"
 *   prompt={
 *     <div className="border-t p-4">
 *       <PromptArea ... />
 *       <ActionBar ... />
 *     </div>
 *   }
 * >
 *   {messages.map(msg => <ChatBubble key={msg.id} {...msg} />)}
 * </ChatPromptLayout>
 * ```
 */
export function ChatPromptLayout({
  children,
  prompt,
  className,
  'aria-label': ariaLabel,
  'data-test-id': dataTestId,
  ref,
}: ChatPromptLayoutProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { scrollRef, showGoToTop, showGoToBottom, scrollToTop, scrollToBottom } =
    useScrollObserver()

  return (
    <div
      ref={ref}
      role="region"
      aria-label={ariaLabel ?? 'Chat layout'}
      data-test-id={dataTestId}
      className={cn('chat-prompt-layout', 'flex h-full flex-col', className)}>
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        {children}

        <div className="pointer-events-none sticky bottom-4 flex justify-end gap-2 px-4 pb-2">
          {showGoToTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className={NAV_BUTTON_CLASS}
              aria-label="Scroll to top">
              <ArrowUp className="size-4" />
            </button>
          )}
          {showGoToBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className={NAV_BUTTON_CLASS}
              aria-label="Scroll to bottom">
              <ArrowDown className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0">{prompt}</div>
    </div>
  )
}

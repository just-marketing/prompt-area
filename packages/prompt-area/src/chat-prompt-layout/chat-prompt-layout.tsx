'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatPromptLayoutProps } from './types'
import { useScrollObserver } from './use-scroll-observer'

const NAV_BUTTON_CLASS =
  'pointer-events-auto rounded-full border bg-background p-2 shadow-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'

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
          <AnimatePresence>
            {showGoToTop && (
              <motion.button
                key="go-to-top"
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={scrollToTop}
                className={NAV_BUTTON_CLASS}
                aria-label="Scroll to top">
                <ArrowUp className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showGoToBottom && (
              <motion.button
                key="go-to-bottom"
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={scrollToBottom}
                className={NAV_BUTTON_CLASS}
                aria-label="Scroll to bottom">
                <ArrowDown className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="shrink-0">{prompt}</div>
    </div>
  )
}

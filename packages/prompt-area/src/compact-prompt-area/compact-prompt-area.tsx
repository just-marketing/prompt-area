'use client'

import { useCallback, useImperativeHandle, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { BLUR_DELAY_MS } from '@/registry/new-york/blocks/prompt-area/use-prompt-area-events'
import type { PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'
import type { CompactPromptAreaProps } from './types'

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

const Plus = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Svg>
)
const ArrowUp = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Svg>
)

/**
 * Shared timing for the collapse/expand morph. The same duration + easing is
 * used by the container (border-radius), the editor region (padding) and the
 * inner editor's `min-height`, so every part of the box eases in lock-step.
 * `prefers-reduced-motion` switches the change instantly.
 */
const MORPH_TIMING =
  'duration-[240ms] ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none'

/**
 * CompactPromptArea – A pill-shaped prompt input that sits on a single row
 * and expands downward on focus.
 *
 * - Left: circular plus button
 * - Middle: PromptArea text input (expands down when focused)
 * - Right: optional slot + circular submit button
 *
 * Reuses PromptArea internally with autoGrow enabled.
 *
 * @example
 * ```tsx
 * <CompactPromptArea
 *   value={segments}
 *   onChange={setSegments}
 *   placeholder="Ask anything..."
 *   onSubmit={handleSubmit}
 *   onPlusClick={() => setMenuOpen(true)}
 *   beforeSubmitSlot={<button aria-label="Voice"><Mic className="size-4" /></button>}
 * />
 * ```
 */
export function CompactPromptArea({
  value,
  onChange,
  triggers,
  placeholder,
  disabled = false,
  markdown,
  onSubmit,
  onEscape,
  onChipClick,
  onChipAdd,
  onChipDelete,
  onPaste,
  images,
  onImagePaste,
  onImageRemove,
  files,
  onFileRemove,
  plusButtonIcon,
  onPlusClick,
  submitButtonIcon,
  beforeSubmitSlot,
  maxHeight = 320,
  className,
  'aria-label': ariaLabel,
  'data-test-id': dataTestId,
  ref,
}: CompactPromptAreaProps & { ref?: React.Ref<PromptAreaHandle> }) {
  const promptRef = useRef<PromptAreaHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Forward a stable, null-safe handle that proxies to the inner PromptArea.
  // Reading `promptRef.current` lazily on each call avoids both a non-null
  // assertion and capturing a stale snapshot at mount time.
  useImperativeHandle(
    ref,
    () => ({
      focus: () => promptRef.current?.focus(),
      blur: () => promptRef.current?.blur(),
      insertChip: (chip) => promptRef.current?.insertChip(chip),
      getPlainText: () => promptRef.current?.getPlainText() ?? '',
      clear: () => promptRef.current?.clear(),
      setText: (text) => promptRef.current?.setText(text),
      appendText: (text) => promptRef.current?.appendText(text),
      getCursorPosition: () => promptRef.current?.getCursorPosition() ?? null,
      setCursorPosition: (offset) => promptRef.current?.setCursorPosition(offset),
      setCursorToEnd: () => promptRef.current?.setCursorToEnd(),
      getSelection: () => promptRef.current?.getSelection() ?? null,
      setSelection: (start, end) => promptRef.current?.setSelection(start, end),
    }),
    [],
  )

  const isEmpty =
    value.length === 0 || (value.length === 1 && value[0].type === 'text' && value[0].text === '')

  const isExpanded = isFocused || !isEmpty

  const handleContainerFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleContainerBlur = useCallback(() => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsFocused(false)
      }
    }, BLUR_DELAY_MS)
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit?.(value)
  }, [onSubmit, value])

  return (
    <div
      ref={containerRef}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      aria-label={ariaLabel}
      data-test-id={dataTestId}
      data-expanded={isExpanded || undefined}
      className={cn(
        'compact-prompt-area relative isolate overflow-hidden',
        'bg-background border',
        // Only border-radius / colour / shadow tween here — the box's height
        // is driven by the editor region below, so it eases along with it.
        'transition-[border-radius,box-shadow,border-color]',
        MORPH_TIMING,
        isExpanded ? 'rounded-2xl shadow-sm' : 'rounded-3xl',
        className,
      )}>
      {/* Editor region – the only in-flow child, so its height + padding drive
          the container's height. Padding eases between a single inset row
          (collapsed) and a roomy box that reserves space for the pinned
          toolbar (expanded), giving a smooth, tween-able morph. */}
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'min-w-0 cursor-text',
          'transition-[padding]',
          MORPH_TIMING,
          // Collapsed: leave room on one row for the pinned plus (left) and the
          // controls (right) — wider when a slot sits before the submit button.
          // Expanded: roomy box with bottom space reserved for the toolbar.
          isExpanded
            ? 'pb-14 pl-5 pr-5 pt-4'
            : cn('py-3 pl-[3.25rem]', beforeSubmitSlot ? 'pr-[5.5rem]' : 'pr-[3.25rem]'),
        )}>
        <PromptArea
          ref={promptRef}
          value={value}
          onChange={onChange}
          triggers={triggers}
          placeholder={placeholder}
          disabled={disabled}
          markdown={markdown}
          onSubmit={handleSubmit}
          onEscape={onEscape}
          onChipClick={onChipClick}
          onChipAdd={onChipAdd}
          onChipDelete={onChipDelete}
          onPaste={onPaste}
          images={images}
          onImagePaste={onImagePaste}
          onImageRemove={onImageRemove}
          files={files}
          onFileRemove={onFileRemove}
          autoGrow
          minHeight={isExpanded ? 48 : 24}
          maxHeight={maxHeight}
        />
      </div>

      {/* Plus button – pinned bottom-left in BOTH states (no teleport). As the
          box grows it simply glides down with the bottom edge. */}
      <button
        type="button"
        onClick={onPlusClick}
        disabled={disabled}
        className={cn(
          'absolute bottom-1.5 left-1.5 z-10 flex size-9 shrink-0 items-center justify-center',
          'rounded-xl transition-colors',
          'bg-muted text-muted-foreground',
          'hover:bg-accent hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        aria-label="Add attachment">
        {plusButtonIcon ?? <Plus className="size-4" />}
      </button>

      {/* Right controls – pinned bottom-right in BOTH states (slot + submit). */}
      <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1.5">
        {beforeSubmitSlot}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isEmpty}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label="Send message">
          {submitButtonIcon ?? <ArrowUp className="size-4" />}
        </button>
      </div>
    </div>
  )
}

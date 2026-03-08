'use client'

import { useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Plus, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { BLUR_DELAY_MS } from '@/registry/new-york/blocks/prompt-area/use-prompt-area-events'
import type { PromptAreaHandle } from '@/registry/new-york/blocks/prompt-area/types'
import type { CompactPromptAreaProps } from './types'

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

  useImperativeHandle(ref, () => promptRef.current!, [])

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
      className={cn(
        'compact-prompt-area',
        'bg-background border transition-all duration-200 ease-out',
        isExpanded ? 'rounded-2xl' : 'rounded-full',
        className,
      )}>
      <div className={cn('flex', isExpanded ? 'flex-col' : 'items-center')}>
        {/* Prompt area region */}
        <div
          className={cn('min-w-0 flex-1', isExpanded ? 'px-4 pt-3 pb-1' : 'overflow-hidden px-1')}
          onClick={() => promptRef.current?.focus()}>
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

        {/* Button bar */}
        <div
          className={cn(
            'flex shrink-0 items-center justify-between',
            isExpanded ? 'px-2 pt-1 pb-2' : 'gap-1 pr-1',
          )}>
          {/* Plus button – circular */}
          <button
            type="button"
            onClick={onPlusClick}
            disabled={disabled}
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full transition-colors',
              'bg-muted text-muted-foreground size-8',
              'hover:bg-accent hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            aria-label="Add attachment">
            {plusButtonIcon ?? <Plus className="size-4" />}
          </button>

          {/* Right side: slot + submit */}
          <div className="flex items-center gap-1">
            {beforeSubmitSlot}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || isEmpty}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full transition-colors',
                'bg-primary text-primary-foreground size-8',
                'hover:bg-primary/90',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
              aria-label="Send message">
              {submitButtonIcon ?? <ArrowUp className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

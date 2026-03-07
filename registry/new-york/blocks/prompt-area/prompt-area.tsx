'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PromptAreaProps, PromptAreaHandle } from './types'
import { usePromptArea } from './use-prompt-area'
import { BLUR_DELAY_MS } from './use-prompt-area-events'
import { TriggerPopover } from './trigger-popover'
import { AnimatedPlaceholder } from './animated-placeholder'
import { ImageStrip } from './image-strip'
import { FileStrip } from './file-strip'

/**
 * PromptArea - A lightweight rich text input with trigger support.
 *
 * Uses contentEditable to support inline chips (immutable pills) for
 * mentions, commands, and other triggered tokens. Each trigger character
 * can be configured to show a dropdown or fire a callback.
 *
 * @example
 * ```tsx
 * const [segments, setSegments] = useState<Segment[]>([])
 *
 * <PromptArea
 *   value={segments}
 *   onChange={setSegments}
 *   triggers={[
 *     { char: '@', position: 'any', mode: 'dropdown', onSearch: searchUsers },
 *     { char: '/', position: 'start', mode: 'dropdown', onSearch: searchCommands },
 *     { char: '#', position: 'any', mode: 'dropdown', onSearch: searchTags },
 *   ]}
 *   placeholder="Type a message..."
 *   onSubmit={handleSubmit}
 *   autoGrow
 * />
 * ```
 */
export const PromptArea = forwardRef<PromptAreaHandle, PromptAreaProps>(
  (
    {
      value,
      onChange,
      triggers,
      placeholder,
      className,
      disabled = false,
      markdown,
      onSubmit,
      onEscape,
      onChipClick,
      onChipAdd,
      onChipDelete,
      onLinkClick,
      onPaste,
      onUndo,
      onRedo,
      minHeight = 80,
      maxHeight,
      autoFocus = false,
      autoGrow = false,
      'aria-label': ariaLabel,
      'data-test-id': dataTestId,
      images = [],
      imagePosition = 'above',
      onImagePaste,
      onImageRemove,
      onImageClick,
      files = [],
      filePosition = 'above',
      onFileRemove,
      onFileClick,
    },
    ref,
  ) => {
    const {
      editorRef,
      activeTrigger,
      suggestions,
      suggestionsLoading,
      selectedSuggestionIndex,
      handleInput,
      handleKeyDown,
      handleClick,
      selectSuggestion,
      dismissTrigger,
      handle,
      triggerRect,
      eventHandlers,
    } = usePromptArea({
      value,
      onChange,
      triggers,
      onSubmit,
      onEscape,
      onChipClick,
      onChipAdd,
      onChipDelete,
      onLinkClick,
      onPaste,
      onUndo,
      onRedo,
      onImagePaste,
      markdown,
    })

    // Expose imperative handle via ref
    useImperativeHandle(ref, () => handle, [handle])

    // Auto-focus on mount
    useEffect(() => {
      if (autoFocus) {
        editorRef.current?.focus()
      }
    }, [autoFocus, editorRef])

    // -----------------------------------------------------------------------
    // Auto-grow: expand on focus/input, shrink on blur
    // -----------------------------------------------------------------------

    const [isFocused, setIsFocused] = useState(false)
    const [editorHeight, setEditorHeight] = useState<number | undefined>(undefined)

    const syncHeight = useCallback(() => {
      const el = editorRef.current
      if (!el) return
      // Temporarily set height to auto so scrollHeight reflects true content height
      el.style.height = 'auto'
      const contentHeight = el.scrollHeight
      el.style.height = `${contentHeight}px`
      setEditorHeight(contentHeight)
    }, [editorRef])

    const handleFocus = useCallback(() => {
      if (!autoGrow) return
      setIsFocused(true)
      syncHeight()
    }, [autoGrow, syncHeight])

    const handleBlurWithShrink = useCallback(() => {
      eventHandlers.onBlur()
      if (!autoGrow) return
      setTimeout(() => {
        const editor = editorRef.current
        if (!editor) return
        // Only shrink if focus truly left the component
        const activeEl = document.activeElement
        if (activeEl && editor.parentElement?.contains(activeEl)) return
        setIsFocused(false)
        setEditorHeight(undefined)
      }, BLUR_DELAY_MS)
    }, [eventHandlers, autoGrow, editorRef])

    const handleInputWithGrow = useCallback(() => {
      handleInput()
      if (autoGrow && isFocused) {
        syncHeight()
      }
    }, [handleInput, autoGrow, isFocused, syncHeight])

    // Re-measure on value changes (chip insertion, undo/redo, programmatic updates)
    useEffect(() => {
      if (autoGrow && isFocused) {
        requestAnimationFrame(() => syncHeight())
      }
    }, [value, autoGrow, isFocused, syncHeight])

    // -----------------------------------------------------------------------
    // Compute editor style
    // -----------------------------------------------------------------------

    const editorStyle = useMemo((): React.CSSProperties => {
      if (!autoGrow) {
        return {
          minHeight: `${minHeight}px`,
          ...(maxHeight ? { maxHeight: `${maxHeight}px`, overflowY: 'auto' as const } : {}),
        }
      }
      return {
        height: isFocused && editorHeight ? `${editorHeight}px` : `${minHeight}px`,
        minHeight: `${minHeight}px`,
        maxHeight: '70dvh',
        overflowY: 'auto',
        transition: 'height 150ms ease-out',
      }
    }, [autoGrow, minHeight, maxHeight, isFocused, editorHeight])

    const isEmpty =
      value.length === 0 || (value.length === 1 && value[0].type === 'text' && value[0].text === '')

    const imageStrip =
      images.length > 0 ? (
        <ImageStrip
          images={images}
          onRemove={onImageRemove}
          onClick={onImageClick}
          className={imagePosition === 'above' ? 'pb-2' : 'pt-2'}
        />
      ) : null

    const fileStrip =
      files.length > 0 ? (
        <FileStrip
          files={files}
          onRemove={onFileRemove}
          onClick={onFileClick}
          className={filePosition === 'above' ? 'pb-2' : 'pt-2'}
        />
      ) : null

    return (
      <div className={cn('prompt-area-container relative', className)}>
        {imagePosition === 'above' && imageStrip}
        {filePosition === 'above' && fileStrip}

        {/* Editor + placeholder wrapper */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-label={ariaLabel ?? 'Text input'}
            aria-multiline="true"
            aria-disabled={disabled}
            data-test-id={dataTestId}
            className={cn(
              'prompt-area-editor',
              'w-full min-w-0 break-words whitespace-pre-wrap outline-none',
              'text-sm leading-relaxed',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            style={editorStyle}
            onFocus={handleFocus}
            onInput={autoGrow ? handleInputWithGrow : handleInput}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            onPaste={eventHandlers.onPaste}
            onCopy={eventHandlers.onCopy}
            onCut={eventHandlers.onCut}
            onDrop={eventHandlers.onDrop}
            onDragOver={eventHandlers.onDragOver}
            onCompositionStart={eventHandlers.onCompositionStart}
            onCompositionEnd={eventHandlers.onCompositionEnd}
            onBlur={autoGrow ? handleBlurWithShrink : eventHandlers.onBlur}
          />

          {/* Placeholder overlay */}
          {isEmpty &&
            placeholder &&
            (Array.isArray(placeholder) ? (
              <AnimatedPlaceholder texts={placeholder} />
            ) : (
              <div
                className="text-muted-foreground pointer-events-none absolute top-0 left-0 text-sm leading-relaxed select-none"
                aria-hidden="true">
                {placeholder}
              </div>
            ))}
        </div>

        {filePosition === 'below' && fileStrip}
        {imagePosition === 'below' && imageStrip}

        {/* Trigger suggestion popover */}
        {activeTrigger && activeTrigger.config.mode === 'dropdown' && (
          <TriggerPopover
            suggestions={suggestions}
            loading={suggestionsLoading}
            selectedIndex={selectedSuggestionIndex}
            onSelect={selectSuggestion}
            onDismiss={dismissTrigger}
            triggerRect={triggerRect}
            triggerChar={activeTrigger.config.char}
          />
        )}
      </div>
    )
  },
)

PromptArea.displayName = 'PromptArea'

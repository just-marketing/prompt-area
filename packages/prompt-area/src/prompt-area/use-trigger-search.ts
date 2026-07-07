'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TriggerConfig, TriggerSuggestion } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseTriggerSearchOptions = {
  /**
   * Called when a search settles (after abort/version checks): with the
   * result count on success, or 'error' on a non-abort failure. Used by
   * `usePromptArea` for analytics; sync and async searches both report.
   * Pass a stable callback — `search` re-creates when it changes.
   */
  onSettled?: (query: string, config: TriggerConfig, result: number | 'error') => void
}

type UseTriggerSearchReturn = {
  suggestions: TriggerSuggestion[]
  suggestionsLoading: boolean
  suggestionsError: string | null
  /** Run a search for the given query using the trigger's onSearch config. */
  search: (query: string, config: TriggerConfig) => void
  /** Cancel any in-flight search and reset state. */
  reset: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages async trigger search lifecycle: debouncing, AbortController
 * cancellation, race-condition prevention, loading/error state.
 *
 * Extracted from `usePromptArea` so the main hook stays focused on
 * editing concerns while this hook owns the data-fetching side.
 */
export function useTriggerSearch(options?: UseTriggerSearchOptions): UseTriggerSearchReturn {
  const [suggestions, setSuggestions] = useState<TriggerSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)

  const onSettled = options?.onSettled

  // Version counter – belt-and-suspenders alongside AbortController
  const searchVersion = useRef(0)
  // AbortController for cancelling in-flight async searches
  const abortController = useRef<AbortController | null>(null)
  // Debounce timer for search queries
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    abortController.current?.abort()
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSuggestions([])
    setSuggestionsLoading(false)
    setSuggestionsError(null)
  }, [])

  const search = useCallback(
    (query: string, config: TriggerConfig) => {
      if (!config.onSearch) return

      // Cancel any previous in-flight request and pending debounce
      abortController.current?.abort()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      setSuggestionsLoading(true)
      setSuggestionsError(null)
      searchVersion.current++
      const version = searchVersion.current

      const controller = new AbortController()
      abortController.current = controller
      const { onSearch, onSearchError, searchDebounceMs } = config

      const executeSearch = () => {
        const result = onSearch(query, { signal: controller.signal })

        if (result instanceof Promise) {
          void result.then(
            (items) => {
              if (controller.signal.aborted || searchVersion.current !== version) return
              setSuggestions(items)
              setSuggestionsLoading(false)
              onSettled?.(query, config, items.length)
            },
            (error: unknown) => {
              if (controller.signal.aborted || searchVersion.current !== version) return
              // Silently ignore AbortError (expected when superseded)
              if (error instanceof DOMException && error.name === 'AbortError') return
              setSuggestionsError(error instanceof Error ? error.message : 'Search failed')
              setSuggestionsLoading(false)
              onSearchError?.(error)
              onSettled?.(query, config, 'error')
            },
          )
        } else {
          setSuggestions(result)
          setSuggestionsLoading(false)
          onSettled?.(query, config, result.length)
        }
      }

      // Debounce subsequent searches but fire immediately for the initial empty query
      if (searchDebounceMs && searchDebounceMs > 0 && query.length > 0) {
        debounceTimer.current = setTimeout(executeSearch, searchDebounceMs)
      } else {
        executeSearch()
      }
    },
    [onSettled],
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortController.current?.abort()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return {
    suggestions,
    suggestionsLoading,
    suggestionsError,
    search,
    reset,
  }
}

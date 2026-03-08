import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTriggerSearch } from '../use-trigger-search'
import type { TriggerConfig, TriggerSuggestion } from '../types'

describe('useTriggerSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useTriggerSearch())

    expect(result.current.suggestions).toEqual([])
    expect(result.current.suggestionsLoading).toBe(false)
    expect(result.current.suggestionsError).toBeNull()
    expect(typeof result.current.search).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  // -------------------------------------------------------------------------
  // Sync search
  // -------------------------------------------------------------------------

  describe('synchronous search', () => {
    it('returns results immediately for sync onSearch', () => {
      const suggestions: TriggerSuggestion[] = [
        { value: 'alice', label: 'Alice' },
        { value: 'bob', label: 'Bob' },
      ]
      const onSearch = vi.fn(() => suggestions)
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('al', config)
      })

      expect(onSearch).toHaveBeenCalledWith('al', { signal: expect.any(AbortSignal) })
      expect(result.current.suggestions).toEqual(suggestions)
      expect(result.current.suggestionsLoading).toBe(false)
    })

    it('does nothing when config has no onSearch', () => {
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('query', config)
      })

      expect(result.current.suggestions).toEqual([])
      expect(result.current.suggestionsLoading).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Async search
  // -------------------------------------------------------------------------

  describe('asynchronous search', () => {
    it('sets loading to true during async search', async () => {
      let resolvePromise: (value: TriggerSuggestion[]) => void
      const onSearch = vi.fn(
        () =>
          new Promise<TriggerSuggestion[]>((resolve) => {
            resolvePromise = resolve
          }),
      )

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('al', config)
      })

      expect(result.current.suggestionsLoading).toBe(true)

      const suggestions: TriggerSuggestion[] = [{ value: 'alice', label: 'Alice' }]
      await act(async () => {
        resolvePromise!(suggestions)
      })

      expect(result.current.suggestions).toEqual(suggestions)
      expect(result.current.suggestionsLoading).toBe(false)
    })

    it('sets error on async search failure', async () => {
      const onSearchError = vi.fn()
      let rejectPromise: (reason: Error) => void
      const onSearch = vi.fn(
        () =>
          new Promise<TriggerSuggestion[]>((_, reject) => {
            rejectPromise = reject
          }),
      )

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
        onSearchError,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('al', config)
      })

      expect(result.current.suggestionsLoading).toBe(true)

      await act(async () => {
        rejectPromise!(new Error('Network error'))
      })

      expect(result.current.suggestionsError).toBe('Network error')
      expect(result.current.suggestionsLoading).toBe(false)
      expect(onSearchError).toHaveBeenCalled()
    })

    it('sets generic error message for non-Error rejections', async () => {
      let rejectPromise: (reason: unknown) => void
      const onSearch = vi.fn(
        () =>
          new Promise<TriggerSuggestion[]>((_, reject) => {
            rejectPromise = reject
          }),
      )

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('al', config)
      })

      await act(async () => {
        rejectPromise!('some string error')
      })

      expect(result.current.suggestionsError).toBe('Search failed')
    })

    it('ignores AbortError from async search', async () => {
      let rejectPromise: (reason: unknown) => void
      const onSearch = vi.fn(
        () =>
          new Promise<TriggerSuggestion[]>((_, reject) => {
            rejectPromise = reject
          }),
      )

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('al', config)
      })

      const abortError = new DOMException('The operation was aborted.', 'AbortError')
      await act(async () => {
        rejectPromise!(abortError)
      })

      // Should not set error
      expect(result.current.suggestionsError).toBeNull()
      // Loading stays true because abort handler doesn't update loading
      expect(result.current.suggestionsLoading).toBe(true)
    })

    it('ignores results from superseded searches (race condition)', async () => {
      let resolveFirst: (value: TriggerSuggestion[]) => void
      let resolveSecond: (value: TriggerSuggestion[]) => void

      const onSearch = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<TriggerSuggestion[]>((resolve) => {
              resolveFirst = resolve
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<TriggerSuggestion[]>((resolve) => {
              resolveSecond = resolve
            }),
        )

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      // Start first search
      act(() => {
        result.current.search('a', config)
      })

      // Start second search (supersedes first)
      act(() => {
        result.current.search('al', config)
      })

      const secondResults: TriggerSuggestion[] = [{ value: 'alice', label: 'Alice' }]
      await act(async () => {
        resolveSecond!(secondResults)
      })

      expect(result.current.suggestions).toEqual(secondResults)

      // First search resolves late - should be ignored
      const firstResults: TriggerSuggestion[] = [
        { value: 'adam', label: 'Adam' },
        { value: 'alice', label: 'Alice' },
      ]
      await act(async () => {
        resolveFirst!(firstResults)
      })

      // Should still show second results
      expect(result.current.suggestions).toEqual(secondResults)
    })
  })

  // -------------------------------------------------------------------------
  // Debouncing
  // -------------------------------------------------------------------------

  describe('debouncing', () => {
    it('fires immediately for empty query', () => {
      const onSearch = vi.fn(() => [{ value: 'a', label: 'A' }])
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
        searchDebounceMs: 300,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('', config)
      })

      // Should fire immediately despite debounce
      expect(onSearch).toHaveBeenCalledWith('', expect.any(Object))
    })

    it('debounces subsequent searches', () => {
      const onSearch = vi.fn(() => [])
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
        searchDebounceMs: 300,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('a', config)
      })

      // Should not have fired yet
      expect(onSearch).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(onSearch).toHaveBeenCalledWith('a', expect.any(Object))
    })

    it('cancels pending debounce on new search', () => {
      const onSearch = vi.fn(() => [])
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
        searchDebounceMs: 300,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('a', config)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        result.current.search('al', config)
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Only the second search should have fired
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('al', expect.any(Object))
    })
  })

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  describe('reset', () => {
    it('clears suggestions and loading state', () => {
      const onSearch = vi.fn(() => [{ value: 'a', label: 'A' }])
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('', config)
      })

      expect(result.current.suggestions).toHaveLength(1)

      act(() => {
        result.current.reset()
      })

      expect(result.current.suggestions).toEqual([])
      expect(result.current.suggestionsLoading).toBe(false)
      expect(result.current.suggestionsError).toBeNull()
    })

    it('aborts in-flight requests', async () => {
      let searchSignal: AbortSignal
      const onSearch = vi.fn((_q: string, opts: { signal: AbortSignal }) => {
        searchSignal = opts.signal
        return new Promise<TriggerSuggestion[]>(() => {
          // Never resolves
        })
      })

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('test', config)
      })

      expect(searchSignal!.aborted).toBe(false)

      act(() => {
        result.current.reset()
      })

      expect(searchSignal!.aborted).toBe(true)
    })

    it('cancels pending debounce timer', () => {
      const onSearch = vi.fn(() => [])
      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
        searchDebounceMs: 300,
      }

      const { result } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('a', config)
      })

      act(() => {
        result.current.reset()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should not have fired because we reset
      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  describe('cleanup', () => {
    it('aborts in-flight request on unmount', () => {
      let searchSignal: AbortSignal
      const onSearch = vi.fn((_q: string, opts: { signal: AbortSignal }) => {
        searchSignal = opts.signal
        return new Promise<TriggerSuggestion[]>(() => {})
      })

      const config: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch,
      }

      const { result, unmount } = renderHook(() => useTriggerSearch())

      act(() => {
        result.current.search('test', config)
      })

      expect(searchSignal!.aborted).toBe(false)
      unmount()
      expect(searchSignal!.aborted).toBe(true)
    })
  })
})

'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

// Store listeners for useSyncExternalStore
let listeners: Array<() => void> = []

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
}

function getServerSnapshot(): Theme {
  return 'system'
}

function emitChange() {
  for (const listener of listeners) listener()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system preference changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    emitChange()
  }, [])

  return { theme, setTheme }
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }, [theme, setTheme])

  const label =
    theme === 'system' ? 'System theme' : theme === 'dark' ? 'Dark theme' : 'Light theme'

  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        className,
      )}>
      {theme === 'dark' ? (
        <Moon className="size-4" />
      ) : theme === 'light' ? (
        <Sun className="size-4" />
      ) : (
        <Sun className="size-4 opacity-50" />
      )}
      <span className="capitalize">{theme}</span>
    </button>
  )
}

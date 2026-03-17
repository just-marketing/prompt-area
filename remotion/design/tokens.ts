export const colors = {
  light: {
    bg: '#fafafa',
    dotPattern: '#e0e0e0',
    title: '#0f0f0f',
    tagline: '#71717a',
    cardBg: '#ffffff',
    cardBorder: '#e5e5e5',
    separator: '#f0f0f0',
    text: '#0f0f0f',
    icon: '#a1a1aa',
    sendBg: '#18181b',
    sendIcon: '#ffffff',
  },
  dark: {
    bg: '#1a1a1a',
    dotPattern: '#333333',
    title: '#fafafa',
    tagline: '#a1a1aa',
    cardBg: '#2a2a2a',
    cardBorder: '#404040',
    separator: '#333333',
    text: '#fafafa',
    icon: '#71717a',
    sendBg: '#fafafa',
    sendIcon: '#1a1a1a',
  },
  chips: {
    mention: { bg: '#dbeafe', text: '#1d4ed8' },
    command: { bg: 'transparent', text: '#6d28d9' },
    tag: { bg: '#dcfce7', text: '#15803d' },
  },
} as const

export type Theme = 'light' | 'dark'

export function themeColors(theme: Theme = 'light') {
  return colors[theme]
}

export const cardShadow = '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)'

export const spacing = {
  cardPadding: 36,
  cardPaddingX: 40,
  cardRadius: 20,
  chipRadius: 10,
  iconSize: 48,
  dotSize: 30,
} as const

export const typography = {
  title: {
    fontSize: 68,
    fontWeight: 700 as const,
    letterSpacing: '-1.5px',
  },
  tagline: {
    fontSize: 38,
    fontWeight: 400 as const,
  },
  body: {
    fontSize: 32,
    fontWeight: 400 as const,
    lineHeight: 1.6,
  },
  chip: {
    fontSize: 32,
    fontWeight: 500 as const,
    lineHeight: 1.6,
  },
  code: {
    fontSize: 28,
    fontWeight: 400 as const,
    lineHeight: 1.6,
  },
  url: {
    fontSize: 44,
    fontWeight: 600 as const,
    letterSpacing: '-0.5px',
  },
} as const

export const VIDEO_WIDTH = 1080
export const VIDEO_HEIGHT = 1080
export const VIDEO_FPS = 30
export const VIDEO_DURATION_FRAMES = 450 // 15 seconds

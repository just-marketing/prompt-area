import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { type Theme, themeColors, typography } from './tokens'
import { springs } from './animation'

interface LogoProps {
  theme?: Theme
  /** Enable spring entrance animation */
  animate?: boolean
  /** Delay in frames before animation starts */
  delay?: number
  /** Show tagline below */
  showTagline?: boolean
  tagline?: string
  style?: React.CSSProperties
}

export const Logo: React.FC<LogoProps> = ({
  theme = 'light',
  animate = true,
  delay = 0,
  showTagline = true,
  tagline = 'The go-to textarea for AI agents & chatbots',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors(theme)

  const progress = animate
    ? spring({
        frame: Math.max(0, frame - delay),
        fps,
        config: springs.entrance,
      })
    : 1

  const scale = interpolate(progress, [0, 1], [0.8, 1])
  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const taglineProgress = animate
    ? spring({
        frame: Math.max(0, frame - delay - 8),
        fps,
        config: springs.entrance,
      })
    : 1

  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1])
  const taglineY = interpolate(taglineProgress, [0, 1], [10, 0])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${scale})`,
        opacity,
        ...style,
      }}>
      {/* Icon + Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}>
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke={c.title}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />
          <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />
          <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
          <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />
          <path d="M9 6v12" />
        </svg>
        <div
          style={{
            fontSize: typography.title.fontSize,
            fontWeight: typography.title.fontWeight,
            color: c.title,
            letterSpacing: typography.title.letterSpacing,
            fontFamily: 'Geist, sans-serif',
          }}>
          Prompt Area
        </div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <div
          style={{
            fontSize: typography.tagline.fontSize,
            color: c.tagline,
            marginTop: 12,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontFamily: 'Geist, sans-serif',
          }}>
          {tagline}
        </div>
      )}
    </div>
  )
}

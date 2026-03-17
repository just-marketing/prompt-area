import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { type Theme, themeColors, typography } from './tokens'
import { springs } from './animation'

interface OutroProps {
  url?: string
  theme?: Theme
  /** Delay in frames before animation */
  delay?: number
  style?: React.CSSProperties
}

export const Outro: React.FC<OutroProps> = ({
  url = 'prompt-area.com',
  theme = 'light',
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors(theme)

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs.entrance,
  })

  const opacity = interpolate(progress, [0, 1], [0, 1])
  const scale = interpolate(progress, [0, 1], [0.9, 1])
  const y = interpolate(progress, [0, 1], [15, 0])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        ...style,
      }}>
      <div
        style={{
          fontSize: typography.url.fontSize,
          fontWeight: typography.url.fontWeight,
          letterSpacing: typography.url.letterSpacing,
          color: c.title,
          fontFamily: 'Geist, sans-serif',
        }}>
        {url}
      </div>
      <div
        style={{
          fontSize: 24,
          color: c.tagline,
          fontFamily: 'Geist, sans-serif',
        }}>
        The go-to textarea for AI agents & chatbots
      </div>
    </div>
  )
}

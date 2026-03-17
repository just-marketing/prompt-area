import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { type Theme, themeColors, typography } from './tokens'
import { springs } from './animation'

interface CodeBlockProps {
  lines: string[]
  /** Start revealing lines at this frame */
  startFrame?: number
  /** Frames between each line reveal */
  framesPerLine?: number
  theme?: Theme
  /** Use monospace font */
  mono?: boolean
  style?: React.CSSProperties
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  lines,
  startFrame = 0,
  framesPerLine = 4,
  theme = 'light',
  mono = true,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors(theme)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f8f8f8',
        borderRadius: 12,
        border: `1px solid ${c.cardBorder}`,
        padding: '28px 32px',
        fontFamily: mono ? 'Geist Mono, monospace' : 'Geist, sans-serif',
        fontSize: typography.code.fontSize,
        lineHeight: typography.code.lineHeight,
        ...style,
      }}>
      {lines.map((line, i) => {
        const lineFrame = startFrame + i * framesPerLine
        const progress = spring({
          frame: Math.max(0, frame - lineFrame),
          fps,
          config: springs.dropdown,
        })

        const opacity = interpolate(progress, [0, 1], [0, 1])
        const x = interpolate(progress, [0, 1], [8, 0])

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateX(${x}px)`,
              color: c.text,
              whiteSpace: 'pre',
            }}>
            {line}
          </div>
        )
      })}
    </div>
  )
}

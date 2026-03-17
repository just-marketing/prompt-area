import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { type Theme, themeColors } from './tokens'
import { springs } from './animation'

interface FeatureLabelProps {
  text: string
  /** Frame at which the label appears */
  delay?: number
  theme?: Theme
  /** Position relative to parent */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  style?: React.CSSProperties
}

const positionStyles: Record<string, React.CSSProperties> = {
  'top-right': { top: -12, right: -12 },
  'top-left': { top: -12, left: -12 },
  'bottom-right': { bottom: -12, right: -12 },
  'bottom-left': { bottom: -12, left: -12 },
}

export const FeatureLabel: React.FC<FeatureLabelProps> = ({
  text,
  delay = 0,
  theme = 'light',
  position = 'top-right',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors(theme)

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs.chipPop,
  })

  const scale = interpolate(progress, [0, 1], [0.5, 1])
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        display: 'flex',
        alignItems: 'center',
        padding: '8px 18px',
        borderRadius: 20,
        backgroundColor: c.sendBg,
        color: c.sendIcon,
        fontSize: 20,
        fontWeight: 600,
        fontFamily: 'Geist, sans-serif',
        whiteSpace: 'nowrap',
        transform: `scale(${scale})`,
        opacity,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        ...style,
      }}>
      {text}
    </div>
  )
}

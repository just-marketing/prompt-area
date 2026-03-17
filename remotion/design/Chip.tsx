import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { colors, spacing } from './tokens'
import { springs } from './animation'

export type ChipVariant = 'mention' | 'command' | 'tag'

interface ChipProps {
  variant: ChipVariant
  label: string
  /** If set, chip animates in (pop) at this frame */
  enterFrame?: number
  icon?: React.ReactNode
  style?: React.CSSProperties
}

export const Chip: React.FC<ChipProps> = ({ variant, label, enterFrame, icon, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const chipColors = colors.chips[variant]

  const isCommand = variant === 'command'

  let animStyle: React.CSSProperties = {}
  if (enterFrame !== undefined) {
    const progress = spring({
      frame: Math.max(0, frame - enterFrame),
      fps,
      config: springs.chipPop,
    })
    const scale = interpolate(progress, [0, 1], [0.6, 1])
    const opacity = interpolate(progress, [0, 0.3], [0, 1], {
      extrapolateRight: 'clamp',
    })
    animStyle = {
      transform: `scale(${scale})`,
      opacity,
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isCommand ? '0' : '4px 16px',
        borderRadius: isCommand ? 0 : spacing.chipRadius,
        backgroundColor: chipColors.bg,
        color: chipColors.text,
        fontSize: 32,
        fontWeight: isCommand ? 700 : 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        ...animStyle,
        ...style,
      }}>
      {icon}
      {label}
    </span>
  )
}

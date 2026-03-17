import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { type Theme, themeColors } from './tokens'
import { springs } from './animation'

export interface DropdownItem {
  label: string
  description?: string
  icon?: React.ReactNode
}

interface DropdownPopoverProps {
  items: DropdownItem[]
  /** Index of highlighted/selected item */
  highlightIndex?: number
  /** Whether dropdown is visible */
  visible: boolean
  /** Frame at which it becomes visible (for entrance animation) */
  enterFrame?: number
  theme?: Theme
  width?: number
  style?: React.CSSProperties
}

export const DropdownPopover: React.FC<DropdownPopoverProps> = ({
  items,
  highlightIndex = 0,
  visible,
  enterFrame = 0,
  theme = 'light',
  width = 360,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors(theme)

  if (!visible) return null

  const progress = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: springs.dropdown,
  })

  const translateY = interpolate(progress, [0, 1], [-8, 0])
  const opacity = interpolate(progress, [0, 1], [0, 1])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        backgroundColor: c.cardBg,
        borderRadius: 12,
        border: `1px solid ${c.cardBorder}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)',
        padding: 6,
        opacity,
        transform: `translateY(${translateY}px)`,
        overflow: 'hidden',
        ...style,
      }}>
      {items.map((item, i) => {
        const isHighlighted = i === highlightIndex
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 18px',
              borderRadius: 8,
              backgroundColor: isHighlighted
                ? theme === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)'
                : 'transparent',
              fontFamily: 'Geist, sans-serif',
            }}>
            {item.icon && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  fontSize: 20,
                  color: c.icon,
                }}>
                {item.icon}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: c.text,
                }}>
                {item.label}
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: 18,
                    color: c.tagline,
                  }}>
                  {item.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

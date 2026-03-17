import React from 'react'
import { type Theme, themeColors, cardShadow, spacing } from './tokens'

interface CardProps {
  theme?: Theme
  width?: number
  padding?: number
  paddingX?: number
  style?: React.CSSProperties
  children?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  theme = 'light',
  width = 960,
  padding = spacing.cardPadding,
  paddingX = spacing.cardPaddingX,
  style,
  children,
}) => {
  const c = themeColors(theme)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        backgroundColor: c.cardBg,
        borderRadius: spacing.cardRadius,
        border: `1px solid ${c.cardBorder}`,
        boxShadow: cardShadow,
        padding: `${padding}px ${paddingX}px`,
        ...style,
      }}>
      {children}
    </div>
  )
}

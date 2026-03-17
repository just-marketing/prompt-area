import React from 'react'
import { useCurrentFrame } from 'remotion'
import { cursorOpacity } from './animation'

interface CursorProps {
  /** Override visibility (true = always visible, false = always hidden) */
  visible?: boolean
  color?: string
  height?: number
  style?: React.CSSProperties
}

export const Cursor: React.FC<CursorProps> = ({
  visible,
  color = '#0f0f0f',
  height = 36,
  style,
}) => {
  const frame = useCurrentFrame()
  const opacity = visible !== undefined ? (visible ? 1 : 0) : cursorOpacity(frame)

  return (
    <span
      style={{
        display: 'inline-block',
        width: 2,
        height,
        backgroundColor: color,
        opacity,
        marginLeft: 1,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  )
}

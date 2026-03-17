import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { springs, type SpringPreset } from './animation'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface FadeInProps {
  /** Frame at which the animation starts */
  delay?: number
  /** Direction the element comes from */
  direction?: Direction
  /** Distance in pixels for the slide */
  distance?: number
  /** Spring preset name */
  preset?: SpringPreset
  /** Include scale animation from this value to 1 */
  scaleFrom?: number
  style?: React.CSSProperties
  children: React.ReactNode
}

function getTranslate(direction: Direction, distance: number, progress: number): string {
  const remaining = interpolate(progress, [0, 1], [distance, 0])
  switch (direction) {
    case 'up':
      return `translateY(${remaining}px)`
    case 'down':
      return `translateY(${-remaining}px)`
    case 'left':
      return `translateX(${remaining}px)`
    case 'right':
      return `translateX(${-remaining}px)`
    case 'none':
      return ''
  }
}

export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  direction = 'up',
  distance = 28,
  preset = 'entrance',
  scaleFrom,
  style,
  children,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs[preset],
  })

  const opacity = interpolate(progress, [0, 1], [0, 1])
  const translate = getTranslate(direction, distance, progress)
  const scale =
    scaleFrom !== undefined ? `scale(${interpolate(progress, [0, 1], [scaleFrom, 1])})` : ''

  return (
    <div
      style={{
        opacity,
        transform: [translate, scale].filter(Boolean).join(' ') || undefined,
        ...style,
      }}>
      {children}
    </div>
  )
}

import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { type Theme, themeColors } from './tokens'
import { noiseDrift } from './animation'

type Pattern = 'hexagons' | 'diamonds' | 'circles'

interface GeometricBackgroundProps {
  theme?: Theme
  pattern: Pattern
  /** Enable animated drift */
  animated?: boolean
  /** Accent color for geometry strokes */
  accentColor?: string
  /** Opacity of geometry (0-1) */
  patternOpacity?: number
  style?: React.CSSProperties
  children?: React.ReactNode
}

function hexagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return `M${pts.join('L')}Z`
}

function HexagonGrid({ color, drift }: { color: string; drift: { x: number; y: number } }) {
  const size = 60
  const w = size * Math.sqrt(3)
  const h = size * 1.5
  const paths: string[] = []

  for (let row = -2; row < 10; row++) {
    for (let col = -2; col < 10; col++) {
      const cx = col * w + (row % 2 === 0 ? 0 : w / 2)
      const cy = row * h
      paths.push(hexagonPath(cx, cy, size * 0.9))
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${drift.x}px, ${drift.y}px)`,
      }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={1} />
      ))}
    </svg>
  )
}

function DiamondGrid({ color, drift }: { color: string; drift: { x: number; y: number } }) {
  const size = 80
  const paths: string[] = []

  for (let row = -2; row < 16; row++) {
    for (let col = -2; col < 16; col++) {
      const cx = col * size + (row % 2 === 0 ? 0 : size / 2)
      const cy = row * size * 0.6
      const s = size * 0.38
      paths.push(`M${cx},${cy - s}L${cx + s},${cy}L${cx},${cy + s}L${cx - s},${cy}Z`)
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${drift.x}px, ${drift.y}px)`,
      }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={1} />
      ))}
    </svg>
  )
}

function CirclePattern({
  color,
  frame,
  drift,
}: {
  color: string
  frame: number
  drift: { x: number; y: number }
}) {
  const circles: { cx: number; cy: number; r: number; opacity: number }[] = []
  const spacing = 180

  for (let row = -1; row < 8; row++) {
    for (let col = -1; col < 8; col++) {
      const cx = col * spacing + (row % 2 === 0 ? 0 : spacing / 2) + 40
      const cy = row * spacing + 40
      // Subtle pulsing based on position and frame
      const phase = (row * 3 + col * 7) * 0.5
      const pulse = Math.sin(frame * 0.03 + phase) * 0.15 + 0.85
      circles.push({
        cx,
        cy,
        r: 40 * pulse,
        opacity: 0.4 + Math.sin(frame * 0.02 + phase) * 0.2,
      })
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${drift.x}px, ${drift.y}px)`,
      }}>
      {circles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={c.opacity}
        />
      ))}
    </svg>
  )
}

export const GeometricBackground: React.FC<GeometricBackgroundProps> = ({
  theme = 'light',
  pattern,
  animated = true,
  accentColor,
  patternOpacity = 0.25,
  style,
  children,
}) => {
  const frame = useCurrentFrame()
  const c = themeColors(theme)
  const drift = animated ? noiseDrift(frame, `geo-${pattern}`, 4, 0.004) : { x: 0, y: 0 }
  const color = accentColor ?? c.dotPattern

  return (
    <AbsoluteFill
      style={{
        backgroundColor: c.bg,
        fontFamily: 'Geist, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}>
      <div style={{ position: 'absolute', inset: 0, opacity: patternOpacity }}>
        {pattern === 'hexagons' && <HexagonGrid color={color} drift={drift} />}
        {pattern === 'diamonds' && <DiamondGrid color={color} drift={drift} />}
        {pattern === 'circles' && <CirclePattern color={color} frame={frame} drift={drift} />}
      </div>
      {children}
    </AbsoluteFill>
  )
}

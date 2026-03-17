import React, { useMemo } from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { noise2D } from '@remotion/noise'
import { springs } from '../../../design/animation'

const CONFETTI_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6'] as const
const CONFETTI_COUNT = 80
const SUBTITLE_DELAY = 15

interface ConfettiParticle {
  x: number
  y: number
  width: number
  height: number
  color: string
  rotationSpeed: number
  seed: string
  startAngle: number
}

function generateParticles(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < count; i++) {
    const seed = `confetti-${i}`
    particles.push({
      x: (noise2D(seed, 0, 0) * 0.5 + 0.5) * 1500 - 110,
      y: -60 - Math.abs(noise2D(seed, 1, 0)) * 500,
      width: 16 + Math.abs(noise2D(seed, 2, 0)) * 20,
      height: 16 + Math.abs(noise2D(seed, 3, 0)) * 20,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotationSpeed: 3 + Math.abs(noise2D(seed, 4, 0)) * 6,
      seed,
      startAngle: noise2D(seed, 5, 0) * 360,
    })
  }
  return particles
}

export const BrandIntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const particles = useMemo(() => generateParticles(CONFETTI_COUNT), [])

  const titleProgress = spring({
    frame,
    fps,
    config: springs.entrance,
  })

  const subtitleProgress = spring({
    frame: Math.max(0, frame - SUBTITLE_DELAY),
    fps,
    config: springs.entrance,
  })

  const titleScale = interpolate(titleProgress, [0, 1], [1.3, 1])
  const titleBlur = interpolate(titleProgress, [0, 1], [8, 0])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#fafafa',
        overflow: 'hidden',
        position: 'relative',
      }}>
      {/* Confetti */}
      {particles.map((p, i) => {
        const gravity = interpolate(frame, [0, 90], [0, 800], {
          extrapolateRight: 'extend',
        })
        const drift = noise2D(p.seed, frame * 0.02, 0) * 180
        const rotation = p.startAngle + frame * p.rotationSpeed
        const particleOpacity = interpolate(frame, [0, 10, 70, 90], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x + drift,
              top: p.y + gravity,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: 2,
              transform: `rotate(${rotation}deg)`,
              opacity: particleOpacity,
            }}
          />
        )
      })}

      {/* Brand name */}
      <div
        style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 72,
          fontWeight: 700,
          color: '#0f0f0f',
          opacity: titleProgress,
          transform: `scale(${titleScale})`,
          filter: `blur(${titleBlur}px)`,
        }}>
        Prompt Area
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 32,
          color: '#71717a',
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [15, 0])}px)`,
          marginTop: 16,
        }}>
        makes it effortless ✅
      </div>
    </div>
  )
}

import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const STATS = [
  { value: '2.5k+', label: 'GitHub Stars', icon: '⭐' },
  { value: '50k+', label: 'npm Downloads / mo', icon: '📦' },
  { value: '0', label: 'Dependencies', icon: '🪶' },
  { value: '<4kb', label: 'Bundle Size (gzip)', icon: '⚡' },
]

export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}>
      <FadeIn delay={0} distance={15}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 26,
            width: 900,
          }}>
          {STATS.map((stat, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 5 - i * 10),
              fps,
              config: springs.entrance,
            })

            return (
              <div
                key={stat.label}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e5e5e5',
                  padding: '36px 32px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  opacity: progress,
                  transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
                  textAlign: 'center',
                  fontFamily: 'Geist, sans-serif',
                }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: 54,
                    fontWeight: 800,
                    color: '#0f0f0f',
                    letterSpacing: '-1px',
                    lineHeight: 1.1,
                  }}>
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: '#71717a',
                    marginTop: 6,
                    fontWeight: 500,
                  }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}

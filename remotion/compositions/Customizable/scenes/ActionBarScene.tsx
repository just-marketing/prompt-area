import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const CONFIGS = [
  {
    label: 'Full toolbar',
    buttons: ['+', '@', '/', '#', '</>', '🎤', '→'],
  },
  {
    label: 'Minimal',
    buttons: ['@', '→'],
  },
  {
    label: 'Media-focused',
    buttons: ['📎', '🖼️', '🎤', '📹', '→'],
  },
]

export const ActionBarScene: React.FC = () => {
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
            fontSize: 38,
            fontWeight: 700,
            color: '#0f0f0f',
            fontFamily: 'Geist, sans-serif',
            marginBottom: 24,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}>
          Configurable action bar
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {CONFIGS.map((config, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 5 - i * 18),
              fps,
              config: springs.entrance,
            })

            return (
              <div
                key={config.label}
                style={{
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [15, 0])}px)`,
                }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#6366f1',
                    fontFamily: 'Geist Mono, monospace',
                    marginBottom: 6,
                    marginLeft: 4,
                  }}>
                  {config.label}
                </div>
                <Card width={880} padding={22}>
                  {/* Fake text line */}
                  <div
                    style={{
                      fontSize: 26,
                      color: '#a1a1aa',
                      fontFamily: 'Geist, sans-serif',
                      marginBottom: 12,
                    }}>
                    Type your message...
                  </div>
                  <div
                    style={{
                      height: 1,
                      backgroundColor: '#f0f0f0',
                      width: '100%',
                      marginBottom: 10,
                    }}
                  />
                  {/* Custom button row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    {config.buttons.map((btn, j) => {
                      const isLast = j === config.buttons.length - 1
                      return (
                        <div
                          key={j}
                          style={{
                            width: isLast ? 44 : 42,
                            height: isLast ? 44 : 42,
                            borderRadius: isLast ? 12 : 10,
                            backgroundColor: isLast ? '#18181b' : 'transparent',
                            color: isLast ? '#fff' : '#a1a1aa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isLast ? 22 : 26,
                            fontFamily: 'Geist, sans-serif',
                            marginLeft: isLast ? 'auto' : 0,
                          }}>
                          {btn}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}

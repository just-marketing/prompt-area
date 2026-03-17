import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const LAYOUTS = [
  {
    name: 'Floating',
    style: {
      borderRadius: 20,
      border: '1px solid #e5e5e5',
      boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
      padding: '16px 20px',
      backgroundColor: '#ffffff',
    },
  },
  {
    name: 'Inline',
    style: {
      borderRadius: 0,
      borderTop: '1px solid #e5e5e5',
      borderBottom: '1px solid #e5e5e5',
      padding: '16px 20px',
      backgroundColor: '#fafafa',
    },
  },
  {
    name: 'Glassmorphism',
    style: {
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      padding: '16px 20px',
      backgroundColor: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(12px)',
    },
  },
]

export const LayoutsScene: React.FC = () => {
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
            fontSize: 28,
            fontWeight: 700,
            color: '#0f0f0f',
            fontFamily: 'Geist, sans-serif',
            marginBottom: 28,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}>
          Any layout, any style
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {LAYOUTS.map((layout, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 5 - i * 15),
              fps,
              config: springs.entrance,
            })

            return (
              <div
                key={layout.name}
                style={{
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
                }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#a1a1aa',
                    fontFamily: 'Geist Mono, monospace',
                    marginBottom: 6,
                    marginLeft: 4,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                  }}>
                  {layout.name}
                </div>
                <div
                  style={{
                    width: 700,
                    ...layout.style,
                    fontFamily: 'Geist, sans-serif',
                  }}>
                  <div
                    style={{
                      fontSize: 18,
                      color: '#71717a',
                      marginBottom: 10,
                    }}>
                    Type your message...
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        fontSize: 16,
                        color: '#a1a1aa',
                      }}>
                      <span>@</span>
                      <span>/</span>
                      <span>#</span>
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#18181b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}

import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const METHODS = [
  {
    label: 'shadcn CLI',
    command: 'npx shadcn@latest add prompt-area',
    badge: 'recommended',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
  },
  {
    label: 'npm',
    command: 'npm install prompt-area',
    badge: null,
    badgeColor: '',
    badgeBg: '',
  },
  {
    label: 'pnpm',
    command: 'pnpm add prompt-area',
    badge: null,
    badgeColor: '',
    badgeBg: '',
  },
]

export const InstallMethodsScene: React.FC = () => {
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
          Install in seconds
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {METHODS.map((method, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 8 - i * 14),
              fps,
              config: springs.entrance,
            })

            return (
              <div
                key={method.label}
                style={{
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
                }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 6,
                    marginLeft: 4,
                  }}>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: '#71717a',
                      fontFamily: 'Geist, sans-serif',
                    }}>
                    {method.label}
                  </span>
                  {method.badge && (
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: method.badgeColor,
                        backgroundColor: method.badgeBg,
                        padding: '4px 10px',
                        borderRadius: 6,
                      }}>
                      {method.badge}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: 880,
                    backgroundColor: '#1e1e1e',
                    borderRadius: 12,
                    padding: '22px 26px',
                    fontFamily: 'Geist Mono, monospace',
                    fontSize: 24,
                    color: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}>
                  <span style={{ color: '#28c840' }}>$</span>
                  <span>{method.command}</span>
                </div>
              </div>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}

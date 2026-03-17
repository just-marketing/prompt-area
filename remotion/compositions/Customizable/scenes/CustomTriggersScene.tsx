import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const TRIGGERS = [
  { char: '@', label: 'Mentions', desc: 'Reference team members', color: '#1d4ed8', bg: '#dbeafe' },
  { char: '/', label: 'Commands', desc: 'Execute actions', color: '#6d28d9', bg: '#ede9fe' },
  { char: '#', label: 'Tags', desc: 'Categorize content', color: '#15803d', bg: '#dcfce7' },
  { char: '!', label: 'Alerts', desc: 'Custom priority flags', color: '#dc2626', bg: '#fee2e2' },
  { char: '::', label: 'Snippets', desc: 'Insert templates', color: '#ea580c', bg: '#fff7ed' },
]

export const CustomTriggersScene: React.FC = () => {
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
            marginBottom: 24,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}>
          Define your own triggers
        </div>

        <Card width={720} padding={20}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TRIGGERS.map((trigger, i) => {
              const progress = spring({
                frame: Math.max(0, frame - 8 - i * 10),
                fps,
                config: springs.entrance,
              })

              return (
                <div
                  key={trigger.char}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: frame >= 8 + i * 10 ? `${trigger.bg}66` : 'transparent',
                    opacity: progress,
                    transform: `translateX(${interpolate(progress, [0, 1], [-15, 0])}px)`,
                    fontFamily: 'Geist, sans-serif',
                  }}>
                  {/* Trigger character */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: trigger.bg,
                      color: trigger.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: 'Geist Mono, monospace',
                      flexShrink: 0,
                    }}>
                    {trigger.char}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#0f0f0f',
                      }}>
                      {trigger.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#71717a' }}>{trigger.desc}</div>
                  </div>

                  {/* Built-in badge for first 3 */}
                  {i < 3 && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#71717a',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: '#f4f4f5',
                      }}>
                      built-in
                    </div>
                  )}
                  {i >= 3 && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: trigger.color,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: trigger.bg,
                      }}>
                      custom
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

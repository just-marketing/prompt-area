import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const SEGMENTS = [
  { type: 'chip', label: '@Strategist', color: '#1d4ed8', bg: '#dbeafe' },
  { type: 'text', label: '"Summarize the brief"' },
  { type: 'chip', label: '#Q4-launch', color: '#15803d', bg: '#dcfce7' },
  { type: 'file', label: '📎 campaign-brief.pdf' },
]

export const ContextWindowScene: React.FC = () => {
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
        {/* Title */}
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
          Every segment becomes context
        </div>

        <Card width={820} padding={24}>
          {/* Segment visualization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SEGMENTS.map((seg, i) => {
              const segProgress = spring({
                frame: Math.max(0, frame - 10 - i * 12),
                fps,
                config: springs.entrance,
              })

              const arrowProgress = spring({
                frame: Math.max(0, frame - 20 - i * 12),
                fps,
                config: springs.subtle,
              })

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    opacity: segProgress,
                    transform: `translateX(${interpolate(segProgress, [0, 1], [-20, 0])}px)`,
                  }}>
                  {/* Segment pill */}
                  <div
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: 10,
                      backgroundColor:
                        seg.type === 'chip' ? seg.bg : seg.type === 'file' ? '#fef3c7' : '#f4f4f5',
                      color:
                        seg.type === 'chip'
                          ? seg.color
                          : seg.type === 'file'
                            ? '#92400e'
                            : '#0f0f0f',
                      fontSize: 18,
                      fontWeight: 500,
                      fontFamily: 'Geist, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    {seg.label}
                  </div>

                  {/* Arrow */}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      opacity: arrowProgress,
                    }}>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>

                  {/* AI context label */}
                  <div
                    style={{
                      fontSize: 13,
                      color: '#6366f1',
                      fontWeight: 600,
                      fontFamily: 'Geist Mono, monospace',
                      opacity: arrowProgress,
                      whiteSpace: 'nowrap',
                    }}>
                    {seg.type === 'chip' && seg.label.startsWith('@')
                      ? 'agent'
                      : seg.type === 'chip'
                        ? 'tag'
                        : seg.type === 'file'
                          ? 'attachment'
                          : 'instruction'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

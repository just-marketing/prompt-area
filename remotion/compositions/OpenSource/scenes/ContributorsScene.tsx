import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'
import { noiseDrift } from '../../../design/animation'

const AVATARS = [
  { initials: 'JD', color: '#6366f1' },
  { initials: 'SK', color: '#ec4899' },
  { initials: 'AL', color: '#f59e0b' },
  { initials: 'MR', color: '#10b981' },
  { initials: 'CT', color: '#3b82f6' },
  { initials: 'RW', color: '#8b5cf6' },
  { initials: 'NP', color: '#ef4444' },
  { initials: '+12', color: '#71717a' },
]

const HIGHLIGHTS = [
  '✨ 120+ closed issues',
  '🔀 80+ merged PRs',
  '📖 Comprehensive docs',
  '🧪 100% test coverage',
]

export const ContributorsScene: React.FC = () => {
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
          Built by the community
        </div>

        {/* Avatar row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 32,
          }}>
          {AVATARS.map((avatar, i) => {
            const drift = noiseDrift(frame, `avatar-${i}`, 2, 0.01)
            const progress = spring({
              frame: Math.max(0, frame - 5 - i * 5),
              fps,
              config: springs.chipPop,
            })

            return (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: avatar.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: avatar.initials.length > 2 ? 14 : 18,
                  fontWeight: 700,
                  fontFamily: 'Geist, sans-serif',
                  border: '3px solid #fafafa',
                  marginLeft: i === 0 ? 0 : -12,
                  zIndex: AVATARS.length - i,
                  opacity: progress,
                  transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])}) translate(${drift.x}px, ${drift.y}px)`,
                }}>
                {avatar.initials}
              </div>
            )
          })}
        </div>

        {/* Highlights grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            width: 600,
          }}>
          {HIGHLIGHTS.map((item, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 35 - i * 8),
              fps,
              config: springs.entrance,
            })

            return (
              <div
                key={item}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e5e5e5',
                  padding: '14px 18px',
                  fontSize: 17,
                  fontFamily: 'Geist, sans-serif',
                  color: '#0f0f0f',
                  fontWeight: 500,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [8, 0])}px)`,
                }}>
                {item}
              </div>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}

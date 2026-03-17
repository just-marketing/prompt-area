import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const FRAMEWORKS = [
  { name: 'Next.js', color: '#000000', bg: '#f4f4f5' },
  { name: 'Remix', color: '#3992ff', bg: '#eff6ff' },
  { name: 'Vite', color: '#646cff', bg: '#eef2ff' },
  { name: 'Astro', color: '#ff5d01', bg: '#fff7ed' },
  { name: 'Nuxt', color: '#00dc82', bg: '#ecfdf5' },
  { name: 'SvelteKit', color: '#ff3e00', bg: '#fef2f2' },
]

export const FrameworksScene: React.FC = () => {
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
            marginBottom: 10,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}>
          Works everywhere
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#71717a',
            fontFamily: 'Geist, sans-serif',
            marginBottom: 32,
            textAlign: 'center',
          }}>
          Any React framework, zero config
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            width: 840,
          }}>
          {FRAMEWORKS.map((fw, i) => {
            const progress = spring({
              frame: Math.max(0, frame - 8 - i * 8),
              fps,
              config: springs.chipPop,
            })

            return (
              <div
                key={fw.name}
                style={{
                  backgroundColor: fw.bg,
                  borderRadius: 14,
                  padding: '32px 22px',
                  textAlign: 'center',
                  fontFamily: 'Geist, sans-serif',
                  opacity: progress,
                  transform: `scale(${interpolate(progress, [0, 1], [0.7, 1])})`,
                  border: `1px solid ${fw.bg}`,
                }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: fw.color,
                    letterSpacing: '-0.3px',
                  }}>
                  {fw.name}
                </div>
              </div>
            )
          })}
        </div>

        {/* TypeScript badge */}
        {frame >= 60 && (
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: spring({
                frame: Math.max(0, frame - 60),
                fps,
                config: springs.entrance,
              }),
            }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#3178c6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'Geist, sans-serif',
              }}>
              TS
            </div>
            <span
              style={{
                fontSize: 22,
                color: '#71717a',
                fontFamily: 'Geist, sans-serif',
                fontWeight: 500,
              }}>
              Full TypeScript support with autocomplete
            </span>
          </div>
        )}
      </FadeIn>
    </div>
  )
}

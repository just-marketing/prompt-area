import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const BRANDS = [
  {
    name: 'Default',
    bg: '#ffffff',
    border: '#e5e5e5',
    accent: '#18181b',
    chipBg: '#dbeafe',
    chipText: '#1d4ed8',
  },
  {
    name: 'Ocean',
    bg: '#f0f9ff',
    border: '#bae6fd',
    accent: '#0369a1',
    chipBg: '#e0f2fe',
    chipText: '#0c4a6e',
  },
  {
    name: 'Forest',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    accent: '#166534',
    chipBg: '#dcfce7',
    chipText: '#14532d',
  },
]

export const BrandThemeScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Cycle through brands
  const brandIdx = frame < 30 ? 0 : frame < 60 ? 1 : 2
  const brand = BRANDS[brandIdx]

  const switchProgress = spring({
    frame:
      brandIdx === 0 ? frame : brandIdx === 1 ? Math.max(0, frame - 30) : Math.max(0, frame - 60),
    fps,
    config: { damping: 15, stiffness: 200 },
  })

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
      {/* Brand label */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: brand.accent,
          fontFamily: 'Geist Mono, monospace',
          marginBottom: 16,
          padding: '6px 16px',
          borderRadius: 20,
          backgroundColor: brand.chipBg,
          opacity: switchProgress,
          transform: `scale(${interpolate(switchProgress, [0, 1], [0.8, 1])})`,
        }}>
        theme: {brand.name.toLowerCase()}
      </div>

      <FadeIn delay={0} distance={15}>
        <Card
          width={820}
          style={{
            backgroundColor: brand.bg,
            borderColor: brand.border,
            transition: 'all 0.3s',
          }}>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
            }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: brand.chipBg,
                color: brand.chipText,
                padding: '4px 12px',
                borderRadius: 8,
                fontWeight: 500,
              }}>
              @Designer
            </span>
            <span>Review the brand assets for</span>
            <span
              style={{
                display: 'inline-flex',
                backgroundColor: brand.chipBg,
                color: brand.chipText,
                padding: '4px 12px',
                borderRadius: 8,
                fontWeight: 500,
              }}>
              #rebrand
            </span>
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: brand.border,
              width: '100%',
              marginBottom: 12,
            }}
          />
          <ActionBar />
        </Card>
      </FadeIn>
    </div>
  )
}

import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { springs } from '../../../design/animation'

const BRAND_DELAY = 10
const URL_DELAY = 30

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const brandProgress = spring({
    frame: Math.max(0, frame - BRAND_DELAY),
    fps,
    config: springs.entrance,
  })

  const urlProgress = spring({
    frame: Math.max(0, frame - URL_DELAY),
    fps,
    config: springs.entrance,
  })

  const fadeOutStart = durationInFrames - 30
  const fadeOut =
    frame >= fadeOutStart
      ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
          extrapolateRight: 'clamp',
        })
      : 1

  const brandScale = interpolate(brandProgress, [0, 1], [0.95, 1])

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        opacity: fadeOut,
      }}>
      {/* Brand name */}
      <div
        style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 56,
          fontWeight: 700,
          color: '#ffffff',
          opacity: brandProgress,
          transform: `scale(${brandScale})`,
        }}>
        Prompt Area
      </div>

      {/* URL */}
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 28,
          color: '#a1a1aa',
          opacity: urlProgress,
          marginTop: 20,
        }}>
        prompt-area.com
      </div>
    </AbsoluteFill>
  )
}

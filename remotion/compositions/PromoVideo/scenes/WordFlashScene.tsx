import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { springs } from '../../../design/animation'

const WORDS = ['TURN', 'IDEAS', 'INTO', 'PRODUCTS'] as const
const FRAMES_PER_WORD = 10

export const WordFlashScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const wordIndex = Math.min(WORDS.length - 1, Math.floor(frame / FRAMES_PER_WORD))

  const localFrame = frame - wordIndex * FRAMES_PER_WORD

  const progress = spring({
    frame: localFrame,
    fps,
    config: springs.chipPop,
  })

  const scale = interpolate(progress, [0, 1], [1.3, 1])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#fafafa',
      }}>
      <span
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 72,
          fontWeight: 900,
          color: '#0f0f0f',
          opacity: progress,
          transform: `scale(${scale})`,
          display: 'inline-block',
        }}>
        {WORDS[wordIndex]}
      </span>
    </div>
  )
}

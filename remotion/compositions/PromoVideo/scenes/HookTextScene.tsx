import React from 'react'
import { useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { springs } from '../../../design/animation'

const WORDS = ['Customizing', 'AI', 'chat', 'is', 'tedious'] as const
const START_FRAME = 5
const FRAMES_PER_WORD = 12

export const HookTextScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
        }}>
        {WORDS.map((word, i) => {
          const wordDelay = START_FRAME + i * FRAMES_PER_WORD
          const progress = spring({
            frame: Math.max(0, frame - wordDelay),
            fps,
            config: springs.entrance,
          })

          const isHard = word === 'tedious'
          const opacity = progress
          const scale = 1.1 - 0.1 * progress

          return (
            <span
              key={word}
              style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 64,
                fontWeight: 700,
                color: isHard ? '#7f1d1d' : '#0f0f0f',
                opacity,
                transform: `scale(${scale})`,
                display: 'inline-block',
              }}>
              {word}
            </span>
          )
        })}
      </div>
    </div>
  )
}

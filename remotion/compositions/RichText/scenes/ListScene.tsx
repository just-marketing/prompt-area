import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Cursor } from '../../../design/Cursor'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const LINES = [
  { text: 'Key messages for the target audience', indent: 0 },
  { text: 'Action items assigned to each agent', indent: 0 },
  { text: 'Priority items flagged by @Strategist', indent: 1 },
  { text: 'Open questions for follow-up', indent: 0 },
]

const TYPING_SPEED = 2
const LINE_GAP = 15 // frames between lines

export const ListScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Pre-compute start frames for each line
  const lineStartFrames = LINES.reduce<number[]>((acc, line, i) => {
    const prev = i === 0 ? 5 : acc[i - 1] + LINES[i - 1].text.length * TYPING_SPEED + LINE_GAP
    acc.push(prev)
    return acc
  }, [])

  const lineStates = LINES.map((line, i) => {
    const start = lineStartFrames[i]
    const typingFrames = line.text.length * TYPING_SPEED
    const end = start + typingFrames

    const charsTyped = Math.min(
      line.text.length,
      Math.floor(Math.max(0, frame - start) / TYPING_SPEED),
    )

    const bulletProgress = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: springs.chipPop,
    })

    return {
      ...line,
      charsTyped,
      bulletProgress,
      isActive: frame >= start && frame <= end + LINE_GAP,
    }
  })

  const lastActiveLine = lineStates.findLastIndex((l: { charsTyped: number }) => l.charsTyped > 0)

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
        <Card width={960}>
          <div
            style={{
              minHeight: 140,
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
            }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Format the output as:</div>
            {lineStates.map((line, i) => {
              if (line.charsTyped === 0) return null
              const bulletScale = interpolate(line.bulletProgress, [0, 1], [0.5, 1])
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    paddingLeft: line.indent * 24 + 10,
                  }}>
                  <span
                    style={{
                      marginRight: 10,
                      transform: `scale(${bulletScale})`,
                      display: 'inline-block',
                    }}>
                    •
                  </span>
                  <span>{line.text.slice(0, line.charsTyped)}</span>
                  {i === lastActiveLine && line.charsTyped < line.text.length && (
                    <Cursor color="#0f0f0f" />
                  )}
                </div>
              )
            })}
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: '#f0f0f0',
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

import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { Cursor } from '../../../design/Cursor'
import { springs } from '../../../design/animation'

const AI_RESPONSE = [
  "Here's the campaign strategy:",
  '',
  '1. Target audience: Tech-savvy founders',
  '2. Key message: Ship faster with AI',
  '3. Channels: LinkedIn, Twitter, PH',
  '',
  'Ready to draft the copy?',
]

export const StreamingScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const cardProgress = spring({
    frame,
    fps,
    config: springs.entrance,
  })

  // Streaming speed: 1 char every 0.6 frames
  const totalChars = AI_RESPONSE.join('\n').length
  const charsStreamed = Math.min(totalChars, Math.floor(Math.max(0, frame - 15) / 0.6))

  let charCount = 0
  const visibleLines: { text: string; full: boolean }[] = []
  for (const line of AI_RESPONSE) {
    if (charCount >= charsStreamed) break
    const lineChars = Math.min(line.length, charsStreamed - charCount)
    visibleLines.push({
      text: line.slice(0, lineChars),
      full: lineChars >= line.length,
    })
    charCount += line.length + 1 // +1 for newline
  }

  const isStreaming = charsStreamed < totalChars

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
        {/* User message bubble */}
        <div
          style={{
            width: 960,
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 16,
            opacity: interpolate(cardProgress, [0, 0.5], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}>
          <div
            style={{
              backgroundColor: '#18181b',
              color: '#fff',
              padding: '18px 26px',
              borderRadius: '16px 16px 4px 16px',
              fontSize: 28,
              fontFamily: 'Geist, sans-serif',
              maxWidth: '70%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
            <span
              style={{
                backgroundColor: 'rgba(219,234,254,0.2)',
                color: '#93c5fd',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 500,
              }}>
              @Strategist
            </span>
            <span>Create a campaign plan</span>
          </div>
        </div>

        {/* AI response bubble */}
        <div
          style={{
            width: 960,
            display: 'flex',
            justifyContent: 'flex-start',
            opacity: frame >= 15 ? 1 : 0,
          }}>
          <Card width={780} padding={28}>
            {/* AI avatar header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 16,
              }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <span style={{ fontSize: 20, color: '#fff' }}>AI</span>
              </div>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#6366f1',
                  fontFamily: 'Geist, sans-serif',
                }}>
                Strategist
              </span>
              {isStreaming && (
                <span
                  style={{
                    fontSize: 16,
                    color: '#a1a1aa',
                    fontFamily: 'Geist, sans-serif',
                  }}>
                  typing...
                </span>
              )}
            </div>

            {/* Streamed text */}
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.7,
                color: '#0f0f0f',
                fontFamily: 'Geist, sans-serif',
              }}>
              {visibleLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: line.text === '' ? 10 : undefined,
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                  {line.text}
                  {i === visibleLines.length - 1 && isStreaming && (
                    <Cursor color="#6366f1" height={28} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </div>
  )
}

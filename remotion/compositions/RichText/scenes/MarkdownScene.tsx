import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Cursor } from '../../../design/Cursor'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

// Typing sequence: **Key messages** then *Action items*
const BOLD_TEXT = '**Key messages**'
const ITALIC_TEXT = ' for the team. *Action items*'
const TYPING_SPEED = 3 // frames per char
const BOLD_RESOLVE_FRAME = BOLD_TEXT.length * TYPING_SPEED + 6
const ITALIC_START = BOLD_RESOLVE_FRAME + 4
const ITALIC_RESOLVE_FRAME = ITALIC_START + ITALIC_TEXT.length * TYPING_SPEED + 6

export const MarkdownScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Phase 1: Typing bold
  const boldCharsTyped = Math.min(BOLD_TEXT.length, Math.floor(frame / TYPING_SPEED))
  const boldResolved = frame >= BOLD_RESOLVE_FRAME

  // Phase 2: Typing italic
  const italicCharsTyped = Math.min(
    ITALIC_TEXT.length,
    Math.floor(Math.max(0, frame - ITALIC_START) / TYPING_SPEED),
  )
  const italicResolved = frame >= ITALIC_RESOLVE_FRAME

  // Bold transformation animation
  const boldTransform = boldResolved
    ? spring({
        frame: Math.max(0, frame - BOLD_RESOLVE_FRAME),
        fps,
        config: springs.chipPop,
      })
    : 0

  const boldWeight = interpolate(boldTransform, [0, 1], [400, 700])

  // Italic transformation
  const italicTransform = italicResolved
    ? spring({
        frame: Math.max(0, frame - ITALIC_RESOLVE_FRAME),
        fps,
        config: springs.chipPop,
      })
    : 0

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
              minHeight: 80,
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
            }}>
            {/* Bold text */}
            {boldResolved ? (
              <span
                style={{
                  fontWeight: boldWeight,
                  color: '#0f0f0f',
                }}>
                Key messages
              </span>
            ) : (
              <span style={{ color: '#71717a' }}>{BOLD_TEXT.slice(0, boldCharsTyped)}</span>
            )}

            {/* Middle text + italic */}
            {frame >= ITALIC_START && (
              <>
                {italicResolved ? (
                  <span>
                    {' for the team. '}
                    <span
                      style={{
                        fontStyle: italicTransform > 0.5 ? 'italic' : 'normal',
                      }}>
                      Action items
                    </span>
                  </span>
                ) : (
                  <span style={{ color: italicCharsTyped > 16 ? '#71717a' : '#0f0f0f' }}>
                    {ITALIC_TEXT.slice(0, italicCharsTyped)}
                  </span>
                )}
              </>
            )}

            {!italicResolved && <Cursor color="#0f0f0f" />}
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

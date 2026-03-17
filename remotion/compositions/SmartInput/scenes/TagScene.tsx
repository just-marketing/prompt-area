import React from 'react'
import { useCurrentFrame } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { Cursor } from '../../../design/Cursor'
import { FadeIn } from '../../../design/FadeIn'
import { colors } from '../../../design/tokens'

const TYPING_START = 5
const TYPING_TEXT = '#campaign'
const TYPING_SPEED = 3
const RESOLVE_FRAME = TYPING_START + TYPING_TEXT.length * TYPING_SPEED + 8 // +8 for space delay

export const TagScene: React.FC = () => {
  const frame = useCurrentFrame()

  const charsTyped = Math.min(
    TYPING_TEXT.length,
    Math.floor(Math.max(0, frame - TYPING_START) / TYPING_SPEED),
  )

  const showChip = frame >= RESOLVE_FRAME

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
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
            }}>
            <Chip variant="command" label="/summarize" />
            <span>the campaign brief from</span>
            <Chip variant="mention" label="@Strategist" />
            <span>and</span>
            <Chip variant="mention" label="@Copywriter" />
            <span>. Tag anything marked</span>

            {!showChip && charsTyped > 0 && (
              <span style={{ color: colors.chips.tag.text }}>
                {TYPING_TEXT.slice(0, charsTyped)}
              </span>
            )}
            {!showChip && <Cursor color="#0f0f0f" />}
            {showChip && <Chip variant="tag" label="#campaign" enterFrame={RESOLVE_FRAME} />}
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

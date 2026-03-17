import React from 'react'
import { useCurrentFrame } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { Cursor } from '../../../design/Cursor'
import { DropdownPopover } from '../../../design/DropdownPopover'
import { FadeIn } from '../../../design/FadeIn'
import { colors } from '../../../design/tokens'

const TYPING_START = 5
const TYPING_TEXT = '@Cla'
const TYPING_SPEED = 4 // frames per char
const DROPDOWN_FRAME = TYPING_START + TYPING_TEXT.length * TYPING_SPEED // ~21
const SELECT_FRAME = DROPDOWN_FRAME + 18 // ~39 -> using ~43 for more visible dropdown
const CHIP_FRAME = 43

const mentionItems = [
  { label: '@Claude', description: 'Anthropic AI model' },
  { label: '@GPT-4', description: 'OpenAI model' },
  { label: '@Gemini', description: 'Google AI model' },
]

export const MentionDemoScene: React.FC = () => {
  const frame = useCurrentFrame()

  const charsTyped = Math.min(
    TYPING_TEXT.length,
    Math.floor(Math.max(0, frame - TYPING_START) / TYPING_SPEED),
  )

  const showDropdown = frame >= DROPDOWN_FRAME && frame < CHIP_FRAME
  const showChip = frame >= CHIP_FRAME

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
        <Card width={900}>
          {/* Text area content */}
          <div
            style={{
              minHeight: 80,
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
              position: 'relative',
            }}>
            {!showChip && charsTyped > 0 && (
              <span style={{ color: colors.chips.mention.text }}>
                {TYPING_TEXT.slice(0, charsTyped)}
              </span>
            )}
            {!showChip && <Cursor color="#0f0f0f" />}
            {showChip && <Chip variant="mention" label="@Claude" enterFrame={CHIP_FRAME} />}

            {/* Dropdown */}
            {showDropdown && (
              <div style={{ position: 'absolute', top: 56, left: 0, zIndex: 10 }}>
                <DropdownPopover
                  items={mentionItems}
                  highlightIndex={0}
                  visible
                  enterFrame={DROPDOWN_FRAME}
                />
              </div>
            )}
          </div>

          {/* Separator */}
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

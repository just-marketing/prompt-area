import React from 'react'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { type Theme, themeColors, typography } from '../../../design/tokens'
import { FONT_FAMILY } from '../../../design/fonts'

const CARD_WIDTH = 420
const CARD_GAP = 30
const LEFT_DELAY = 0
const RIGHT_DELAY = 15

function ThemeCard({ theme, delay }: { theme: Theme; delay: number }) {
  const c = themeColors(theme)
  const label = theme === 'light' ? 'Light' : 'Dark'

  return (
    <FadeIn delay={delay} direction="up" distance={30} preset="entrance">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* Label badge */}
        <div
          style={{
            fontFamily: `${FONT_FAMILY}, sans-serif`,
            fontSize: 18,
            fontWeight: 600,
            color: theme === 'light' ? '#71717a' : '#a1a1aa',
            backgroundColor: theme === 'light' ? '#f4f4f5' : '#3a3a3a',
            padding: '6px 18px',
            borderRadius: 20,
            letterSpacing: '0.5px',
            textTransform: 'uppercase' as const,
          }}>
          {label}
        </div>

        <Card theme={theme} width={CARD_WIDTH} padding={24} paddingX={28}>
          {/* Message text */}
          <div
            style={{
              fontFamily: `${FONT_FAMILY}, sans-serif`,
              fontSize: 24,
              fontWeight: typography.body.fontWeight,
              lineHeight: typography.body.lineHeight,
              color: c.text,
              marginBottom: 8,
            }}>
            Hello! How can I help?
          </div>

          {/* Mention chip */}
          <div style={{ marginBottom: 18 }}>
            <Chip
              variant="mention"
              label="@Assistant"
              style={{
                fontSize: 20,
                padding: '3px 12px',
              }}
            />
          </div>

          {/* Separator */}
          <div
            style={{
              height: 1,
              backgroundColor: c.separator,
              marginBottom: 14,
            }}
          />

          {/* Action bar */}
          <ActionBar theme={theme} />
        </Card>
      </div>
    </FadeIn>
  )
}

export const DarkModeScene: React.FC = () => {
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
          gap: CARD_GAP,
          alignItems: 'flex-start',
        }}>
        <ThemeCard theme="light" delay={LEFT_DELAY} />
        <ThemeCard theme="dark" delay={RIGHT_DELAY} />
      </div>
    </div>
  )
}

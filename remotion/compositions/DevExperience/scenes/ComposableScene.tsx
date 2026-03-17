import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { FadeIn } from '../../../design/FadeIn'
import { FeatureLabel } from '../../../design/FeatureLabel'
import { springs } from '../../../design/animation'

const VARIANT_1_END = 35 // Full mode
const VARIANT_2_START = 35
const VARIANT_2_END = 70 // Compact mode
const VARIANT_3_START = 70 // Chat layout

export const ComposableScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Determine which variant is showing
  const showVariant1 = frame < VARIANT_1_END
  const showVariant2 = frame >= VARIANT_2_START && frame < VARIANT_2_END
  const showVariant3 = frame >= VARIANT_3_START

  const transition2 = spring({
    frame: Math.max(0, frame - VARIANT_2_START),
    fps,
    config: springs.entrance,
  })

  const transition3 = spring({
    frame: Math.max(0, frame - VARIANT_3_START),
    fps,
    config: springs.entrance,
  })

  const sampleContent = (
    <div
      style={{
        fontSize: 30,
        lineHeight: 1.6,
        color: '#0f0f0f',
        fontFamily: 'Geist, sans-serif',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
      }}>
      <Chip variant="command" label="/summarize" />
      <span>the campaign brief from</span>
      <Chip variant="mention" label="@Strategist" />
    </div>
  )

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
      {/* Variant 1: Full mode with ActionBar + StatusBar */}
      {showVariant1 && (
        <FadeIn delay={0} distance={15}>
          <div style={{ position: 'relative' }}>
            <Card width={960}>
              {sampleContent}
              <div style={{ marginTop: 12 }}>
                {/* Status bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 18,
                    color: '#71717a',
                    fontFamily: 'Geist, sans-serif',
                    marginBottom: 8,
                  }}>
                  <span>3 segments • 42 characters</span>
                  <span>Opus 4.6</span>
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
              </div>
            </Card>
            <FeatureLabel text="Full Mode" delay={5} position="top-right" />
          </div>
        </FadeIn>
      )}

      {/* Variant 2: Compact mode */}
      {showVariant2 && (
        <div
          style={{
            opacity: interpolate(transition2, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(transition2, [0, 1], [30, 0])}px)`,
          }}>
          <div style={{ position: 'relative' }}>
            <Card width={760} padding={22} paddingX={26}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <div style={{ flex: 1 }}>{sampleContent}</div>
                {/* Inline send button */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                  </svg>
                </div>
              </div>
            </Card>
            <FeatureLabel text="Compact Mode" delay={5} position="top-right" />
          </div>
        </div>
      )}

      {/* Variant 3: Chat layout */}
      {showVariant3 && (
        <div
          style={{
            opacity: interpolate(transition3, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(transition3, [0, 1], [20, 0])}px)`,
          }}>
          <div style={{ position: 'relative' }}>
            {/* Chat messages above */}
            <div
              style={{
                width: 960,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 16,
              }}>
              {/* AI message bubble */}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '18px 24px',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: '#f5f5f5',
                  fontSize: 26,
                  color: '#0f0f0f',
                  fontFamily: 'Geist, sans-serif',
                  lineHeight: 1.5,
                }}>
                Here&apos;s the campaign summary. What would you like me to refine?
              </div>
            </div>

            {/* Prompt area at bottom */}
            <Card width={960} padding={22} paddingX={26}>
              <div style={{ marginBottom: 12 }}>{sampleContent}</div>
              <div
                style={{
                  height: 1,
                  backgroundColor: '#f0f0f0',
                  width: '100%',
                  marginBottom: 10,
                }}
              />
              <ActionBar />
            </Card>
            <FeatureLabel text="Chat Layout" delay={5} position="top-right" />
          </div>
        </div>
      )}
    </div>
  )
}

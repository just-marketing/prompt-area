import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Cursor } from '../../../design/Cursor'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const TYPING_TEXT = 'Build an AI-powered customer support chatbot'
const TYPING_START = 5
const TYPING_SPEED = 2 // frames per char
const CURSOR_ARRIVE_FRAME = 50
const CLICK_FRAME = 62

const SEND_BUTTON_RIGHT = 40 // card paddingX
const SEND_BUTTON_BOTTOM = 36 // card padding

export const TypingDemoScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const charsTyped = Math.min(
    TYPING_TEXT.length,
    Math.floor(Math.max(0, frame - TYPING_START) / TYPING_SPEED),
  )

  const isTyping = charsTyped > 0 && charsTyped < TYPING_TEXT.length

  // Hand cursor animation toward send button
  const cursorProgress = spring({
    frame: Math.max(0, frame - CURSOR_ARRIVE_FRAME),
    fps,
    config: springs.entrance,
  })

  const showHandCursor = frame >= CURSOR_ARRIVE_FRAME
  const handX = interpolate(cursorProgress, [0, 1], [200, 0])
  const handY = interpolate(cursorProgress, [0, 1], [100, 0])
  const handOpacity = interpolate(cursorProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Click glow on send button
  const clickProgress = spring({
    frame: Math.max(0, frame - CLICK_FRAME),
    fps,
    config: springs.chipPop,
  })

  const showGlow = frame >= CLICK_FRAME
  const glowScale = interpolate(clickProgress, [0, 1], [0.5, 1.8])
  const glowOpacity = interpolate(clickProgress, [0, 0.5, 1], [0, 0.5, 0], {
    extrapolateRight: 'clamp',
  })

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
        <div style={{ position: 'relative' }}>
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
              }}>
              <span>{TYPING_TEXT.slice(0, charsTyped)}</span>
              <Cursor visible={isTyping ? true : undefined} color="#0f0f0f" />
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

            {/* Action bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              {/* Left buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionBarButton label="+" />
                <ActionBarButton label="Edit" icon={<PencilIcon />} />
                <ActionBarButton label="Chat" icon={<AtomIcon />} />
              </div>

              {/* Right: Send button with glow */}
              <div style={{ position: 'relative' }}>
                {showGlow && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                      opacity: glowOpacity,
                      transform: `translate(-50%, -50%) scale(${glowScale})`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#18181b',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                  <ArrowUpIcon />
                </div>
              </div>
            </div>
          </Card>

          {/* Hand cursor */}
          {showHandCursor && (
            <div
              style={{
                position: 'absolute',
                bottom: SEND_BUTTON_BOTTOM + 4,
                right: SEND_BUTTON_RIGHT + 4,
                opacity: handOpacity,
                transform: `translate(${handX}px, ${handY}px)`,
                fontSize: 48,
                zIndex: 20,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}>
              <HandCursorSvg />
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}

const ActionBarButton: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 48,
      paddingLeft: icon ? 14 : 0,
      paddingRight: icon ? 14 : 0,
      minWidth: 48,
      borderRadius: 8,
      border: '1px solid #e5e5e5',
      color: '#a1a1aa',
      fontSize: 22,
      fontWeight: 500,
      fontFamily: 'Geist, sans-serif',
    }}>
    {icon}
    {label}
  </div>
)

const PencilIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#a1a1aa"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const AtomIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#a1a1aa"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
    <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
  </svg>
)

const ArrowUpIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ffffff"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
)

const HandCursorSvg: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 11V6a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v5l-1.8-1.8a1.8 1.8 0 0 0-2.5 2.5L7 19c1.5 1.5 3.5 2 5.5 2H14a6 6 0 0 0 6-6v-2a2 2 0 0 0-2-2Z"
      fill="#fbbf24"
      stroke="#92400e"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
)

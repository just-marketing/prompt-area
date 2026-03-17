import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { FadeIn } from '../../../design/FadeIn'

const TOGGLE_FRAME = 30

export const DarkModeScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const toggleProgress = spring({
    frame: Math.max(0, frame - TOGGLE_FRAME),
    fps,
    config: { damping: 18, stiffness: 120, mass: 1 },
  })

  // Interpolate between light and dark colors
  const bgColor = toggleProgress > 0.5 ? '#1a1a1a' : '#fafafa'
  const dotColor = toggleProgress > 0.5 ? '#333333' : '#e0e0e0'
  const cardBg = toggleProgress > 0.5 ? '#2a2a2a' : '#ffffff'
  const cardBorder = toggleProgress > 0.5 ? '#404040' : '#e5e5e5'
  const textColor = toggleProgress > 0.5 ? '#fafafa' : '#0f0f0f'
  const sepColor = toggleProgress > 0.5 ? '#333333' : '#f0f0f0'
  const theme = toggleProgress > 0.5 ? 'dark' : 'light'

  // Circle wipe effect
  const circleSize = interpolate(toggleProgress, [0, 1], [0, 2000])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Dark overlay circle expanding from toggle position */}
      {toggleProgress > 0 && toggleProgress < 1 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 100,
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            backgroundColor: '#1a1a1a',
            transform: 'translate(50%, -50%)',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ zIndex: 1 }}>
        <FadeIn delay={0} distance={15}>
          <Card
            theme={theme}
            width={960}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}>
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.6,
                color: textColor,
                fontFamily: 'Geist, sans-serif',
                marginBottom: 20,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
              }}>
              <Chip variant="command" label="/summarize" />
              <span>the campaign brief from</span>
              <Chip variant="mention" label="@Strategist" />
              <span>and</span>
              <Chip variant="mention" label="@Copywriter" />
            </div>

            <div
              style={{
                height: 1,
                backgroundColor: sepColor,
                width: '100%',
                marginBottom: 12,
              }}
            />
            <ActionBar theme={theme} />
          </Card>
        </FadeIn>

        {/* Toggle indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginTop: 28,
            fontFamily: 'Geist, sans-serif',
            fontSize: 22,
            color: textColor,
          }}>
          {/* Sun icon */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={toggleProgress > 0.5 ? '#666' : '#f59e0b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>

          {/* Toggle track */}
          <div
            style={{
              width: 60,
              height: 32,
              borderRadius: 16,
              backgroundColor: toggleProgress > 0.5 ? '#6366f1' : '#e5e5e5',
              position: 'relative',
              transition: 'background-color 0.3s',
            }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: 3,
                left: interpolate(toggleProgress, [0, 1], [3, 31]),
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>

          {/* Moon icon */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={toggleProgress > 0.5 ? '#818cf8' : '#666'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

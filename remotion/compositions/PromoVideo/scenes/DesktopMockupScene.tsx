import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { springs } from '../../../design/animation'
import { themeColors } from '../../../design/tokens'
import { FONT_FAMILY } from '../../../design/fonts'

const MONITOR_WIDTH = 960
const MONITOR_BEZEL = 18
const SCREEN_WIDTH = MONITOR_WIDTH - MONITOR_BEZEL * 2
const SCREEN_HEIGHT = 520
const STAND_WIDTH = 120
const STAND_HEIGHT = 60
const BASE_WIDTH = 200
const BASE_HEIGHT = 14

interface ChatMessage {
  text: string
  isUser: boolean
}

const MESSAGES: ChatMessage[] = [
  { text: 'Can you summarize this article for me?', isUser: true },
  {
    text: 'Sure! The article discusses how AI-powered tools are transforming developer productivity...',
    isUser: false,
  },
  { text: 'What are the key takeaways?', isUser: true },
]

const MESSAGE_STAGGER = 10
const FIRST_MSG_FRAME = 15

function ChatBubble({ message, delay }: { message: ChatMessage; delay: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs.dropdown,
  })

  const opacity = interpolate(progress, [0, 1], [0, 1])
  const y = interpolate(progress, [0, 1], [8, 0])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.isUser ? 'flex-end' : 'flex-start',
        opacity,
        transform: `translateY(${y}px)`,
      }}>
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 16px',
          borderRadius: 14,
          backgroundColor: message.isUser ? '#18181b' : '#f4f4f5',
          color: message.isUser ? '#fafafa' : '#0f0f0f',
          fontFamily: `${FONT_FAMILY}, sans-serif`,
          fontSize: 14,
          lineHeight: 1.5,
          fontWeight: 400,
        }}>
        {message.text}
      </div>
    </div>
  )
}

function MiniActionBar() {
  const c = themeColors('light')
  const btnSize = 28

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {['+', '@', '/'].map((label) => (
          <div
            key={label}
            style={{
              width: btnSize,
              height: btnSize,
              borderRadius: 6,
              border: `1px solid ${c.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: c.icon,
              fontFamily: `${FONT_FAMILY}, sans-serif`,
            }}>
            {label}
          </div>
        ))}
      </div>
      {/* Send button */}
      <div
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 7,
          backgroundColor: c.sendBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={c.sendIcon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </div>
    </div>
  )
}

function ScreenContent() {
  const c = themeColors('light')

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: `1px solid ${c.cardBorder}`,
        }}>
        <span
          style={{
            fontFamily: `${FONT_FAMILY}, sans-serif`,
            fontSize: 16,
            fontWeight: 700,
            color: c.text,
          }}>
          AI Chat
        </span>
        <div style={{ flex: 1 }} />
        {/* Dots menu */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: c.icon,
              }}
            />
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '16px 20px',
          overflowY: 'hidden' as const,
        }}>
        {MESSAGES.map((msg, i) => (
          <ChatBubble key={i} message={msg} delay={FIRST_MSG_FRAME + i * MESSAGE_STAGGER} />
        ))}
      </div>

      {/* Prompt Area at bottom */}
      <div
        style={{
          padding: '10px 16px 14px',
          borderTop: `1px solid ${c.cardBorder}`,
        }}>
        {/* Input placeholder */}
        <div
          style={{
            fontFamily: `${FONT_FAMILY}, sans-serif`,
            fontSize: 14,
            color: c.icon,
            marginBottom: 10,
          }}>
          Ask anything...
        </div>
        <MiniActionBar />
      </div>
    </div>
  )
}

export const DesktopMockupScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 1,
    },
  })

  const rotateY = interpolate(progress, [0, 1], [-15, -5])
  const rotateX = interpolate(progress, [0, 1], [8, 3])
  const scale = interpolate(progress, [0, 1], [0.8, 1])
  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#fafafa',
        perspective: 1200,
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
          opacity,
          transformStyle: 'preserve-3d' as const,
        }}>
        {/* Monitor frame */}
        <div
          style={{
            width: MONITOR_WIDTH,
            backgroundColor: '#333333',
            borderRadius: 16,
            padding: MONITOR_BEZEL,
            paddingBottom: MONITOR_BEZEL + 8,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)',
          }}>
          {/* Screen */}
          <div
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
            <ScreenContent />
          </div>
        </div>

        {/* Stand neck */}
        <div
          style={{
            width: STAND_WIDTH,
            height: STAND_HEIGHT,
            background: 'linear-gradient(180deg, #444 0%, #999 100%)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Stand base */}
        <div
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            borderRadius: 8,
            background: 'linear-gradient(180deg, #bbb 0%, #999 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </div>
  )
}

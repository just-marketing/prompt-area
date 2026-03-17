import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const SLIDE_IN_FRAME = 8

export const FileAttachScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const slideProgress = spring({
    frame: Math.max(0, frame - SLIDE_IN_FRAME),
    fps,
    config: springs.entrance,
  })

  const slideX = interpolate(slideProgress, [0, 1], [40, 0])
  const slideOpacity = interpolate(slideProgress, [0, 1], [0, 1])

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
          {/* File attachment card */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 16,
              opacity: slideOpacity,
              transform: `translateX(${slideX}px)`,
            }}>
            {/* File icon */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 10,
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 13H8" />
                <path d="M16 17H8" />
                <path d="M16 13h-2" />
              </svg>
            </div>

            {/* File info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Geist, sans-serif',
              }}>
              <div style={{ fontSize: 22, color: '#0f0f0f', fontWeight: 500 }}>
                Q4-2025-Report.pdf
              </div>
              <div style={{ fontSize: 18, color: '#71717a' }}>2.4 MB • PDF Document</div>
            </div>
          </div>

          {/* Text content */}
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
            }}>
            Please review the attached Q4 report and summarize the key findings.
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

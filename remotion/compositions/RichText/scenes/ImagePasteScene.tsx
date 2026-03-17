import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const PASTE_FRAME = 10
const SHIMMER_END = PASTE_FRAME + 30
const RESOLVE_FRAME = SHIMMER_END

export const ImagePasteScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const pasteProgress = spring({
    frame: Math.max(0, frame - PASTE_FRAME),
    fps,
    config: springs.entrance,
  })

  const isShimmering = frame >= PASTE_FRAME && frame < RESOLVE_FRAME
  const isResolved = frame >= RESOLVE_FRAME

  const resolveProgress = isResolved
    ? spring({
        frame: Math.max(0, frame - RESOLVE_FRAME),
        fps,
        config: springs.chipPop,
      })
    : 0

  // Shimmer animation
  const shimmerX = isShimmering ? interpolate(frame - PASTE_FRAME, [0, 30], [-100, 200]) : 0

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
          {/* Image strip above text */}
          {frame >= PASTE_FRAME && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 16,
                opacity: interpolate(pasteProgress, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(pasteProgress, [0, 1], [-10, 0])}px)`,
              }}>
              {/* Image thumbnail placeholder */}
              <div
                style={{
                  width: 160,
                  height: 106,
                  borderRadius: 10,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #e5e5e5',
                  backgroundColor: isResolved ? '#f0f4ff' : '#f5f5f5',
                }}>
                {isShimmering && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: shimmerX,
                      width: 60,
                      height: '100%',
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    }}
                  />
                )}
                {isResolved && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: resolveProgress,
                    }}>
                    {/* Image icon */}
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Filename label */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  fontFamily: 'Geist, sans-serif',
                }}>
                <div style={{ fontSize: 22, color: '#0f0f0f', fontWeight: 500 }}>
                  screenshot.png
                </div>
                <div style={{ fontSize: 18, color: '#71717a' }}>Pasted from clipboard</div>
              </div>
            </div>
          )}

          {/* Text content */}
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
            }}>
            Here&apos;s the screenshot of the dashboard:
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

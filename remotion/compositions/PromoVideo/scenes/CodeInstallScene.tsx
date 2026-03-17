import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { Cursor } from '../../../design/Cursor'
import { springs } from '../../../design/animation'

const COMMAND = 'npm install prompt-area'
const TYPING_SPEED = 2 // frames per char
const TYPING_END = COMMAND.length * TYPING_SPEED
const INSTALLING_FRAME = TYPING_END + 10
const DONE_FRAME = INSTALLING_FRAME + 30

export const CodeInstallScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const charsTyped = Math.min(COMMAND.length, Math.floor(Math.max(0, frame - 5) / TYPING_SPEED))

  const isInstalling = frame >= INSTALLING_FRAME && frame < DONE_FRAME
  const isDone = frame >= DONE_FRAME

  const checkProgress = isDone
    ? spring({
        frame: Math.max(0, frame - DONE_FRAME),
        fps,
        config: springs.chipPop,
      })
    : 0

  const spinnerAngle = isInstalling ? (frame - INSTALLING_FRAME) * 12 : 0

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
        {/* Terminal card */}
        <div
          style={{
            width: 880,
            backgroundColor: '#1e1e1e',
            borderRadius: 16,
            border: '1px solid #333',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
          {/* Terminal header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '18px 26px',
              borderBottom: '1px solid #333',
            }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#ff5f57',
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#febc2e',
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#28c840',
              }}
            />
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 18,
                color: '#666',
                fontFamily: 'Geist Mono, monospace',
              }}>
              Terminal
            </div>
          </div>

          {/* Terminal body */}
          <div
            style={{
              padding: '32px 36px',
              fontFamily: 'Geist Mono, monospace',
              fontSize: 26,
              lineHeight: 1.8,
            }}>
            {/* Prompt line */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#28c840' }}>$</span>
              <span style={{ color: '#e0e0e0', marginLeft: 10 }}>
                {COMMAND.slice(0, charsTyped)}
              </span>
              {charsTyped < COMMAND.length && <Cursor color="#e0e0e0" height={28} />}
            </div>

            {/* Installing line */}
            {isInstalling && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#a1a1aa',
                  marginTop: 4,
                }}>
                <span
                  style={{
                    display: 'inline-block',
                    transform: `rotate(${spinnerAngle}deg)`,
                  }}>
                  ⠋
                </span>
                <span>Installing prompt-area...</span>
              </div>
            )}

            {/* Done line */}
            {isDone && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 4,
                  opacity: checkProgress,
                  transform: `translateY(${interpolate(checkProgress, [0, 1], [5, 0])}px)`,
                }}>
                <span style={{ color: '#28c840', fontSize: 28 }}>✓</span>
                <span style={{ color: '#28c840' }}>Done. Component added successfully.</span>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

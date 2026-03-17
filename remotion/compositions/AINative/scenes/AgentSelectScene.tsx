import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Cursor } from '../../../design/Cursor'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

const AGENTS = [
  { name: '@Strategist', emoji: '🎯', desc: 'Campaign planning & briefs' },
  { name: '@Copywriter', emoji: '✍️', desc: 'Content & messaging' },
  { name: '@Analyst', emoji: '📊', desc: 'Data insights & reporting' },
]

const TYPING = '@'
const TYPING_SPEED = 3

export const AgentSelectScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const charsTyped = Math.min(TYPING.length, Math.floor(Math.max(0, frame - 8) / TYPING_SPEED))
  const showDropdown = charsTyped >= 1 && frame < 70

  const dropdownProgress = showDropdown
    ? spring({
        frame: Math.max(0, frame - 12),
        fps,
        config: springs.dropdown,
      })
    : 0

  // Highlight moves down through items
  const highlightIdx = frame < 35 ? 0 : frame < 50 ? 1 : 0

  // Select happens at frame 60
  const selected = frame >= 60

  const chipProgress = selected
    ? spring({ frame: Math.max(0, frame - 60), fps, config: springs.chipPop })
    : 0

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
          {/* Title label */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#a1a1aa',
              textTransform: 'uppercase' as const,
              letterSpacing: '1.2px',
              marginBottom: 20,
              fontFamily: 'Geist, sans-serif',
            }}>
            Select an AI Agent
          </div>

          {/* Input area */}
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
            {selected ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '6px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 32,
                  transform: `scale(${interpolate(chipProgress, [0, 1], [0.6, 1])})`,
                  opacity: chipProgress,
                }}>
                🎯 @Strategist
              </span>
            ) : (
              <>
                <span style={{ color: '#1d4ed8' }}>{TYPING.slice(0, charsTyped)}</span>
                <Cursor color="#1d4ed8" height={36} />
              </>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && !selected && (
            <div
              style={{
                position: 'absolute',
                left: 32,
                right: 32,
                backgroundColor: '#fff',
                borderRadius: 12,
                border: '1px solid #e5e5e5',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                opacity: dropdownProgress,
                transform: `translateY(${interpolate(dropdownProgress, [0, 1], [-8, 0])}px)`,
              }}>
              {AGENTS.map((agent, i) => (
                <div
                  key={agent.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 24px',
                    backgroundColor: i === highlightIdx ? '#f0f7ff' : 'transparent',
                    fontFamily: 'Geist, sans-serif',
                  }}>
                  <span style={{ fontSize: 32 }}>{agent.emoji}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 600,
                        color: '#0f0f0f',
                      }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 20, color: '#71717a' }}>{agent.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              height: 1,
              backgroundColor: '#f0f0f0',
              width: '100%',
              marginBottom: 20,
            }}
          />
          <ActionBar />
        </Card>
      </FadeIn>
    </div>
  )
}

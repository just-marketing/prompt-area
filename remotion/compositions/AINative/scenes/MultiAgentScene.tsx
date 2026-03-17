import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { Chip } from '../../../design/Chip'
import { ActionBar } from '../../../design/ActionBar'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'

export const MultiAgentScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const chip1Frame = 10
  const chip2Frame = 22
  const chip3Frame = 34
  const textFrame = 46

  const textProgress = spring({
    frame: Math.max(0, frame - textFrame),
    fps,
    config: springs.entrance,
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
        <Card width={820}>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
            }}>
            {frame >= chip1Frame && (
              <Chip variant="mention" label="@Strategist" enterFrame={chip1Frame} />
            )}
            {frame >= chip2Frame && (
              <Chip variant="mention" label="@Copywriter" enterFrame={chip2Frame} />
            )}
            {frame >= chip3Frame && (
              <Chip variant="mention" label="@Analyst" enterFrame={chip3Frame} />
            )}
            {frame >= textFrame && (
              <span
                style={{
                  opacity: interpolate(textProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(textProgress, [0, 1], [8, 0])}px)`,
                }}>
                Collaborate on the Q4 launch strategy
              </span>
            )}
          </div>

          {/* Multi-agent status pills */}
          {frame >= 60 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}>
              {[
                { label: '3 agents', color: '#6366f1', bg: '#eef2ff' },
                { label: 'parallel execution', color: '#059669', bg: '#ecfdf5' },
                { label: 'shared context', color: '#d97706', bg: '#fffbeb' },
              ].map((pill, i) => {
                const pillProgress = spring({
                  frame: Math.max(0, frame - 60 - i * 8),
                  fps,
                  config: springs.chipPop,
                })
                return (
                  <div
                    key={pill.label}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      backgroundColor: pill.bg,
                      color: pill.color,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'Geist, sans-serif',
                      opacity: pillProgress,
                      transform: `scale(${interpolate(pillProgress, [0, 1], [0.7, 1])})`,
                    }}>
                    {pill.label}
                  </div>
                )
              })}
            </div>
          )}

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

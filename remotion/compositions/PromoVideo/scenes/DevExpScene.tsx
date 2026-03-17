import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { FadeIn } from '../../../design/FadeIn'
import { springs } from '../../../design/animation'
import { FONT_FAMILY, MONO_FONT_FAMILY } from '../../../design/fonts'

/** Syntax-highlighted code token */
interface CodeToken {
  text: string
  color: string
}

type CodeLine = CodeToken[]

const SYNTAX = {
  keyword: '#93c5fd',
  string: '#86efac',
  prop: '#fdba74',
  component: '#fde68a',
  punctuation: '#d4d4d4',
  text: '#e5e5e5',
} as const

const CODE_LINES: CodeLine[] = [
  [
    { text: 'import', color: SYNTAX.keyword },
    { text: ' { ', color: SYNTAX.punctuation },
    { text: 'PromptArea', color: SYNTAX.component },
    { text: ' } ', color: SYNTAX.punctuation },
    { text: 'from', color: SYNTAX.keyword },
    { text: " '", color: SYNTAX.punctuation },
    { text: 'prompt-area', color: SYNTAX.string },
    { text: "'", color: SYNTAX.punctuation },
  ],
  [], // blank line
  [
    { text: '<', color: SYNTAX.punctuation },
    { text: 'PromptArea', color: SYNTAX.component },
  ],
  [
    { text: '  mentions', color: SYNTAX.prop },
    { text: '={mentionItems}', color: SYNTAX.punctuation },
  ],
  [
    { text: '  commands', color: SYNTAX.prop },
    { text: '={commandList}', color: SYNTAX.punctuation },
  ],
  [
    { text: '  onSubmit', color: SYNTAX.prop },
    { text: '={handleSubmit}', color: SYNTAX.punctuation },
  ],
  [
    { text: '  theme', color: SYNTAX.prop },
    { text: '=', color: SYNTAX.punctuation },
    { text: '"dark"', color: SYNTAX.string },
  ],
  [{ text: '/>', color: SYNTAX.punctuation }],
]

const CODE_START_FRAME = 5
const FRAMES_PER_LINE = 5
const BADGE_START_FRAME = 20

interface Badge {
  label: string
  bg: string
  color: string
}

const BADGES: Badge[] = [
  { label: 'TypeScript', bg: '#dbeafe', color: '#1e40af' },
  { label: 'Tree-shakeable', bg: '#dcfce7', color: '#166534' },
  { label: 'Zero deps', bg: '#ede9fe', color: '#5b21b6' },
]

const BADGE_STAGGER = 8

function SyntaxLine({ tokens, delay }: { tokens: CodeLine; delay: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs.dropdown,
  })

  const opacity = interpolate(progress, [0, 1], [0, 1])
  const y = interpolate(progress, [0, 1], [10, 0])

  if (tokens.length === 0) {
    return <div style={{ height: 28 }} />
  }

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        whiteSpace: 'pre',
        lineHeight: 1.7,
      }}>
      {tokens.map((token, i) => (
        <span key={i} style={{ color: token.color }}>
          {token.text}
        </span>
      ))}
    </div>
  )
}

function FeatureBadge({ badge, delay }: { badge: Badge; delay: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springs.chipPop,
  })

  const scale = interpolate(progress, [0, 1], [0.5, 1])
  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '12px 24px',
        borderRadius: 50,
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: `${FONT_FAMILY}, sans-serif`,
        fontSize: 22,
        fontWeight: 600,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
      {badge.label}
    </div>
  )
}

export const DevExpScene: React.FC = () => {
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
          alignItems: 'center',
          gap: 50,
        }}>
        {/* Code editor mock */}
        <FadeIn delay={0} direction="left" distance={40} preset="entrance">
          <div
            style={{
              width: 550,
              backgroundColor: '#1e1e1e',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
            }}>
            {/* Terminal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 18px',
                borderBottom: '1px solid #333',
              }}>
              <div
                style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }}
              />
              <div
                style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }}
              />
              <div
                style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }}
              />
              <span
                style={{
                  marginLeft: 12,
                  fontFamily: `${MONO_FONT_FAMILY}, monospace`,
                  fontSize: 13,
                  color: '#71717a',
                }}>
                App.tsx
              </span>
            </div>

            {/* Code content */}
            <div
              style={{
                padding: '22px 26px',
                fontFamily: `${MONO_FONT_FAMILY}, monospace`,
                fontSize: 18,
              }}>
              {CODE_LINES.map((line, i) => (
                <SyntaxLine key={i} tokens={line} delay={CODE_START_FRAME + i * FRAMES_PER_LINE} />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'flex-start',
          }}>
          {BADGES.map((badge, i) => (
            <FeatureBadge
              key={badge.label}
              badge={badge}
              delay={BADGE_START_FRAME + i * BADGE_STAGGER}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

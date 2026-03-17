import React from 'react'
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { Card } from '../../../design/Card'
import { FadeIn } from '../../../design/FadeIn'
import { ActionBar } from '../../../design/ActionBar'
import { springs } from '../../../design/animation'
import { themeColors, typography } from '../../../design/tokens'
import { FONT_FAMILY } from '../../../design/fonts'

interface FileAttachment {
  icon: string
  name: string
  size: string
  preview?: React.CSSProperties
}

const ATTACHMENTS: FileAttachment[] = [
  {
    icon: '📄',
    name: 'report.pdf',
    size: '2.4 MB',
  },
  {
    icon: '🖼️',
    name: 'screenshot.png',
    size: '1.2 MB',
    preview: {
      background: 'linear-gradient(135deg, #86efac, #93c5fd)',
    },
  },
]

const TEXT_APPEAR_FRAME = 0
const FIRST_FILE_FRAME = 10
const SECOND_FILE_FRAME = 25

function FileCard({ attachment, delay }: { attachment: FileAttachment; delay: number }) {
  const c = themeColors('light')

  return (
    <FadeIn delay={delay} direction="up" distance={20} preset="dropdown">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 12,
          backgroundColor: '#f4f4f5',
          border: `1px solid ${c.cardBorder}`,
        }}>
        {/* Icon / Preview */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
            ...(attachment.preview ?? { backgroundColor: '#e4e4e7' }),
          }}>
          {!attachment.preview && attachment.icon}
        </div>

        {/* File info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: `${FONT_FAMILY}, sans-serif`,
              fontSize: 18,
              fontWeight: 600,
              color: c.text,
              lineHeight: 1.3,
            }}>
            {attachment.name}
          </span>
          <span
            style={{
              fontFamily: `${FONT_FAMILY}, sans-serif`,
              fontSize: 14,
              fontWeight: 400,
              color: c.icon,
              lineHeight: 1.3,
            }}>
            {attachment.size}
          </span>
        </div>
      </div>
    </FadeIn>
  )
}

export const AttachmentScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = themeColors('light')

  const textProgress = spring({
    frame: Math.max(0, frame - TEXT_APPEAR_FRAME),
    fps,
    config: springs.entrance,
  })
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1])

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
      <Card width={900} padding={28} paddingX={32}>
        {/* Input text area */}
        <div
          style={{
            fontFamily: `${FONT_FAMILY}, sans-serif`,
            fontSize: typography.body.fontSize,
            fontWeight: typography.body.fontWeight,
            lineHeight: typography.body.lineHeight,
            color: c.text,
            opacity: textOpacity,
            minHeight: 48,
            marginBottom: 16,
          }}>
          Analyze this document
        </div>

        {/* Attachments row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}>
          <FileCard attachment={ATTACHMENTS[0]} delay={FIRST_FILE_FRAME} />
          <FileCard attachment={ATTACHMENTS[1]} delay={SECOND_FILE_FRAME} />
        </div>

        {/* Separator */}
        <div
          style={{
            height: 1,
            backgroundColor: c.separator,
            marginBottom: 16,
          }}
        />

        {/* Action bar */}
        <FadeIn delay={FIRST_FILE_FRAME + 5} direction="none">
          <ActionBar theme="light" />
        </FadeIn>
      </Card>
    </div>
  )
}

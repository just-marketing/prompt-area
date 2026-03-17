import React from 'react'
import { useCurrentFrame } from 'remotion'
import { Cursor } from './Cursor'
import { colors } from './tokens'

export interface TypewriterSegment {
  text: string
  style?: React.CSSProperties
  /** Pause for this many frames after this segment finishes typing */
  pauseAfter?: number
}

interface TypewriterTextProps {
  segments: TypewriterSegment[]
  /** Frame at which typing begins */
  startFrame: number
  /** Characters per frame (e.g., 0.5 = 1 char every 2 frames) */
  speed?: number
  /** Show blinking cursor at end */
  showCursor?: boolean
  /** Cursor color */
  cursorColor?: string
  /** Base text style */
  style?: React.CSSProperties
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  segments,
  startFrame,
  speed = 0.5,
  showCursor = true,
  cursorColor = colors.light.text,
  style,
}) => {
  const frame = useCurrentFrame()
  const elapsed = Math.max(0, frame - startFrame)

  // Calculate total chars including pauses
  let totalCharsTyped = 0
  let framesBudget = elapsed

  const renderedSegments: React.ReactNode[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const segLength = seg.text.length

    if (framesBudget <= 0) break

    const charsInThisSegment = Math.min(segLength, Math.floor(framesBudget * speed))

    if (charsInThisSegment > 0) {
      renderedSegments.push(
        <span key={i} style={seg.style}>
          {seg.text.slice(0, charsInThisSegment)}
        </span>,
      )
    }

    totalCharsTyped += charsInThisSegment

    // Consume frames for the characters typed
    const framesUsed = charsInThisSegment / speed
    framesBudget -= framesUsed

    // If segment is fully typed, consume pause frames
    if (charsInThisSegment >= segLength && seg.pauseAfter) {
      framesBudget -= seg.pauseAfter
    }
  }

  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  const isTyping = totalCharsTyped < totalChars && elapsed > 0
  const isDone = totalCharsTyped >= totalChars

  return (
    <span
      style={{
        display: 'inline',
        fontSize: 32,
        lineHeight: 1.6,
        fontFamily: 'Geist, sans-serif',
        ...style,
      }}>
      {renderedSegments}
      {showCursor && !isDone && (
        <Cursor visible={isTyping ? true : undefined} color={cursorColor} />
      )}
    </span>
  )
}

/** Helper: get the frame at which the typewriter finishes all segments */
export function typewriterEndFrame(
  segments: TypewriterSegment[],
  startFrame: number,
  speed: number = 0.5,
): number {
  let totalFrames = 0
  for (const seg of segments) {
    totalFrames += seg.text.length / speed
    if (seg.pauseAfter) totalFrames += seg.pauseAfter
  }
  return startFrame + Math.ceil(totalFrames)
}

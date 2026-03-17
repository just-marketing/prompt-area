import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { GeometricBackground } from '../../design/GeometricBackground'
import { springs } from '../../design/animation'
import { IntroScene } from './scenes/IntroScene'
import { AgentSelectScene } from './scenes/AgentSelectScene'
import { StreamingScene } from './scenes/StreamingScene'
import { MultiAgentScene } from './scenes/MultiAgentScene'
import { ContextWindowScene } from './scenes/ContextWindowScene'
import { OutroScene } from './scenes/OutroScene'

const TRANSITION_DURATION = 15

/**
 * Wraps a scene to fade its content in/out independently of the
 * TransitionSeries fade, preventing content overlap during transitions.
 */
const SceneWrap: React.FC<{
  children: React.ReactNode
  durationInFrames: number
  noEntry?: boolean
  noExit?: boolean
}> = ({ children, durationInFrames, noEntry, noExit }) => {
  const frame = useCurrentFrame()
  const T = TRANSITION_DURATION

  const entryOpacity = noEntry
    ? 1
    : interpolate(frame, [0, T], [0, 1], { extrapolateRight: 'clamp' })
  const exitOpacity = noExit
    ? 1
    : interpolate(frame, [durationInFrames - T, durationInFrames], [1, 0], {
        extrapolateRight: 'clamp',
      })

  return <AbsoluteFill style={{ opacity: entryOpacity * exitOpacity }}>{children}</AbsoluteFill>
}

const transition = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={springTiming({
      config: springs.sceneTransition,
      durationInFrames: TRANSITION_DURATION,
    })}
  />
)

/**
 * Video 4: "AI-Native"
 * Hexagonal grid background. Shows agent selection, streaming responses,
 * multi-agent orchestration, and context window visualization.
 * 1080x1080, 30fps, 450 frames (15 seconds)
 *
 * Timing: 50+110+120+105+80+60 = 525 - 5×15 = 450 total
 */
export const AINative: React.FC = () => {
  useFonts()

  return (
    <AbsoluteFill>
      <GeometricBackground
        pattern="hexagons"
        animated
        accentColor="#6366f1"
        patternOpacity={0.15}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={50}>
          <SceneWrap durationInFrames={50} noEntry>
            <IntroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneWrap durationInFrames={110}>
            <AgentSelectScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneWrap durationInFrames={120}>
            <StreamingScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <MultiAgentScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={80}>
          <SceneWrap durationInFrames={80}>
            <ContextWindowScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <SceneWrap durationInFrames={60} noExit>
            <OutroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

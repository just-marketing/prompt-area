import React from 'react'
import { AbsoluteFill } from 'remotion'
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
          <IntroScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <AgentSelectScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={120}>
          <StreamingScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <MultiAgentScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={80}>
          <ContextWindowScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

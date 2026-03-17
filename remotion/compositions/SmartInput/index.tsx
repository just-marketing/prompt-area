import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { Background } from '../../design/Background'
import { springs } from '../../design/animation'
import { IntroScene } from './scenes/IntroScene'
import { MentionScene } from './scenes/MentionScene'
import { CommandScene } from './scenes/CommandScene'
import { TagScene } from './scenes/TagScene'
import { FullCardScene } from './scenes/FullCardScene'
import { OutroScene } from './scenes/OutroScene'

const TRANSITION_DURATION = 15

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
 * Video 1: "Smart Input for AI"
 * Shows @mentions, /commands, #tags — the core trigger → dropdown → chip flow.
 * 1080x1080, 30fps, 450 frames (15 seconds)
 *
 * Timing: 50+105+105+105+95+65 = 525 scene frames - 5×15 = 75 overlap = 450 total
 */
export const SmartInput: React.FC = () => {
  useFonts()

  return (
    <AbsoluteFill>
      <Background animated />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={50}>
          <SceneWrap durationInFrames={50} noEntry>
            <IntroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <MentionScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <CommandScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <TagScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={95}>
          <SceneWrap durationInFrames={95}>
            <FullCardScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={65}>
          <SceneWrap durationInFrames={65} noExit>
            <OutroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

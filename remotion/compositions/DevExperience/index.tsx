import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { Background } from '../../design/Background'
import { springs } from '../../design/animation'
import { IntroScene } from './scenes/IntroScene'
import { InstallScene } from './scenes/InstallScene'
import { DarkModeScene } from './scenes/DarkModeScene'
import { ComposableScene } from './scenes/ComposableScene'
import { SegmentsScene } from './scenes/SegmentsScene'
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
 * Video 3: "Developer Experience"
 * Shows shadcn install, dark mode, composable layouts, segments API.
 * 1080x1080, 30fps, 450 frames (15 seconds)
 *
 * Timing: 50+115+115+125+60+60 = 525 scene frames - 5×15 = 75 overlap = 450 total
 */
export const DevExperience: React.FC = () => {
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

        <TransitionSeries.Sequence durationInFrames={115}>
          <SceneWrap durationInFrames={115}>
            <InstallScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={115}>
          <SceneWrap durationInFrames={115}>
            <DarkModeScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={125}>
          <ComposableScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <SegmentsScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

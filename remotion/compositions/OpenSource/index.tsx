import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { GeometricBackground } from '../../design/GeometricBackground'
import { springs } from '../../design/animation'
import { IntroScene } from './scenes/IntroScene'
import { StatsScene } from './scenes/StatsScene'
import { InstallMethodsScene } from './scenes/InstallMethodsScene'
import { FrameworksScene } from './scenes/FrameworksScene'
import { ContributorsScene } from './scenes/ContributorsScene'
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
 * Video 6: "Open Source"
 * Floating circles background. Shows GitHub stats, install methods,
 * framework support, and community contributions.
 * 1080x1080, 30fps, 450 frames (15 seconds)
 *
 * Timing: 50+100+110+110+95+60 = 525 - 5×15 = 450 total
 */
export const OpenSource: React.FC = () => {
  useFonts()

  return (
    <AbsoluteFill>
      <GeometricBackground pattern="circles" animated accentColor="#10b981" patternOpacity={0.2} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={50}>
          <SceneWrap durationInFrames={50} noEntry>
            <IntroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={100}>
          <SceneWrap durationInFrames={100}>
            <StatsScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneWrap durationInFrames={110}>
            <InstallMethodsScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneWrap durationInFrames={110}>
            <FrameworksScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={95}>
          <SceneWrap durationInFrames={95}>
            <ContributorsScene />
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

import React from 'react'
import { AbsoluteFill } from 'remotion'
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
          <IntroScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={100}>
          <StatsScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <InstallMethodsScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <FrameworksScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={95}>
          <ContributorsScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

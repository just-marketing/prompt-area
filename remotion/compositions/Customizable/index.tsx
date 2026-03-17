import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { GeometricBackground } from '../../design/GeometricBackground'
import { springs } from '../../design/animation'
import { IntroScene } from './scenes/IntroScene'
import { BrandThemeScene } from './scenes/BrandThemeScene'
import { CustomTriggersScene } from './scenes/CustomTriggersScene'
import { ActionBarScene } from './scenes/ActionBarScene'
import { LayoutsScene } from './scenes/LayoutsScene'
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
 * Video 5: "Fully Customizable"
 * Diamond pattern background. Shows brand theming, custom triggers,
 * configurable action bar, and layout variants.
 * 1080x1080, 30fps, 450 frames (15 seconds)
 *
 * Timing: 50+105+110+105+95+60 = 525 - 5×15 = 450 total
 */
export const Customizable: React.FC = () => {
  useFonts()

  return (
    <AbsoluteFill>
      <GeometricBackground
        pattern="diamonds"
        animated
        accentColor="#d97706"
        patternOpacity={0.18}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={50}>
          <SceneWrap durationInFrames={50} noEntry>
            <IntroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <BrandThemeScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneWrap durationInFrames={110}>
            <CustomTriggersScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneWrap durationInFrames={105}>
            <ActionBarScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={95}>
          <LayoutsScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={60}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

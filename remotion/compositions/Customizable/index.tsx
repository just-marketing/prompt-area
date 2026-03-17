import React from 'react'
import { AbsoluteFill } from 'remotion'
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
          <IntroScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <BrandThemeScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={110}>
          <CustomTriggersScene />
        </TransitionSeries.Sequence>

        {transition}

        <TransitionSeries.Sequence durationInFrames={105}>
          <ActionBarScene />
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

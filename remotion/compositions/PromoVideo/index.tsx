import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useFonts } from '../../design/fonts'
import { Background } from '../../design/Background'
import { springs } from '../../design/animation'
import { HookTextScene } from './scenes/HookTextScene'
import { BrandIntroScene } from './scenes/BrandIntroScene'
import { TypingDemoScene } from './scenes/TypingDemoScene'
import { MentionDemoScene } from './scenes/MentionDemoScene'
import { CommandDemoScene } from './scenes/CommandDemoScene'
import { RichTextDemoScene } from './scenes/RichTextDemoScene'
import { AttachmentScene } from './scenes/AttachmentScene'
import { CodeInstallScene } from './scenes/CodeInstallScene'
import { DarkModeScene } from './scenes/DarkModeScene'
import { DevExpScene } from './scenes/DevExpScene'
import { DesktopMockupScene } from './scenes/DesktopMockupScene'
import { WordFlashScene } from './scenes/WordFlashScene'
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
 * Video 7: "Prompt Area Promo" (Shipper-style)
 * Hook → Brand intro → Product demo → Feature showcase → Outro
 * 1280x720, 30fps, ~810 frames (~27 seconds)
 *
 * Scene durations (including transition overlap):
 * 75 + 55 + 85 + 65 + 65 + 65 + 55 + 55 + 55 + 55 + 70 + 50 + 150 = 1000
 * Minus 12 transitions × 15 = 180 overlap
 * Total: ~820 frames
 */
export const PromoVideo: React.FC = () => {
  useFonts()

  return (
    <AbsoluteFill>
      <Background animated />

      <TransitionSeries>
        {/* Scene 1: Hook - "Building AI apps is hard" */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <SceneWrap durationInFrames={75} noEntry>
            <HookTextScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 2: Brand - "Prompt Area makes it easy" */}
        <TransitionSeries.Sequence durationInFrames={55}>
          <SceneWrap durationInFrames={55}>
            <BrandIntroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 3: Typing demo with send */}
        <TransitionSeries.Sequence durationInFrames={85}>
          <SceneWrap durationInFrames={85}>
            <TypingDemoScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 4: @mention feature */}
        <TransitionSeries.Sequence durationInFrames={65}>
          <SceneWrap durationInFrames={65}>
            <MentionDemoScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 5: /command feature */}
        <TransitionSeries.Sequence durationInFrames={65}>
          <SceneWrap durationInFrames={65}>
            <CommandDemoScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 6: Rich text */}
        <TransitionSeries.Sequence durationInFrames={65}>
          <SceneWrap durationInFrames={65}>
            <RichTextDemoScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 7: Attachments */}
        <TransitionSeries.Sequence durationInFrames={55}>
          <SceneWrap durationInFrames={55}>
            <AttachmentScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 8: npm install */}
        <TransitionSeries.Sequence durationInFrames={55}>
          <SceneWrap durationInFrames={55}>
            <CodeInstallScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 9: Dark mode */}
        <TransitionSeries.Sequence durationInFrames={55}>
          <SceneWrap durationInFrames={55}>
            <DarkModeScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 10: Developer experience */}
        <TransitionSeries.Sequence durationInFrames={55}>
          <SceneWrap durationInFrames={55}>
            <DevExpScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 11: Desktop mockup */}
        <TransitionSeries.Sequence durationInFrames={70}>
          <SceneWrap durationInFrames={70}>
            <DesktopMockupScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 12: Word flash - TURN IDEAS INTO PRODUCTS */}
        <TransitionSeries.Sequence durationInFrames={50}>
          <SceneWrap durationInFrames={50}>
            <WordFlashScene />
          </SceneWrap>
        </TransitionSeries.Sequence>

        {transition}

        {/* Scene 13: Outro */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneWrap durationInFrames={150} noExit>
            <OutroScene />
          </SceneWrap>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

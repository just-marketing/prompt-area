import React from 'react'
import { Composition } from 'remotion'
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, VIDEO_DURATION_FRAMES } from './design/tokens'
import { SmartInput } from './compositions/SmartInput'
import { RichText } from './compositions/RichText'
import { DevExperience } from './compositions/DevExperience'
import { AINative } from './compositions/AINative'
import { Customizable } from './compositions/Customizable'
import { OpenSource } from './compositions/OpenSource'
import { PromoVideo } from './compositions/PromoVideo'

const shared = {
  durationInFrames: VIDEO_DURATION_FRAMES,
  fps: VIDEO_FPS,
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
}

const PROMO_WIDTH = 1280
const PROMO_HEIGHT = 720
const PROMO_FPS = 30
const PROMO_DURATION = 820

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="SmartInput" component={SmartInput} {...shared} />
      <Composition id="RichText" component={RichText} {...shared} />
      <Composition id="DevExperience" component={DevExperience} {...shared} />
      <Composition id="AINative" component={AINative} {...shared} />
      <Composition id="Customizable" component={Customizable} {...shared} />
      <Composition id="OpenSource" component={OpenSource} {...shared} />
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={PROMO_DURATION}
        fps={PROMO_FPS}
        width={PROMO_WIDTH}
        height={PROMO_HEIGHT}
      />
    </>
  )
}

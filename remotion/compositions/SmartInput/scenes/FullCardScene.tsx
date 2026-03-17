import React from 'react'
import { useCurrentFrame } from 'remotion'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { Chip } from '../../../design/Chip'
import { FadeIn } from '../../../design/FadeIn'
import { noise2D } from '@remotion/noise'

export const FullCardScene: React.FC = () => {
  const frame = useCurrentFrame()

  // Subtle glow pulse on chips using noise
  const glowIntensity = noise2D('glow', frame * 0.03, 0) * 0.3 + 0.7

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}>
      <FadeIn delay={0} distance={10}>
        <Card width={960}>
          {/* Full OG-image-style content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 6,
                fontSize: 32,
                color: '#0f0f0f',
                lineHeight: 1.6,
                fontFamily: 'Geist, sans-serif',
              }}>
              <Chip
                variant="command"
                label="/summarize"
                style={{ filter: `brightness(${glowIntensity + 0.15})` }}
              />
              <span>the campaign brief from</span>
              <Chip
                variant="mention"
                label="@Strategist"
                style={{ filter: `brightness(${glowIntensity + 0.1})` }}
              />
              <span>and</span>
              <Chip
                variant="mention"
                label="@Copywriter"
                style={{ filter: `brightness(${glowIntensity + 0.1})` }}
              />
              <span>.</span>
              <span>Tag anything marked</span>
              <Chip
                variant="tag"
                label="#campaign"
                style={{ filter: `brightness(${glowIntensity + 0.12})` }}
              />
              <span>and format the output as:</span>
            </div>

            {/* Bullet lines */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingLeft: 10,
                fontSize: 32,
                color: '#0f0f0f',
                lineHeight: 1.6,
                marginTop: 4,
                fontFamily: 'Geist, sans-serif',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: 10 }}>•</span>
                <span style={{ fontWeight: 700 }}>Key messages</span>
                <span>&nbsp;for the target audience</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: 10 }}>•</span>
                <span style={{ fontStyle: 'italic' }}>Action items</span>
                <span>&nbsp;assigned to each agent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: 10 }}>•</span>
                <span>Open questions for follow-up</span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div
            style={{
              height: 1,
              backgroundColor: '#f0f0f0',
              width: '100%',
              marginTop: 16,
              marginBottom: 12,
            }}
          />

          <ActionBar />
        </Card>
      </FadeIn>
    </div>
  )
}

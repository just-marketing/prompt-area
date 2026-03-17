import React from 'react'
import { Card } from '../../../design/Card'
import { ActionBar } from '../../../design/ActionBar'
import { FadeIn } from '../../../design/FadeIn'

export const RichTextDemoScene: React.FC = () => {
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
      <FadeIn delay={0} distance={15}>
        <Card width={900}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 32,
              lineHeight: 1.6,
              color: '#0f0f0f',
              fontFamily: 'Geist, sans-serif',
              marginBottom: 16,
            }}>
            {/* Line 1: Bold and Italic */}
            <FadeIn delay={0} direction="up" distance={12}>
              <div>
                <span style={{ fontWeight: 700 }}>Bold text</span>
                <span> and </span>
                <span style={{ fontStyle: 'italic' }}>italic text</span>
              </div>
            </FadeIn>

            {/* Line 2: Bullet list item */}
            <FadeIn delay={10} direction="up" distance={12}>
              <div style={{ display: 'flex', alignItems: 'baseline', paddingLeft: 8 }}>
                <span style={{ marginRight: 10, color: '#a1a1aa' }}>•</span>
                <span>Unordered list item</span>
              </div>
            </FadeIn>

            {/* Line 3: Nested bullet */}
            <FadeIn delay={16} direction="up" distance={12}>
              <div style={{ display: 'flex', alignItems: 'baseline', paddingLeft: 40 }}>
                <span style={{ marginRight: 10, color: '#a1a1aa' }}>•</span>
                <span>
                  Nested item with a{' '}
                  <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>link</span>
                </span>
              </div>
            </FadeIn>

            {/* Line 4: Ordered list */}
            <FadeIn delay={24} direction="up" distance={12}>
              <div style={{ display: 'flex', alignItems: 'baseline', paddingLeft: 8 }}>
                <span style={{ marginRight: 10, color: '#a1a1aa' }}>1.</span>
                <span>First ordered item</span>
              </div>
            </FadeIn>

            {/* Line 5: Nested ordered */}
            <FadeIn delay={30} direction="up" distance={12}>
              <div style={{ display: 'flex', alignItems: 'baseline', paddingLeft: 40 }}>
                <span style={{ marginRight: 10, color: '#a1a1aa' }}>a.</span>
                <span>Nested ordered item</span>
              </div>
            </FadeIn>

            {/* Line 6: Second ordered */}
            <FadeIn delay={36} direction="up" distance={12}>
              <div style={{ display: 'flex', alignItems: 'baseline', paddingLeft: 8 }}>
                <span style={{ marginRight: 10, color: '#a1a1aa' }}>2.</span>
                <span>Second ordered item</span>
              </div>
            </FadeIn>
          </div>

          {/* Separator */}
          <div
            style={{
              height: 1,
              backgroundColor: '#f0f0f0',
              width: '100%',
              marginBottom: 12,
            }}
          />

          <ActionBar />
        </Card>
      </FadeIn>
    </div>
  )
}

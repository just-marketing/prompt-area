import React from 'react'
import { Logo } from '../../../design/Logo'

export const IntroScene: React.FC = () => {
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
      <Logo animate delay={5} tagline="Built for AI-first applications" />
    </div>
  )
}

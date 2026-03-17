import React from 'react'
import { Outro } from '../../../design/Outro'

export const OutroScene: React.FC = () => {
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
      <Outro delay={5} />
    </div>
  )
}

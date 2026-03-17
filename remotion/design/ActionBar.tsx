import React from 'react'
import { type Theme, themeColors, spacing } from './tokens'

export interface ActionButton {
  label: string
  icon?: React.ReactNode
}

interface ActionBarProps {
  theme?: Theme
  leftButtons?: ActionButton[]
  rightButtons?: ActionButton[]
  style?: React.CSSProperties
}

const defaultLeftButtons: ActionButton[] = [
  { label: '+' },
  { label: '@' },
  { label: '/' },
  { label: '#' },
]

function IconButton({ button, theme = 'light' }: { button: ActionButton; theme?: Theme }) {
  const c = themeColors(theme)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: spacing.iconSize,
        height: spacing.iconSize,
        borderRadius: 8,
        border: `1px solid ${c.cardBorder}`,
        color: c.icon,
        fontSize: 26,
        fontFamily: 'Geist, sans-serif',
      }}>
      {button.icon || button.label}
    </div>
  )
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function SendIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

export const ActionBar: React.FC<ActionBarProps> = ({
  theme = 'light',
  leftButtons = defaultLeftButtons,
  style,
}) => {
  const c = themeColors(theme)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}>
      {/* Left icons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {leftButtons.map((btn, i) => (
          <IconButton key={i} button={btn} theme={theme} />
        ))}
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: spacing.iconSize,
            height: spacing.iconSize,
            borderRadius: 8,
            border: `1px solid ${c.cardBorder}`,
            fontSize: 20,
            color: c.icon,
          }}>
          &lt;/&gt;
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: spacing.iconSize,
            height: spacing.iconSize,
            borderRadius: 8,
            border: `1px solid ${c.cardBorder}`,
          }}>
          <MicIcon color={c.icon} />
        </div>
        {/* Send button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: spacing.iconSize,
            height: spacing.iconSize,
            borderRadius: 10,
            backgroundColor: c.sendBg,
          }}>
          <SendIcon color={c.sendIcon} />
        </div>
      </div>
    </div>
  )
}

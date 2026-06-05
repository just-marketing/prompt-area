import { ImageResponse } from 'next/og'
import type { ReactNode } from 'react'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Prompt Area — The go-to textarea for AI agents & chatbots'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Inline Lucide-style stroke icon. Satori renders raw <svg> reliably, so each
// codex toolbar/tray glyph is expressed as path/circle/line children.
function L({
  s = 22,
  c = '#8f9091',
  w = 2,
  children,
}: {
  s?: number
  c?: string
  w?: number
  children: ReactNode
}) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ChevronDown = ({ s = 18 }: { s?: number }) => (
  <L s={s} c="#bcbdbe">
    <path d="m6 9 6 6 6-6" />
  </L>
)

export default async function OGImage() {
  const geistRegular = await readFile(
    join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'),
  )
  const geistBold = await readFile(
    join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf'),
  )
  const geistItalic = await readFile(
    join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Italic.ttf'),
  )

  const chipStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    padding: '3px 12px',
    borderRadius: '8px',
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.6,
  }

  const mentionChip = {
    ...chipStyle,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  }

  const tagChip = {
    ...chipStyle,
    backgroundColor: '#dcfce7',
    color: '#15803d',
  }

  const commandStyle = {
    display: 'flex' as const,
    color: '#6d28d9',
    fontWeight: 700,
    fontSize: 24,
    lineHeight: 1.6,
  }

  // Codex-style action bar: rounded-full pills + circular icon buttons.
  const toolbarPill = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    height: '44px',
    padding: '0 16px',
    borderRadius: '999px',
    color: '#8f9091',
    fontSize: 21,
  }

  const trayPill = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '7px',
    height: '38px',
    padding: '0 14px',
    borderRadius: '999px',
    color: '#8f9091',
    fontSize: 19,
  }

  const circleBtn = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '44px',
    height: '44px',
    borderRadius: '999px',
    color: '#8f9091',
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        padding: '36px 60px',
      }}>
      {/* Title row with icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '8px',
        }}>
        <svg
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0f0f0f"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />
          <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />
          <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
          <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />
          <path d="M9 6v12" />
        </svg>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#0f0f0f',
            letterSpacing: '-1.5px',
          }}>
          Prompt Area
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 24,
          color: '#71717a',
          marginBottom: '20px',
        }}>
        The go-to textarea for AI agents & chatbots
      </div>

      {/* Gray context-tray container — the white card sits flush on top, the gray
          peeks out below with the repo / environment / branch selectors. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '920px',
          backgroundColor: '#f6f6f6',
          borderRadius: '24px',
        }}>
        {/* Foreground composer card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #ececec',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            padding: '24px 30px',
          }}>
          {/* Rich text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
            {/* Line 1: chips and text */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                fontSize: 24,
                color: '#0f0f0f',
                lineHeight: 1.6,
              }}>
              <span style={commandStyle}>/summarize</span>
              <span>the campaign brief from</span>
              <span style={mentionChip}>@Strategist</span>
              <span>and</span>
              <span style={mentionChip}>@Copywriter</span>
              <span>.</span>
              <span>Tag anything marked</span>
              <span style={tagChip}>#campaign</span>
              <span>and format the output as:</span>
            </div>

            {/* Bullet lines */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                paddingLeft: '10px',
                fontSize: 24,
                color: '#0f0f0f',
                lineHeight: 1.6,
                marginTop: '4px',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: '10px' }}>•</span>
                <span style={{ fontWeight: 700 }}>Key messages</span>
                <span>&nbsp;for the target audience</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: '10px' }}>•</span>
                <span style={{ fontStyle: 'italic' }}>Action items</span>
                <span>&nbsp;assigned to each agent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: '10px' }}>•</span>
                <span>Open questions for follow-up</span>
              </div>
            </div>
          </div>

          {/* Codex action bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '18px',
            }}>
            {/* Left: add + permissions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={circleBtn}>
                <L s={24}>
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </L>
              </div>
              <div style={toolbarPill}>
                <L>
                  <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
                  <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </L>
                <span>Default permissions</span>
                <ChevronDown />
              </div>
            </div>

            {/* Right: model + voice + send */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={toolbarPill}>
                <L s={22}>
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                </L>
                <span style={{ display: 'flex', color: '#0f0f0f', fontWeight: 700 }}>5.5</span>
                <span style={{ display: 'flex' }}>Extra High</span>
                <ChevronDown />
              </div>

              <div style={circleBtn}>
                <L>
                  <path d="M12 19v3" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                </L>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  backgroundColor: '#000000',
                }}>
                <L s={22} c="#ffffff" w={2.5}>
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </L>
              </div>
            </div>
          </div>
        </div>

        {/* Context tray — peeks out below the composer card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
          }}>
          <div style={trayPill}>
            <L s={18}>
              <path d="M18 19a5 5 0 0 1-5-5v8" />
              <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
              <circle cx="13" cy="12" r="2" />
              <circle cx="20" cy="19" r="2" />
            </L>
            <span>acme-enterprise</span>
            <ChevronDown s={16} />
          </div>

          <div style={trayPill}>
            <L s={18}>
              <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
              <path d="M20.054 15.987H3.946" />
            </L>
            <span>Work locally</span>
            <ChevronDown s={16} />
          </div>

          <div style={trayPill}>
            <L s={18}>
              <path d="M15 6a9 9 0 0 0-9 9V3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
            </L>
            <span>cursor/prod-data-memoization-layer</span>
            <ChevronDown s={16} />
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Geist', data: geistRegular, style: 'normal' as const, weight: 400 as const },
        { name: 'Geist', data: geistBold, style: 'normal' as const, weight: 700 as const },
        { name: 'Geist', data: geistItalic, style: 'italic' as const, weight: 400 as const },
      ],
    },
  )
}

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Prompt Area — The go-to textarea for AI agents & chatbots'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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

  const iconBtn = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    color: '#a1a1aa',
    fontSize: 18,
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
        padding: '40px 60px',
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
          marginBottom: '28px',
        }}>
        The go-to textarea for AI agents & chatbots
      </div>

      {/* Card mockup */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '920px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          padding: '28px 32px',
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
            <span>. Tag anything marked</span>
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
            <div style={{ display: 'flex' }}>
              <span>-&nbsp;</span>
              <span style={{ fontWeight: 700 }}>Key messages</span>
              <span>&nbsp;for the target audience</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span>-&nbsp;</span>
              <span style={{ fontStyle: 'italic' }}>Action items</span>
              <span>&nbsp;assigned to each agent</span>
            </div>
            <div style={{ display: 'flex' }}>- Open questions for follow-up</div>
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            display: 'flex',
            height: '1px',
            backgroundColor: '#f0f0f0',
            width: '100%',
            marginTop: '16px',
            marginBottom: '12px',
          }}
        />

        {/* Action bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {/* Left icons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={iconBtn}>+</div>
            <div style={iconBtn}>@</div>
            <div style={{ ...iconBtn, fontSize: 19 }}>/</div>
            <div style={iconBtn}>#</div>
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ ...iconBtn, fontSize: 14 }}>&lt;/&gt;</div>
            <div style={iconBtn}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#18181b',
                color: '#ffffff',
                fontSize: 18,
              }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </div>
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

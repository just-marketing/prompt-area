'use client'

import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import {
  Plus,
  X,
  Upload,
  Search,
  SquarePen,
  Box,
  Palette,
  Blocks,
  ChevronRight,
  ChevronDown,
  Check,
  Mic,
  SatelliteDish,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PromptArea,
  isSegmentsEmpty,
  type Segment,
  type TriggerConfig,
  type TriggerSuggestion,
  type PromptAreaFile,
} from 'prompt-area'
import { useSubmittablePrompt } from './use-submittable-prompt'
import { SubmittedPreview } from './submitted-preview'

// ---------------------------------------------------------------------------
// Juma's brand mark — the eight-petal "spark" from the official logo
// (apps/web/public/logo/svg/juma-icon-*.svg). The petals are reused verbatim so
// the mark stays on-brand; rendering them with `currentColor` lets the same
// glyph carry the teal accent in the model selector. The send button reuses a
// single petal — exactly as the product does (one spark leaf on a teal
// gradient).
// ---------------------------------------------------------------------------

const SPARK_PETALS = [
  'M79.9745 127.906C79.3681 127.927 78.3489 128.497 76.9323 129.282C70.7918 132.946 64.8755 135.448 67.3419 126.744C68.5903 122.872 73.8085 110.799 75.7857 107.411C80.8255 99.5987 84.2907 107.299 86.8488 112.777C89.2439 118.015 92.1383 123.549 93.1881 129.109C94.3194 137.7 82.39 127.942 80.0866 127.906H79.9694H79.9745Z',
  'M80.0255 32.0938C80.6319 32.0734 81.6511 31.5026 83.0677 30.7179C89.2082 27.0539 95.1245 24.5519 92.6581 33.2556C91.4096 37.1285 86.1915 49.2006 84.2143 52.5893C79.1745 60.4013 75.7093 52.7014 73.1512 47.2234C70.7561 41.9848 67.8616 36.4507 66.8119 30.8911C65.6806 22.2995 77.61 32.0581 79.9134 32.0938H80.0306H80.0255Z',
  'M32.0938 79.9745C32.0734 79.3681 31.5026 78.3489 30.7179 76.9323C27.0539 70.7918 24.5519 64.8755 33.2556 67.3419C37.1285 68.5903 49.2006 73.8085 52.5893 75.7857C60.4013 80.8255 52.7014 84.2907 47.2234 86.8488C41.9848 89.2439 36.4507 92.1383 30.8911 93.1881C22.2995 94.3194 32.0581 82.39 32.0938 80.0866V79.9694V79.9745Z',
  'M127.906 80.0255C127.927 80.6319 128.497 81.6511 129.282 83.0677C132.946 89.2082 135.448 95.1245 126.744 92.6581C122.872 91.4096 110.799 86.1915 107.411 84.2143C99.5987 79.1745 107.299 75.7093 112.777 73.1512C118.015 70.7561 123.549 67.8616 129.109 66.8119C137.7 65.6806 127.942 77.61 127.906 79.9134V80.0306V80.0255Z',
  'M46.1074 113.857C45.6641 113.444 44.543 113.123 42.9836 112.68C36.0482 110.927 30.0962 108.516 37.9999 104.103C41.6179 102.249 53.848 97.4024 57.6444 96.4036C66.7304 94.4468 63.7391 102.34 61.6702 108.022C59.6624 113.419 57.7973 119.381 54.6022 124.054C49.328 130.928 47.789 115.595 46.194 113.938L46.1074 113.857Z',
  'M113.893 46.1431C114.336 46.5558 115.457 46.8769 117.016 47.3202C123.952 49.0732 129.904 51.4835 122 55.8966C118.382 57.7514 106.152 62.5976 102.356 63.5964C93.2696 65.5532 96.2609 57.6597 98.3298 51.9778C100.338 46.5813 102.203 40.6191 105.398 35.9462C110.672 29.0719 112.211 44.4054 113.806 46.0615L113.893 46.1431Z',
  'M46.1431 46.1074C46.5558 45.6641 46.8769 44.543 47.3202 42.9836C49.0732 36.0482 51.4835 30.0962 55.8966 37.9999C57.7514 41.6179 62.5976 53.848 63.5964 57.6444C65.5532 66.7304 57.6597 63.7391 51.9778 61.6702C46.5813 59.6624 40.6191 57.7973 35.9462 54.6022C29.0719 49.328 44.4054 47.789 46.0615 46.194L46.1431 46.1074Z',
  'M113.857 113.893C113.444 114.336 113.123 115.457 112.68 117.016C110.927 123.952 108.516 129.904 104.103 122C102.249 118.382 97.4024 106.152 96.4036 102.356C94.4468 93.2696 102.34 96.2609 108.022 98.3298C113.419 100.338 119.381 102.203 124.054 105.398C130.928 110.672 115.595 112.211 113.938 113.806L113.857 113.893Z',
]

function JumaSpark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 160" fill="currentColor" aria-hidden className={className} {...props}>
      {SPARK_PETALS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// The product's send glyph — copied verbatim from CursorIcon
// (apps/web/src/components/logo/CursorIcon.tsx): a single spark leaf that
// inherits the button's `inButton` color via currentColor.
function CursorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('block h-fit', className)}
      fill="none"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      <g clipPath="url(#juma-send-clip)">
        <path
          d="M52.7121 53.4464C52.0413 54.1652 51.5301 55.9862 50.7953 58.5259C47.9521 69.8031 44.0226 79.467 36.8506 66.6244C33.8316 60.7462 25.9567 40.8594 24.3434 34.6937C21.1647 19.9343 33.9913 24.7902 43.224 28.1446C51.9933 31.4191 61.6892 34.4381 69.2765 39.6294C80.4579 48.2071 55.5235 50.699 52.8399 53.3026L52.7121 53.4464Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="juma-send-clip">
          <rect fill="white" height="96" width="96" />
        </clipPath>
      </defs>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Connected-integration glyphs — reproduced from the product's own marks so the
// cluster reads as the real Google Analytics / Search Console connectors.
// ---------------------------------------------------------------------------

function GoogleAnalyticsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#E37400" className={className} aria-hidden>
      <title>Google Analytics</title>
      <path d="M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z" />
    </svg>
  )
}

function SearchConsoleGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      aria-hidden
      style={{ fillRule: 'evenodd', clipRule: 'evenodd' }}>
      <title>Search Console</title>
      <g transform="matrix(15.9486,0,0,15.9486,-65.4855,-60.4616)">
        <path
          d="M11.081,30.527L6.361,35.248C5.999,35.608 5.406,35.608 5.044,35.248L4.752,34.956C4.392,34.594 4.392,34.002 4.752,33.64L9.472,28.919C9.834,28.558 10.428,28.558 10.79,28.919L11.081,29.21C11.256,29.384 11.354,29.622 11.354,29.869C11.354,30.115 11.256,30.353 11.081,30.527Z"
          fill="#FBBC04"
        />
        <path
          d="M23.75,32.5C23.75,32.5 29.793,32.5 29.793,32.5C33.106,32.5 35.833,29.773 35.833,26.46C35.833,26.459 35.833,26.459 35.833,26.458C35.833,26.458 35.833,10.207 35.833,10.207C35.833,6.894 33.106,4.167 29.793,4.167C29.793,4.167 29.791,4.167 29.79,4.167C26.477,4.167 23.75,6.894 23.75,10.207C23.75,10.207 23.75,32.5 23.75,32.5Z"
          fill="#4285F4"
        />
        <path
          d="M13.748,32.5L13.752,32.5C17.065,32.5 19.792,29.773 19.792,26.46C19.792,26.459 19.792,26.457 19.792,26.457C19.792,23.144 17.065,20.417 13.752,20.417L13.748,20.417C10.435,20.417 7.708,23.144 7.708,26.457C7.708,26.457 7.708,26.459 7.708,26.46C7.708,29.773 10.435,32.5 13.748,32.5Z"
          fill="#FBBC04"
        />
        <path
          d="M27.971,32.5C27.971,32.5 22.082,32.5 22.082,32.5C18.769,32.5 16.042,29.773 16.042,26.46C16.042,26.459 16.042,26.459 16.042,26.458L16.042,18.542C16.042,18.541 16.042,18.541 16.042,18.54C16.042,15.227 18.769,12.5 22.082,12.5C22.082,12.5 22.084,12.5 22.085,12.5C25.398,12.5 28.125,15.227 28.125,18.54C28.125,18.541 28.125,18.541 28.125,18.542L28.125,32.346C28.125,32.43 28.055,32.5 27.971,32.5Z"
          fill="#34A853"
        />
        <path
          d="M28.125,32.346C28.125,32.346 28.125,18.542 28.125,18.542C28.125,15.855 26.332,13.476 23.75,12.735L23.75,32.5L27.97,32.5C27.97,32.5 27.971,32.5 27.971,32.5C28.055,32.5 28.125,32.43 28.125,32.346Z"
          fill="#1967D2"
        />
        <path
          d="M19.792,26.575C19.792,24.128 18.306,21.913 16.042,20.985L16.042,26.575C16.042,28.295 16.762,29.848 17.917,30.948C19.115,29.81 19.794,28.227 19.792,26.575Z"
          fill="#EA4335"
        />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Option data (representative placeholders mirroring the Juma composer)
// ---------------------------------------------------------------------------

type JumaModel = { id: string; name: string; desc: string; advanced?: boolean }

const MODELS: JumaModel[] = [
  { id: 'juma-agent', name: 'Juma Agent', desc: 'Most optimized for Juma' },
  { id: 'gpt-5.5', name: 'GPT-5.5', desc: "Free during World Cup '26" },
]
// Tucked behind the "Advanced" disclosure at the bottom of the model menu.
const ADVANCED_MODELS: JumaModel[] = [
  { id: 'opus-4.8', name: 'Claude Opus 4.8', desc: 'For your hardest tasks', advanced: true },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', desc: 'Long-context research', advanced: true },
]

// Representative placeholder names — not real workspaces or brands.
const PROJECTS = [
  'Spring Campaign',
  'Newsletter Revamp',
  'Website Refresh',
  'Social Calendar',
  'Product Launch',
  'Holiday Promo',
  'Blog Pipeline',
]

type Brand = { id: string; name: string; colors: string[] }
// Fictional brand profiles — placeholder names with representative palettes.
const BRANDS: Brand[] = [
  {
    id: 'acme',
    name: 'Acme',
    colors: ['#f26b21', '#f47b32', '#f58a4a', '#e08a7d', '#f2f2f2'],
  },
  {
    id: 'lumen',
    name: 'Lumen',
    colors: ['#1f44d6', '#e0322b', '#d83a30', '#3f9d52', '#c9c9c9'],
  },
  {
    id: 'northwind',
    name: 'Northwind',
    colors: ['#f4f4f4', '#cfcfcf', '#c8c4e0', '#b6d44a', '#ffffff'],
  },
  {
    id: 'vertex',
    name: 'Vertex',
    colors: ['#cda25f', '#d6b069', '#2f7d4f', '#2f6bdc', '#ffffff'],
  },
  {
    id: 'solstice',
    name: 'Solstice',
    colors: ['#0b1f3a', '#2b5fd6', '#3a7bf0', '#9aa4af', '#ffffff'],
  },
  {
    id: 'meridian',
    name: 'Meridian',
    colors: ['#46c6ec', '#c98a4a', '#173a5e', '#0f2742', '#56b6e0'],
  },
  { id: 'cobalt', name: 'Cobalt', colors: [] },
]

// The connected data integrations. The cluster shows the first three marks (the
// way the product surfaces Analytics / Search Console / a live connector) and
// rolls the rest into a "+N".
type Integration = { id: string; label: string; glyph: (p: { className?: string }) => ReactNode }
const INTEGRATIONS: Integration[] = [
  { id: 'analytics', label: 'Google Analytics', glyph: (p) => <GoogleAnalyticsGlyph {...p} /> },
  { id: 'search-console', label: 'Search Console', glyph: (p) => <SearchConsoleGlyph {...p} /> },
  {
    id: 'live',
    label: 'Realtime',
    glyph: (p) => <SatelliteDish className={cn('text-sky-500', p.className)} />,
  },
  {
    id: 'meta',
    label: 'Meta Ads',
    glyph: (p) => <Blocks className={cn('text-[#0866ff]', p.className)} />,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    glyph: (p) => <Blocks className={cn('text-[#0a66c2]', p.className)} />,
  },
]

const PROMPTS = [
  'Summarize this',
  'Write a LinkedIn post',
  'Run a brand audit',
  'Draft an SEO brief',
]

// Juma's teal/sky brand scale (packages/design-system juma-blue):
//   $300 #9aedf7 · $400 #7de4f0 · $500 #40c4d3 · $600 #0f8bab · $700 #14728b · $900 #002529
// The send button mirrors the product's bg-gradient-primary + text-inButton,
// which resolve from these tokens per theme (see the send button below).
const BRAND = '#0f8bab'
const BRAND_SOFT = '#40c4d3'

// Shared class fragments, following the per-example ICON_BTN / MENU_ITEM naming
// convention used by the other style examples. Colors are pinned to Juma's
// teal-tinted palette (light + dark) rather than the docs theme so the composer
// reads as Juma on any page.
const ICON_BTN =
  'flex size-9 shrink-0 items-center justify-center rounded-full text-[#516068] transition-colors hover:bg-black/[0.05] dark:text-[#9fb1b9] dark:hover:bg-white/[0.08]'
const MENU =
  'absolute z-30 flex min-w-[256px] flex-col rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(8,40,48,0.16)] dark:border-white/10 dark:bg-[#16242a] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)]'
const ROW =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[#1a2b32] transition-colors hover:bg-black/[0.05] dark:text-[#e6eef1] dark:hover:bg-white/[0.06]'
const SUB_TRIGGER = 'justify-between'
const SEARCH_BOX =
  'mb-1 flex items-center gap-2 rounded-xl border border-black/[0.08] px-2.5 py-1.5 text-sm dark:border-white/10'

// A fly-out submenu: stacks below its trigger on mobile (a side panel would run
// off-screen) and swings out to the right from ≥sm — same approach as the Gemini
// style.
function SubMenu({ children }: { children: ReactNode }) {
  return (
    <div
      role="menu"
      className={cn(
        MENU,
        'top-full left-0 mt-1.5 w-full',
        'sm:top-0 sm:left-full sm:mt-0 sm:ml-2 sm:w-[272px]',
      )}>
      {children}
    </div>
  )
}

// A search affordance shown at the top of the project/brand pickers (the demo's
// lists are short, so it filters in place).
function MenuSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
}) {
  return (
    <div className={SEARCH_BOX}>
      <Search className="size-4 shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[#1a2b32] outline-none placeholder:text-[#8aa0a8] dark:text-[#e6eef1] dark:placeholder:text-[#7f939b]"
        // Stop the card's onClick from refocusing the editor while typing here.
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// Five-dot brand swatch (or a palette glyph when a profile has no colors yet).
function Swatches({ colors }: { colors: string[] }) {
  if (colors.length === 0) {
    return <Palette className="size-4 shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
  }
  return (
    <span className="flex shrink-0 items-center gap-1">
      {colors.slice(0, 5).map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="size-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  )
}

// The "+" add menu: uploads & searches up top, then "Use a project", "Use a
// brand profile", and "Add from integrations" — each a fly-out. Projects attach
// as context chips above the input, a brand sets the active brand voice, and the
// rest just dismiss.
function AddMenu({
  open,
  setOpen,
  sub,
  setSub,
  attachProject,
  setBrand,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  sub: 'project' | 'brand' | 'integrations' | null
  setSub: (next: 'project' | 'brand' | 'integrations' | null) => void
  attachProject: (name: string) => void
  setBrand: (brand: Brand) => void
}) {
  const [projectQuery, setProjectQuery] = useState('')
  const [brandQuery, setBrandQuery] = useState('')

  const projects = PROJECTS.filter((p) => p.toLowerCase().includes(projectQuery.toLowerCase()))
  const brands = BRANDS.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()))

  const subTrigger = (
    id: 'project' | 'brand' | 'integrations',
    icon: LucideIcon,
    label: string,
  ) => {
    const Icon = icon
    return (
      <div className="relative" onMouseEnter={() => setSub(id)}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={sub === id}
          className={cn(ROW, SUB_TRIGGER, sub === id && 'bg-black/[0.05] dark:bg-white/[0.06]')}>
          <span className="flex items-center gap-2.5">
            <Icon className="size-[18px] shrink-0 text-[#516068] dark:text-[#9fb1b9]" />
            {label}
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
        </button>
        {sub === id && (
          <SubMenu>
            {id === 'project' && (
              <>
                <MenuSearch
                  value={projectQuery}
                  onChange={setProjectQuery}
                  placeholder="Search projects..."
                />
                <div className="flex max-h-60 flex-col overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={ROW}
                      onClick={() => {
                        attachProject(p)
                        setOpen(false)
                      }}>
                      <Box className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                      <span className="min-w-0 flex-1 truncate">{p}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-2 my-1 h-px bg-black/[0.07] dark:bg-white/10" />
                <button type="button" className={ROW} onClick={() => setOpen(false)}>
                  <Plus className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                  Create new project
                </button>
              </>
            )}
            {id === 'brand' && (
              <>
                <MenuSearch
                  value={brandQuery}
                  onChange={setBrandQuery}
                  placeholder="Search brand profiles..."
                />
                <div className="flex max-h-60 flex-col overflow-y-auto">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={cn(ROW, 'justify-between')}
                      onClick={() => {
                        setBrand(b)
                        setOpen(false)
                      }}>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Palette className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                        <span className="min-w-0 flex-1 truncate">{b.name}</span>
                      </span>
                      <Swatches colors={b.colors} />
                    </button>
                  ))}
                </div>
                <div className="mx-2 my-1 h-px bg-black/[0.07] dark:bg-white/10" />
                <button type="button" className={ROW} onClick={() => setOpen(false)}>
                  <Plus className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                  Create new brand profile
                </button>
              </>
            )}
            {id === 'integrations' && (
              <div className="flex max-h-60 flex-col overflow-y-auto">
                {INTEGRATIONS.map((it) => (
                  <button key={it.id} type="button" className={ROW} onClick={() => setOpen(false)}>
                    {it.glyph({ className: 'size-[18px] shrink-0' })}
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  </button>
                ))}
              </div>
            )}
          </SubMenu>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add context and more"
        onClick={() => {
          setOpen(!open)
          setSub(null)
        }}
        className={cn(
          ICON_BTN,
          'border border-black/[0.1] dark:border-white/15',
          open && 'bg-black/[0.05] dark:bg-white/[0.08]',
        )}>
        <Plus className="size-4" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2')}>
          <button
            type="button"
            className={ROW}
            onMouseEnter={() => setSub(null)}
            onClick={() => setOpen(false)}>
            <Upload className="size-[18px] shrink-0 text-[#516068] dark:text-[#9fb1b9]" />
            Upload photos &amp; files
          </button>
          <button
            type="button"
            className={ROW}
            onMouseEnter={() => setSub(null)}
            onClick={() => setOpen(false)}>
            <Search className="size-[18px] shrink-0 text-[#516068] dark:text-[#9fb1b9]" />
            Search context
          </button>
          <button
            type="button"
            className={ROW}
            onMouseEnter={() => setSub(null)}
            onClick={() => setOpen(false)}>
            <SquarePen className="size-[18px] shrink-0 text-[#516068] dark:text-[#9fb1b9]" />
            Search prompts
          </button>

          <div className="mx-2 my-1 h-px bg-black/[0.07] dark:bg-white/10" />

          {subTrigger('project', Box, 'Use a project')}
          {subTrigger('brand', Palette, 'Use a brand profile')}
          {subTrigger('integrations', Blocks, 'Add from integrations')}
        </div>
      )}
    </div>
  )
}

// The connected-integrations cluster — the product's "Tools & Settings" pill: a
// flat row of brand marks plus a "+N" overflow. Acts as a shortcut into the add
// menu's integrations fly-out.
function ToolsCluster({ onOpen }: { onOpen: () => void }) {
  const shown = INTEGRATIONS.slice(0, 3)
  const overflow = INTEGRATIONS.length - shown.length
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Tools & Settings"
      aria-label="Tools and settings"
      className="flex h-9 min-w-9 shrink-0 items-center gap-1 rounded-full px-2 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
      {shown.map((it) => (
        <span key={it.id} className="flex shrink-0 items-center">
          {it.glyph({ className: 'size-3.5' })}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs text-[#8aa0a8] dark:text-[#7f939b]">+{overflow}</span>
      )}
    </button>
  )
}

// The brand-voice control — a dedicated palette button that, once a profile is
// chosen, becomes a teal chip (the product's `pw-branding-profile-chip`) with a
// hover-revealed remove button. Either state opens the brand picker.
function BrandControl({
  open,
  setOpen,
  brand,
  setBrand,
  clearBrand,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  brand: Brand | null
  setBrand: (brand: Brand) => void
  clearBrand: () => void
}) {
  const [query, setQuery] = useState('')
  const brands = BRANDS.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative">
      {brand ? (
        <div
          className="group flex shrink-0 items-center rounded-xl border px-2 py-1.5 transition-colors"
          style={{
            color: BRAND,
            backgroundColor: 'color-mix(in srgb, #0f8bab 10%, transparent)',
            borderColor: 'color-mix(in srgb, #0f8bab 30%, transparent)',
          }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Brand voice: ${brand.name}`}
            onClick={() => setOpen(!open)}
            className="flex items-center transition-transform active:scale-[0.97]">
            <Palette className="size-4 shrink-0" />
          </button>
          <button
            type="button"
            aria-label={`Remove brand voice (${brand.name})`}
            onClick={clearBrand}
            className="flex h-4 w-0 items-center justify-center overflow-hidden opacity-0 transition-[width,opacity,margin] duration-150 group-hover:ml-1.5 group-hover:w-4 group-hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Use a brand profile"
          onClick={() => setOpen(!open)}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#0f8bab]/40 text-[#0f8bab] transition-colors hover:bg-[#0f8bab]/10 dark:border-[#40c4d3]/40 dark:text-[#40c4d3] dark:hover:bg-[#40c4d3]/10">
          <Palette className="size-4" />
        </button>
      )}
      {open && (
        <div role="menu" className={cn(MENU, 'bottom-full left-0 mb-2 w-[280px]')}>
          <MenuSearch value={query} onChange={setQuery} placeholder="Search brand profiles..." />
          <div className="flex max-h-64 flex-col overflow-y-auto">
            {brands.map((b) => {
              const active = b.id === brand?.id
              return (
                <button
                  key={b.id}
                  type="button"
                  className={cn(ROW, 'justify-between')}
                  onClick={() => {
                    setBrand(b)
                    setOpen(false)
                  }}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Palette className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  </span>
                  {active ? (
                    <Check className="size-4 shrink-0" style={{ color: BRAND_SOFT }} />
                  ) : (
                    <Swatches colors={b.colors} />
                  )}
                </button>
              )
            })}
          </div>
          <div className="mx-2 my-1 h-px bg-black/[0.07] dark:bg-white/10" />
          <button type="button" className={ROW} onClick={() => setOpen(false)}>
            <Plus className="size-[18px] shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
            Create new brand profile
          </button>
        </div>
      )}
    </div>
  )
}

// The model selector — a rounded-square icon button carrying the current model's
// mark, opening a "Models" menu above with a "Juma" group, a check on the active
// model, and an "Advanced" disclosure that reveals the heavier third-party models.
function ModelMenu({
  open,
  setOpen,
  model,
  onSelect,
}: {
  open: boolean
  setOpen: (next: boolean) => void
  model: JumaModel
  onSelect: (model: JumaModel) => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const modelRow = (m: JumaModel) => {
    const active = m.id === model.id
    return (
      <button
        key={m.id}
        type="button"
        role="menuitemradio"
        aria-checked={active}
        className={cn(ROW, 'gap-3')}
        onClick={() => {
          onSelect(m)
          setOpen(false)
        }}>
        <ModelGlyph id={m.id} className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[#1a2b32] dark:text-[#e6eef1]">{m.name}</span>
          <span className="block text-[13px] text-[#7a8d95] dark:text-[#86979f]">{m.desc}</span>
        </span>
        {active && <Check className="size-4 shrink-0" style={{ color: BRAND_SOFT }} />}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Model: ${model.name}`}
        title={model.name}
        onClick={() => {
          setOpen(!open)
          setAdvancedOpen(false)
        }}
        className="flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm text-[#516068] transition-colors hover:bg-black/[0.05] dark:text-[#9fb1b9] dark:hover:bg-white/[0.08]">
        <span className="max-w-32 truncate">{model.name}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-70" />
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'right-0 bottom-full mb-2 w-[280px]')}>
          <div className="px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-[#8aa0a8] uppercase dark:text-[#7f939b]">
            Models
          </div>
          <div className="px-3 pb-1 text-[11px] font-medium tracking-wider text-[#a7b6bc] uppercase dark:text-[#6b7c84]">
            Juma
          </div>
          {MODELS.map(modelRow)}

          <div className="mx-2 my-1 h-px bg-black/[0.07] dark:bg-white/10" />

          <button
            type="button"
            aria-expanded={advancedOpen}
            className={cn(ROW, SUB_TRIGGER, 'text-[#7a8d95] dark:text-[#86979f]')}
            onClick={() => setAdvancedOpen((v) => !v)}>
            Advanced
            <ChevronDown
              className={cn('size-4 transition-transform', advancedOpen && 'rotate-180')}
            />
          </button>
          {advancedOpen && ADVANCED_MODELS.map(modelRow)}
        </div>
      )}
    </div>
  )
}

// Each model's leading glyph: Juma Agent wears the brand spark, GPT-5.5 a World
// Cup ball (its "Free during World Cup" promo), and the Advanced models their
// real vendor marks — so the selector button reflects the picked vendor, just
// like the product (whose button showed the Anthropic mark for Claude).
function ModelGlyph({ id, className }: { id: string; className?: string }) {
  if (id === 'juma-agent') {
    return <JumaSpark className={cn('text-[#0f8bab] dark:text-[#40c4d3]', className)} />
  }
  if (id === 'gpt-5.5') {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center justify-center text-[13px] leading-none',
          className,
        )}>
        ⚽
      </span>
    )
  }
  if (id === 'opus-4.8') {
    return <AnthropicMark className={cn('text-[#d97757]', className)} />
  }
  if (id === 'gemini-3-pro') {
    return <GeminiMark className={className} />
  }
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-md bg-black/[0.06] text-[#516068] dark:bg-white/10 dark:text-[#9fb1b9]',
        className,
      )}>
      <Sparkle />
    </span>
  )
}

// Anthropic's wordmark "A" (from the product's own model button) and Gemini's
// gradient spark — used as the Advanced models' vendor marks.
function AnthropicMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  )
}

function GeminiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"
        fill="url(#juma-model-gemini-grad)"
      />
      <defs>
        <linearGradient
          id="juma-model-gemini-grad"
          gradientUnits="userSpaceOnUse"
          x1="3"
          x2="21"
          y1="3"
          y2="21">
          <stop stopColor="#4285F4" />
          <stop offset=".5" stopColor="#9168C0" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" />
    </svg>
  )
}

// Default triggers so the placeholder's promise holds even when the host doesn't
// wire its own: "@" attaches inline context (projects/brands) and "/" drops in a
// saved prompt. A caller-supplied `triggers` prop overrides these.
const CONTEXT_SUGGESTIONS: TriggerSuggestion[] = [
  ...PROJECTS.map((p) => ({ value: `project:${p}`, label: p, description: 'Project' })),
  ...BRANDS.map((b) => ({ value: `brand:${b.id}`, label: b.name, description: 'Brand profile' })),
]
const CONTEXT_CHIP =
  'rounded-md bg-[#40c4d3]/15 px-1 font-medium text-[#0f8bab] dark:bg-[#40c4d3]/20 dark:text-[#7de4f0]'
const PROMPT_CHIP =
  'rounded-md bg-black/[0.06] px-1 font-medium text-[#1a2b32] dark:bg-white/10 dark:text-[#e6eef1]'

const DEFAULT_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    accessibilityLabel: 'context',
    chipClassName: CONTEXT_CHIP,
    emptyMessage: 'No matching context',
    onSearch: (q) =>
      CONTEXT_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    accessibilityLabel: 'prompt',
    chipClassName: PROMPT_CHIP,
    emptyMessage: 'No matching prompts',
    onSearch: (q) =>
      PROMPTS.filter((p) => p.toLowerCase().includes(q.toLowerCase())).map((p) => ({
        value: p,
        label: p,
      })),
  },
]

export function JumaInputExample({
  initialSegments = [],
  initialFiles = [],
  triggers,
  markdown = true,
}: {
  initialSegments?: Segment[]
  initialFiles?: PromptAreaFile[]
  triggers?: TriggerConfig[]
  markdown?: boolean
} = {}) {
  const { segments, setSegments, submitted, promptRef, submit, reset } =
    useSubmittablePrompt<PromptAreaFile>({ initialSegments, initialFiles })

  const [model, setModel] = useState<JumaModel>(MODELS[0])
  const [projects, setProjects] = useState<string[]>([])
  const [brand, setBrandState] = useState<Brand | null>(null)
  const [openMenu, setOpenMenu] = useState<'add' | 'model' | 'brand' | null>(null)
  const [addSub, setAddSub] = useState<'project' | 'brand' | 'integrations' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const attachProject = (name: string) =>
    setProjects((prev) => (prev.includes(name) ? prev : [...prev, name]))
  const removeProject = (name: string) => setProjects((prev) => prev.filter((p) => p !== name))

  // Close any open menu on outside click or Escape — one root ref covers them all.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-3xl transition-colors',
          'border border-black/[0.08] bg-white text-[#1a2b32]',
          'shadow-[0_4px_24px_rgba(8,40,48,0.06)]',
          'focus-within:border-[#0f8bab]/45 focus-within:shadow-[0_4px_24px_rgba(8,40,48,0.1)]',
          'dark:border-white/[0.08] dark:bg-[#0e1619] dark:text-[#e6eef1] dark:shadow-none',
          'dark:focus-within:border-[#40c4d3]/45',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#0e1619]',
          '[--prompt-area-placeholder:#7a8d95] dark:[--prompt-area-placeholder:#6f8088]',
        )}>
        {/* Attached projects show as removable context chips above the input. */}
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
            {projects.map((p) => (
              <span
                key={p}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-black/[0.03] pr-1 pl-2 text-[13px] text-[#1a2b32] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e6eef1]">
                <Box className="size-3.5 shrink-0 text-[#8aa0a8] dark:text-[#7f939b]" />
                <span className="max-w-44 truncate">{p}</span>
                <span className="text-[#8aa0a8] dark:text-[#7f939b]">(1/1)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeProject(p)
                  }}
                  aria-label={`Remove ${p}`}
                  className="flex size-4 items-center justify-center rounded-full text-[#8aa0a8] transition-colors hover:bg-black/[0.08] hover:text-[#1a2b32] dark:text-[#7f939b] dark:hover:bg-white/10 dark:hover:text-[#e6eef1]">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu('add')
                setAddSub(null)
              }}
              aria-label="Add more context"
              className="flex size-7 items-center justify-center rounded-lg border border-dashed border-black/15 text-[#8aa0a8] transition-colors hover:border-black/25 hover:text-[#1a2b32] dark:border-white/15 dark:text-[#7f939b] dark:hover:border-white/30 dark:hover:text-[#e6eef1]">
              <Plus className="size-3.5" />
            </button>
          </div>
        )}

        {/* The input */}
        <div className="px-4 pt-3.5 pb-1 text-[15px] leading-6">
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            triggers={triggers ?? DEFAULT_TRIGGERS}
            placeholder="Enter @ to add context or / for prompt"
            onSubmit={submit}
            markdown={markdown}
            autoGrow
            minHeight={28}
            maxHeight={220}
          />
        </div>

        {/* Control row */}
        <div className="flex items-center gap-1.5 px-2.5 pt-1 pb-2.5">
          <div className="relative">
            <AddMenu
              open={openMenu === 'add'}
              setOpen={(next) => setOpenMenu(next ? 'add' : null)}
              sub={addSub}
              setSub={setAddSub}
              attachProject={attachProject}
              setBrand={setBrandState}
            />
            {projects.length > 0 && (
              <span
                className="pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: BRAND }}>
                {projects.length}
              </span>
            )}
          </div>

          <ToolsCluster
            onOpen={() => {
              setOpenMenu('add')
              setAddSub('integrations')
            }}
          />

          <BrandControl
            open={openMenu === 'brand'}
            setOpen={(next) => setOpenMenu(next ? 'brand' : null)}
            brand={brand}
            setBrand={setBrandState}
            clearBrand={() => setBrandState(null)}
          />

          <div className="grow" />

          <ModelMenu
            open={openMenu === 'model'}
            setOpen={(next) => setOpenMenu(next ? 'model' : null)}
            model={model}
            onSelect={setModel}
          />

          <button type="button" className={ICON_BTN} aria-label="Record audio message">
            <Mic className="size-4" />
          </button>

          <button
            type="submit"
            onClick={() => submit(segments)}
            aria-label="Send message"
            disabled={isEmpty}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity',
              // bg-gradient-primary + text-inButton, resolved per theme from the
              // product's juma-blue tokens: light is a soft-cyan gradient with a
              // dark gunmetal mark, dark is a deep-teal gradient with a white one.
              'text-[#002529] dark:text-white',
              '[background-image:linear-gradient(135deg,#9aedf7,#7de4f0)]',
              'dark:[background-image:linear-gradient(135deg,#14728b,#0f8bab)]',
              isEmpty ? 'opacity-40' : 'hover:opacity-90',
            )}>
            <CursorIcon className="size-8" />
          </button>
        </div>
      </div>

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const jumaInputCode = `import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Plus, X, Upload, Search, SquarePen, Box, Palette, Blocks,
  ChevronRight, ChevronDown, Check, Mic, SatelliteDish, RotateCcw, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptArea, isSegmentsEmpty } from '@/components/prompt-area'
import type { Segment, PromptAreaHandle, TriggerConfig, TriggerSuggestion } from '@/components/types'

// Juma's eight-petal brand spark (from the official logo), tintable via currentColor.
const SPARK_PETALS = [/* 8 path d-strings from juma-icon-*.svg */]
function JumaSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="currentColor" aria-hidden className={className}>
      {SPARK_PETALS.map((d) => <path key={d} d={d} />)}
    </svg>
  )
}
// The product's send glyph, copied verbatim from CursorIcon — a single spark
// leaf that inherits the button's inButton color via currentColor.
function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('block h-fit', className)} fill="none" viewBox="0 0 96 96" aria-hidden>
      <g clipPath="url(#juma-send-clip)">
        <path d="M52.7121 53.4464C52.0413 54.1652 51.5301 55.9862 50.7953 58.5259C47.9521 69.8031 44.0226 79.467 36.8506 66.6244C33.8316 60.7462 25.9567 40.8594 24.3434 34.6937C21.1647 19.9343 33.9913 24.7902 43.224 28.1446C51.9933 31.4191 61.6892 34.4381 69.2765 39.6294C80.4579 48.2071 55.5235 50.699 52.8399 53.3026L52.7121 53.4464Z" fill="currentColor" />
      </g>
      <defs><clipPath id="juma-send-clip"><rect fill="white" height="96" width="96" /></clipPath></defs>
    </svg>
  )
}

type JumaModel = { id: string; name: string; desc: string }
const MODELS: JumaModel[] = [
  { id: 'juma-agent', name: 'Juma Agent', desc: 'Most optimized for Juma' },
  { id: 'gpt-5.5', name: 'GPT-5.5', desc: "Free during World Cup '26" },
]
const ADVANCED_MODELS: JumaModel[] = [
  { id: 'opus-4.8', name: 'Claude Opus 4.8', desc: 'For your hardest tasks' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', desc: 'Long-context research' },
]
const PROJECTS = ['Spring Campaign', 'Newsletter Revamp', 'Website Refresh', 'Social Calendar', 'Product Launch']
type Brand = { id: string; name: string; colors: string[] }
const BRANDS: Brand[] = [
  { id: 'acme', name: 'Acme', colors: ['#f26b21', '#f47b32', '#f58a4a', '#e08a7d', '#f2f2f2'] },
  { id: 'lumen', name: 'Lumen', colors: ['#1f44d6', '#e0322b', '#d83a30', '#3f9d52', '#c9c9c9'] },
  { id: 'northwind', name: 'Northwind', colors: ['#f4f4f4', '#cfcfcf', '#c8c4e0', '#b6d44a', '#ffffff'] },
]
const PROMPTS = ['Summarize this', 'Write a LinkedIn post', 'Run a brand audit', 'Draft an SEO brief']

// Juma's juma-blue scale: #9aedf7/#7de4f0 (light send gradient) · #14728b/#0f8bab
// (dark) · #002529 (light send mark). The send button mirrors bg-gradient-primary
// + text-inButton, resolved per theme below.
const BRAND = '#0f8bab'
const BRAND_SOFT = '#40c4d3'

const ICON_BTN = 'flex size-9 shrink-0 items-center justify-center rounded-full text-[#516068] transition-colors hover:bg-black/[0.05] dark:text-[#9fb1b9] dark:hover:bg-white/[0.08]'
const MENU = 'absolute z-30 flex min-w-[256px] flex-col rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(8,40,48,0.16)] dark:border-white/10 dark:bg-[#16242a]'
const ROW = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[#1a2b32] transition-colors hover:bg-black/[0.05] dark:text-[#e6eef1] dark:hover:bg-white/[0.06]'

// "@" attaches inline context, "/" drops in a saved prompt — host can override via the triggers prop.
const DEFAULT_TRIGGERS: TriggerConfig[] = [
  {
    char: '@', position: 'any', mode: 'dropdown', accessibilityLabel: 'context',
    chipClassName: 'rounded-md bg-[#40c4d3]/15 px-1 font-medium text-[#0f8bab] dark:bg-[#40c4d3]/20 dark:text-[#7de4f0]',
    onSearch: (q) => [
      ...PROJECTS.map((p) => ({ value: 'project:' + p, label: p, description: 'Project' })),
      ...BRANDS.map((b) => ({ value: 'brand:' + b.id, label: b.name, description: 'Brand profile' })),
    ].filter((s) => s.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/', position: 'start', mode: 'dropdown', accessibilityLabel: 'prompt',
    chipClassName: 'rounded-md bg-black/[0.06] px-1 font-medium dark:bg-white/10',
    onSearch: (q) => PROMPTS.filter((p) => p.toLowerCase().includes(q.toLowerCase())).map((p) => ({ value: p, label: p })),
  },
]

function JumaInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<Segment[] | null>(null)
  const [model, setModel] = useState<JumaModel>(MODELS[0])
  const [projects, setProjects] = useState<string[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [openMenu, setOpenMenu] = useState<'add' | 'model' | 'brand' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const submit = (segs: Segment[]) => {
    if (isSegmentsEmpty(segs)) return
    setSubmitted(segs)
    promptRef.current?.clear()
    setSegments([])
  }
  const reset = () => {
    if (submitted) setSegments(submitted)
    setSubmitted(null)
    promptRef.current?.focus()
  }

  const attachProject = (name: string) => setProjects((p) => (p.includes(name) ? p : [...p, name]))
  const removeProject = (name: string) => setProjects((p) => p.filter((x) => x !== name))

  // Close any open menu on outside click or Escape.
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  // AddMenu (uploads, searches, and "Use a project / brand profile / integrations" fly-outs),
  // ToolsCluster (the connected-integrations pill), BrandControl (the palette button that turns
  // into a teal brand-voice chip with a hover-revealed remove), and ModelMenu (the "Models" list
  // with an "Advanced" disclosure) are wired the same way as the Gemini & Claude styles — each
  // opens above the control row and closes on outside click. See the live source for the menus.

  return (
    <div className="flex flex-col gap-3" ref={rootRef}>
      <div
        onClick={() => promptRef.current?.focus()}
        className={cn(
          'relative cursor-text rounded-3xl border border-black/[0.08] bg-white text-[#1a2b32] shadow-[0_4px_24px_rgba(8,40,48,0.06)]',
          'focus-within:border-[#0f8bab]/45 dark:border-white/[0.08] dark:bg-[#0e1619] dark:text-[#e6eef1] dark:focus-within:border-[#40c4d3]/45',
          '[--prompt-area-surface:#ffffff] dark:[--prompt-area-surface:#0e1619]',
          '[--prompt-area-placeholder:#7a8d95] dark:[--prompt-area-placeholder:#6f8088]',
        )}>
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
            {projects.map((p) => (
              <span key={p} className="flex h-7 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-black/[0.03] pr-1 pl-2 text-[13px] dark:border-white/10 dark:bg-white/[0.04]">
                <Box className="size-3.5 shrink-0 text-[#8aa0a8]" />
                <span className="max-w-44 truncate">{p}</span>
                <span className="text-[#8aa0a8]">(1/1)</span>
                <button onClick={(e) => { e.stopPropagation(); removeProject(p) }} aria-label={'Remove ' + p} className="flex size-4 items-center justify-center rounded-full text-[#8aa0a8] hover:bg-black/[0.08] dark:hover:bg-white/10">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="px-4 pt-3.5 pb-1 text-[15px] leading-6">
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            triggers={DEFAULT_TRIGGERS}
            placeholder="Enter @ to add context or / for prompt"
            onSubmit={submit}
            markdown
            autoGrow
            minHeight={28}
            maxHeight={220}
          />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 pt-1 pb-2.5">
          {/* AddMenu "+" (with a project-count badge), the connected-integrations cluster, and the
              brand-voice chip live here on the left. */}
          <AddMenu open={openMenu === 'add'} setOpen={(n) => setOpenMenu(n ? 'add' : null)} attachProject={attachProject} setBrand={setBrand} count={projects.length} />
          <ToolsCluster />
          <BrandControl open={openMenu === 'brand'} setOpen={(n) => setOpenMenu(n ? 'brand' : null)} brand={brand} setBrand={setBrand} clearBrand={() => setBrand(null)} />

          <div className="grow" />

          <ModelMenu open={openMenu === 'model'} setOpen={(n) => setOpenMenu(n ? 'model' : null)} model={model} onSelect={setModel} />
          <button className={ICON_BTN} aria-label="Record audio message"><Mic className="size-4" /></button>
          <button
            type="submit"
            onClick={() => submit(segments)}
            aria-label="Send message"
            disabled={isEmpty}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity',
              'text-[#002529] dark:text-white',
              '[background-image:linear-gradient(135deg,#9aedf7,#7de4f0)] dark:[background-image:linear-gradient(135deg,#14728b,#0f8bab)]',
              isEmpty ? 'opacity-40' : 'hover:opacity-90',
            )}>
            <CursorIcon className="size-8" />
          </button>
        </div>
      </div>

      {submitted && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Submitted — clear to send again.</span>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs" aria-label="Reset">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  )
}`

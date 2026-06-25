import type { ReactElement, SVGProps } from 'react'
import { SquareTerminal, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Vendor logos for the built-in agent styles (Juma, ChatGPT, Claude, Claude
 * Code, Codex, Gemini, Perplexity). lucide-react dropped brand glyphs, so — like
 * github-icon.tsx — the official marks live here as inline SVG paths. Rendering
 * them inline (rather than as <img>) keeps them crisp at any size and lets each
 * adopt its brand color through `currentColor`, so the same mark works in light
 * and dark themes.
 *
 * ChatGPT, Claude, and Perplexity use their official single-path brand marks
 * (viewBox 0 0 24 24), tinted via `currentColor`. Codex and Gemini use their own
 * full-color gradient marks. Claude Code has no mark distinct from Anthropic, so
 * it borrows a terminal glyph tinted in Claude's coral — keeping every tile
 * unique while color still signals the vendor.
 */

type BrandMark = { title: string; d: string }

const OPENAI: BrandMark = {
  title: 'OpenAI',
  d: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
}

const CLAUDE: BrandMark = {
  title: 'Claude',
  d: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
}

const PERPLEXITY: BrandMark = {
  title: 'Perplexity',
  d: 'M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z',
}

/**
 * Gemini's mark is a four-pointed "spark" filled with its blue→purple→pink brand
 * gradient, so — like Codex — it renders its own path and gradient rather than
 * tinting `currentColor`.
 */
function GeminiLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Gemini logo" className={className} {...props}>
      <title>Gemini</title>
      <path
        d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"
        fill="url(#style-logo-gemini-gradient)"
      />
      <defs>
        <linearGradient
          id="style-logo-gemini-gradient"
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

/**
 * Juma's mark is its eight-petal "spark" set in a rounded square — the official
 * logo (apps/web/public/logo/svg/juma-icon-sky.svg in the product). It carries
 * its own colors (the brand's sky tile with a near-black spark, which reads on
 * both light and dark tiles), so like Codex and Gemini it renders its own paths
 * rather than tinting `currentColor`.
 */
function JumaLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const petals = [
    'M79.9745 127.906C79.3681 127.927 78.3489 128.497 76.9323 129.282C70.7918 132.946 64.8755 135.448 67.3419 126.744C68.5903 122.872 73.8085 110.799 75.7857 107.411C80.8255 99.5987 84.2907 107.299 86.8488 112.777C89.2439 118.015 92.1383 123.549 93.1881 129.109C94.3194 137.7 82.39 127.942 80.0866 127.906H79.9694H79.9745Z',
    'M80.0255 32.0938C80.6319 32.0734 81.6511 31.5026 83.0677 30.7179C89.2082 27.0539 95.1245 24.5519 92.6581 33.2556C91.4096 37.1285 86.1915 49.2006 84.2143 52.5893C79.1745 60.4013 75.7093 52.7014 73.1512 47.2234C70.7561 41.9848 67.8616 36.4507 66.8119 30.8911C65.6806 22.2995 77.61 32.0581 79.9134 32.0938H80.0306H80.0255Z',
    'M32.0938 79.9745C32.0734 79.3681 31.5026 78.3489 30.7179 76.9323C27.0539 70.7918 24.5519 64.8755 33.2556 67.3419C37.1285 68.5903 49.2006 73.8085 52.5893 75.7857C60.4013 80.8255 52.7014 84.2907 47.2234 86.8488C41.9848 89.2439 36.4507 92.1383 30.8911 93.1881C22.2995 94.3194 32.0581 82.39 32.0938 80.0866V79.9694V79.9745Z',
    'M127.906 80.0255C127.927 80.6319 128.497 81.6511 129.282 83.0677C132.946 89.2082 135.448 95.1245 126.744 92.6581C122.872 91.4096 110.799 86.1915 107.411 84.2143C99.5987 79.1745 107.299 75.7093 112.777 73.1512C118.015 70.7561 123.549 67.8616 129.109 66.8119C137.7 65.6806 127.942 77.61 127.906 79.9134V80.0306V80.0255Z',
    'M46.1074 113.857C45.6641 113.444 44.543 113.123 42.9836 112.68C36.0482 110.927 30.0962 108.516 37.9999 104.103C41.6179 102.249 53.848 97.4024 57.6444 96.4036C66.7304 94.4468 63.7391 102.34 61.6702 108.022C59.6624 113.419 57.7973 119.381 54.6022 124.054C49.328 130.928 47.789 115.595 46.194 113.938L46.1074 113.857Z',
    'M113.893 46.1431C114.336 46.5558 115.457 46.8769 117.016 47.3202C123.952 49.0732 129.904 51.4835 122 55.8966C118.382 57.7514 106.152 62.5976 102.356 63.5964C93.2696 65.5532 96.2609 57.6597 98.3298 51.9778C100.338 46.5813 102.203 40.6191 105.398 35.9462C110.672 29.0719 112.211 44.4054 113.806 46.0615L113.893 46.1431Z',
    'M46.1431 46.1074C46.5558 45.6641 46.8769 44.543 47.3202 42.9836C49.0732 36.0482 51.4835 30.0962 55.8966 37.9999C57.7514 41.6179 62.5976 53.848 63.5964 57.6444C65.5532 66.7304 57.6597 63.7391 51.9778 61.6702C46.5813 59.6624 40.6191 57.7973 35.9462 54.6022C29.0719 49.328 44.4054 47.789 46.0615 46.194L46.1431 46.1074Z',
    'M113.857 113.893C113.444 114.336 113.123 115.457 112.68 117.016C110.927 123.952 108.516 129.904 104.103 122C102.249 118.382 97.4024 106.152 96.4036 102.356C94.4468 93.2696 102.34 96.2609 108.022 98.3298C113.419 100.338 119.381 102.203 124.054 105.398C130.928 110.672 115.595 112.211 113.938 113.806L113.857 113.893Z',
  ]
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Juma logo" className={className} {...props}>
      <title>Juma</title>
      <path
        d="M121.878 0H38.1222C17.0679 0 0 17.0679 0 38.1222V121.878C0 142.932 17.0679 160 38.1222 160H121.878C142.932 160 160 142.932 160 121.878V38.1222C160 17.0679 142.932 0 121.878 0Z"
        fill="#9AEDF7"
      />
      {petals.map((d) => (
        <path key={d} d={d} fill="#0a2026" />
      ))}
    </svg>
  )
}

/**
 * Codex ships a full-color gradient mark (a white badge with a violet-to-blue
 * glyph), so unlike the single-path marks it renders its own paths and gradient
 * rather than tinting `currentColor`.
 */
function CodexLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Codex logo" className={className} {...props}>
      <title>Codex</title>
      <path
        d="M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z"
        fill="#fff"
      />
      <path
        d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z"
        fill="url(#style-logo-codex-gradient)"
      />
      <defs>
        <linearGradient
          id="style-logo-codex-gradient"
          gradientUnits="userSpaceOnUse"
          x1="12"
          x2="12"
          y1="3"
          y2="21">
          <stop stopColor="#B1A7FF" />
          <stop offset=".5" stopColor="#7A9DFF" />
          <stop offset="1" stopColor="#3941FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Each style id maps to its mark plus, for the single-path marks, the brand
 * color it renders in. OpenAI's mark is monochrome, so ChatGPT follows the page
 * foreground (black on light, white on dark); Claude keeps its coral and
 * Perplexity its turquoise (darkened in light mode for contrast, matching the
 * style example). Claude Code borrows a coral terminal glyph; Codex carries its
 * own full-color mark.
 */
type LogoSpec =
  | { kind: 'mark'; mark: BrandMark; color: string }
  | { kind: 'glyph'; icon: LucideIcon; title: string; color: string }
  | { kind: 'full'; render: (props: SVGProps<SVGSVGElement>) => ReactElement }

const STYLE_LOGOS = {
  juma: { kind: 'full', render: (props) => <JumaLogo {...props} /> },
  chatgpt: { kind: 'mark', mark: OPENAI, color: 'text-foreground' },
  claude: { kind: 'mark', mark: CLAUDE, color: 'text-[#D97757]' },
  'claude-code': {
    kind: 'glyph',
    icon: SquareTerminal,
    title: 'Claude Code',
    color: 'text-[#D97757]',
  },
  codex: { kind: 'full', render: (props) => <CodexLogo {...props} /> },
  gemini: { kind: 'full', render: (props) => <GeminiLogo {...props} /> },
  perplexity: { kind: 'mark', mark: PERPLEXITY, color: 'text-[#13889a] dark:text-[#20b8cd]' },
} satisfies Record<string, LogoSpec>

export type StyleLogoId = keyof typeof STYLE_LOGOS

export const STYLE_LOGO_IDS = Object.keys(STYLE_LOGOS) as StyleLogoId[]

type StyleLogoProps = {
  id: StyleLogoId
} & Omit<SVGProps<SVGSVGElement>, 'id'>

export function StyleLogo({ id, className, ...props }: StyleLogoProps) {
  const spec = STYLE_LOGOS[id]

  // Codex and Gemini carry their own colors, so they skip the brand-color class.
  if (spec.kind === 'full') {
    return spec.render({ className: cn('size-10', className), ...props })
  }

  const classes = cn('size-10', spec.color, className)

  if (spec.kind === 'glyph') {
    const Glyph = spec.icon
    return (
      <Glyph strokeWidth={2.25} className={classes} aria-label={`${spec.title} logo`} {...props} />
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={`${spec.mark.title} logo`}
      className={classes}
      {...props}>
      <title>{spec.mark.title}</title>
      <path d={spec.mark.d} />
    </svg>
  )
}

// Builds dist/tailwind.css — the optional Tailwind v4 preset.
//
// Consumers who run Tailwind themselves import this from their CSS entry
// (`@import 'prompt-area/tailwind.css';`) to get the design tokens, theme
// mappings, and component styles, and to let their own Tailwind pipeline
// generate the utility classes the components use. The `@source` directive
// (relative to this file inside dist/) points Tailwind at the built JS so
// no manual content configuration is needed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

const header = `/**
 * Prompt Area — Tailwind v4 preset.
 *
 * For consumers who run Tailwind themselves and want token-level theming.
 * If you are not using Tailwind, import 'prompt-area/styles.css' instead.
 *
 *   @import 'prompt-area/tailwind.css';
 *
 * The component styles use a few tw-animate-css utilities; if you want the
 * entrance/spinner animations, also: @import 'tw-animate-css';
 */
@custom-variant dark (&:is(.dark *));

/* Generate the utilities the components use from the built output. */
@source './**/*.js';
`

const out = [
  header,
  read('src/styles/theme.css'),
  read('src/styles/tokens.css'),
  read('src/styles/components.css'),
].join('\n')

mkdirSync(join(root, 'dist'), { recursive: true })
writeFileSync(join(root, 'dist/tailwind.css'), out)
console.log('Built dist/tailwind.css')

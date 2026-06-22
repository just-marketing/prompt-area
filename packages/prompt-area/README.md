# prompt-area

[![npm version](https://img.shields.io/npm/v/prompt-area.svg)](https://www.npmjs.com/package/prompt-area)
[![npm downloads](https://img.shields.io/npm/dm/prompt-area.svg)](https://www.npmjs.com/package/prompt-area)
[![license](https://img.shields.io/npm/l/prompt-area.svg)](https://github.com/just-marketing/prompt-area/blob/main/LICENSE)

An opinionated, dependency-light React rich-text **prompt input** — trigger-based chips (`@mentions`, `/commands`, `#tags`), inline markdown, undo/redo, file & image attachments, and a complete chat-input layout.

Ships **two ways** from the same source:

- **npm package** (this package) — `npm install prompt-area`, import the component and a stylesheet. Versioned, opinionated, batteries-included.
- **[shadcn registry](https://prompt-area.com)** — `npx shadcn@latest add https://prompt-area.com/r/prompt-area.json` to copy the source into your project and own it.

**Try it live:** [run the example in your browser](https://prompt-area.com/docs/try-it-live) — a full Vite + React app, no setup. ([source](https://github.com/just-marketing/prompt-area/tree/main/examples/basic))

## Install

```bash
pnpm add prompt-area
# or: npm install prompt-area  ·  yarn add prompt-area
```

Peer dependencies: `react` and `react-dom` (most React apps already have them),
plus `clsx` and `tailwind-merge` — the two `cn` helpers, already present in any
shadcn/Tailwind project. If you don't have them yet:

```bash
pnpm add clsx tailwind-merge
```

## Quick start

```tsx
'use client'
import { useState } from 'react'
import { PromptArea, mentionTrigger, type Segment } from 'prompt-area'
import 'prompt-area/styles.css'

export function Composer() {
  const [value, setValue] = useState<Segment[]>([])

  return (
    <PromptArea
      value={value}
      onChange={setValue}
      placeholder="Type a message…"
      autoGrow
      triggers={[
        mentionTrigger({
          onSearch: async (q) =>
            [
              { id: '1', label: 'Ada Lovelace', value: 'ada' },
              { id: '2', label: 'Alan Turing', value: 'alan' },
            ].filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
        }),
      ]}
      onSubmit={(segments) => console.log(segments)}
    />
  )
}
```

## Styling

The components are styled with Tailwind utility classes plus a small set of design tokens. You can use them **with or without** Tailwind.

### Option A — prebuilt CSS (zero config)

Import the compiled stylesheet once. It is self-contained, ships **no global reset** (it won't restyle the rest of your app), and works in any React app.

```ts
import 'prompt-area/styles.css'
```

Theme it by overriding the CSS variables (same names as shadcn/ui):

```css
:root {
  --primary: oklch(0.62 0.19 260);
  --radius: 0.5rem;
}
```

Dark mode follows a `.dark` ancestor (add `class="dark"` to `<html>` or a wrapper).

### Option B — Tailwind v4 preset (themeable)

If you run Tailwind yourself, import the preset from your CSS entry instead. It registers the tokens and component styles and points Tailwind at the built files so the utilities are generated in your pipeline.

```css
@import 'tailwindcss';
@import 'prompt-area/tailwind.css';
/* for the entrance/spinner animations: */
@import 'tw-animate-css';
```

In a shadcn project the token names already exist, so the component automatically inherits your theme — you usually don't need to do anything.

## Exports

| Import                            | Description                                               |
| --------------------------------- | --------------------------------------------------------- |
| `prompt-area`                     | Everything: components, hooks, helpers, and types         |
| `prompt-area/prompt-area`         | `PromptArea` + its types/hooks                            |
| `prompt-area/action-bar`          | `ActionBar`                                               |
| `prompt-area/status-bar`          | `StatusBar`                                               |
| `prompt-area/compact-prompt-area` | `CompactPromptArea`                                       |
| `prompt-area/chat-prompt-layout`  | `ChatPromptLayout`                                        |
| `prompt-area/helpers`             | Framework-agnostic helpers, **safe in Server Components** |
| `prompt-area/styles.css`          | Prebuilt stylesheet                                       |
| `prompt-area/tailwind.css`        | Tailwind v4 preset                                        |

All blocks are tree-shakeable, so deep-importing a single block keeps your bundle small.

### React Server Components

The components are client components and carry a `'use client'` boundary, so you can render them directly from a Server Component. The pure helpers (e.g. `segmentsToPlainText`, `parseInlineMarkdown`, trigger presets) are also re-exported from `prompt-area/helpers` **without** the client boundary, so they can run on the server too.

## Dependencies

- **Peer:** `react`, `react-dom` (>= 18), plus `clsx` and `tailwind-merge` —
  the two `cn` helpers. These are peer (not bundled) dependencies so they
  dedupe with the copies any shadcn/Tailwind project already ships, keeping
  prompt-area's own footprint to **zero bundled runtime dependencies**. Both
  are tiny and already present in shadcn projects; install them explicitly if
  you don't have them (`pnpm add clsx tailwind-merge`).
- **Tailwind is not a peer dependency.** The prebuilt `prompt-area/styles.css`
  is self-contained and works with **any** stack — Tailwind v4, v3, or no
  Tailwind at all. The optional `prompt-area/tailwind.css` preset uses Tailwind
  v4 syntax, so it requires Tailwind v4 in your own project; if you're on v3 or
  not using Tailwind, use `styles.css` (and theme via the CSS variables above).

No animation library and no icon library: animations use CSS (`tw-animate-css`
utilities) and icons are inline SVGs. No editor framework (ProseMirror, Slate,
Lexical) either.

ESM-only. Requires Node 18+ / a modern bundler (Next.js, Vite, etc.).

## License

MIT

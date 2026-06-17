# Prompt Area — basic live example

A minimal **Vite + React + TypeScript** app that installs [`prompt-area`](https://www.npmjs.com/package/prompt-area) from npm and renders a `PromptArea` with `@`/`/`/`#` triggers.

## Try it live

[**Open in StackBlitz →**](https://stackblitz.com/github/just-marketing/prompt-area/tree/main/examples/basic?file=src%2FApp.tsx)

StackBlitz boots this folder straight from GitHub — `npm install` and the Vite dev server run in your browser (no sign-in, no local setup).

## Run locally

```bash
npm install
npm run dev
```

## What it shows

- Importing the self-contained stylesheet: `import 'prompt-area/styles.css'` (no Tailwind required)
- Trigger-based chips via the `triggers` prop (`@` mentions, `/` commands, `#` tags)
- Reading the submitted value with `segmentsToPlainText`

See [`src/App.tsx`](./src/App.tsx) for the full component.

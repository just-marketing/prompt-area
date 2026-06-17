# Prompt Area — basic live example

A minimal **Vite + React + TypeScript** app that installs [`prompt-area`](https://www.npmjs.com/package/prompt-area) from npm and renders a `PromptArea` with `@`/`/`/`#` triggers.

## Try it live

[**Run it in your browser →**](https://prompt-area.com/docs/try-it-live)

The docs site runs this exact app inline (real Vite + npm, in-browser) — no account, no clone, no local setup.

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

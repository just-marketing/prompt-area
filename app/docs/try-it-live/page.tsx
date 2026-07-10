import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2 } from '@/components/docs/docs-primitives'
import { LiveExample } from '@/components/live-example'

const SITE_URL = 'https://prompt-area.com'
const SOURCE_URL = 'https://github.com/just-marketing/prompt-area/tree/main/examples/basic'

export const metadata: Metadata = {
  title: 'Try it Live',
  description:
    'Run a Vite + React app using prompt-area right in your browser — no setup. Edit the code and see @mentions, /commands, and #tags update live.',
  alternates: { canonical: `${SITE_URL}/docs/try-it-live` },
}

// Read the example sources at build time so the live editor stays in sync with
// the real `examples/basic` app — single source of truth, no duplicated code.
// We override the Sandpack vite-react-ts template's `index.html` so Vite uses
// the example's own `/src/main.tsx` entry (the template otherwise boots its own
// root-level `/App.tsx`).
const PROMPT_AREA_VERSION = '0.6.0'
// Sandpack's in-browser bundler doesn't reliably process the `prompt-area/styles.css`
// import (it resolves through the package `exports` map), so we also load the
// published stylesheet via a <link>. `examples/basic` itself keeps the canonical
// `import 'prompt-area/styles.css'` for real-world local use.
const PROMPT_AREA_CSS = `https://cdn.jsdelivr.net/npm/prompt-area@${PROMPT_AREA_VERSION}/dist/styles.css`

const exampleRoot = join(process.cwd(), 'examples/basic')
const read = (file: string) => readFileSync(join(exampleRoot, file), 'utf8')
const indexHtml = read('index.html').replace(
  '</head>',
  `    <link rel="stylesheet" href="${PROMPT_AREA_CSS}" />\n  </head>`,
)
const exampleFiles: Record<string, string> = {
  '/index.html': indexHtml,
  '/src/main.tsx': read('src/main.tsx'),
  '/src/App.tsx': read('src/App.tsx'),
  '/src/styles.css': read('src/styles.css'),
}

export default function TryItLivePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Try it Live</h1>
      <DocsLead>
        A complete Vite + React + TypeScript app that installs{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">prompt-area</code> from npm
        and renders a{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">PromptArea</code> with{' '}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">@</code>/
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">/</code>/
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">#</code> triggers — running
        entirely in your browser.
      </DocsLead>

      <DocsH2 id="live-editor">Live editor</DocsH2>
      <DocsP>
        Edit <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">src/App.tsx</code> and
        the preview updates live. The first run installs dependencies, so give it a few seconds.
      </DocsP>
      {/* clsx + tailwind-merge are peerDependencies since 0.5.0 — Sandpack does
          not auto-install peers, so they must be listed explicitly. */}
      <LiveExample
        files={exampleFiles}
        dependencies={{
          'prompt-area': PROMPT_AREA_VERSION,
          clsx: '2.1.1',
          'tailwind-merge': '3.6.0',
        }}
      />

      <DocsP>
        This is the real{' '}
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-4">
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">examples/basic</code>
        </a>{' '}
        app, installed from npm and running in your browser — no account or clone required.
      </DocsP>

      <DocsH2 id="run-locally">Run it locally</DocsH2>
      <DocsP>
        Prefer your own editor? Clone the repo and run the example directly — it uses the published
        package, so it works in any React project the same way:
      </DocsP>
      <pre className="bg-muted overflow-x-auto rounded-lg p-4 font-mono text-sm">
        {`git clone https://github.com/just-marketing/prompt-area
cd prompt-area/examples/basic
npm install
npm run dev`}
      </pre>

      <DocsP>
        New to the API? Start with the{' '}
        <Link
          href="/docs/quick-start"
          className="text-foreground font-medium underline underline-offset-4">
          Quick Start
        </Link>
        .
      </DocsP>
    </>
  )
}

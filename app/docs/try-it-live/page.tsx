import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLead, DocsP, DocsH2 } from '@/components/docs/docs-primitives'
import { OpenInCodeSandbox, CODESANDBOX_EMBED_URL } from '@/components/open-in-codesandbox'

const SITE_URL = 'https://prompt-area.com'
const SOURCE_URL = 'https://github.com/just-marketing/prompt-area/tree/main/examples/basic'

export const metadata: Metadata = {
  title: 'Try it Live',
  description:
    'Boot a full Vite + React app using prompt-area in CodeSandbox — no local setup. Edit the code and see @mentions, /commands, and #tags update live.',
  alternates: { canonical: `${SITE_URL}/docs/try-it-live` },
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

      <div className="flex flex-wrap items-center gap-3">
        <OpenInCodeSandbox />
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground text-sm font-medium underline underline-offset-4 transition-colors">
          View the source
        </a>
      </div>

      <DocsH2 id="live-editor">Live editor</DocsH2>
      <DocsP>
        Edit <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">src/App.tsx</code> on
        the left and the preview updates on the right. The first load installs dependencies, so give
        it a few seconds.
      </DocsP>
      <iframe
        title="Prompt Area — live example on CodeSandbox"
        src={CODESANDBOX_EMBED_URL}
        loading="lazy"
        className="h-[600px] w-full overflow-hidden rounded-lg border"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />

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

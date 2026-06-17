'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Sandpack runs a real Vite + npm environment in the browser (no repo clone, no
// sign-in), installing `prompt-area` from npm and rendering the example inline.
// Loaded client-only — it pulls in a sizeable in-browser runtime.
//
// Sandpack's `<Sandpack>` has heavily-overloaded prop types that don't resolve
// well through a generic template + options combo, so we type the dynamic
// component to the exact prop shape we use (all values are valid at runtime).
type LiveSandpackProps = {
  template: 'vite-react-ts'
  theme: 'dark'
  customSetup: { dependencies: Record<string, string> }
  files: Record<string, string>
  options: {
    activeFile: string
    visibleFiles: string[]
    editorHeight: number
    showLineNumbers: boolean
    showTabs: boolean
  }
}

const Sandpack = dynamic(
  () =>
    import('@codesandbox/sandpack-react').then(
      (m) => m.Sandpack as unknown as ComponentType<LiveSandpackProps>,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-[560px] w-full items-center justify-center rounded-lg border text-sm">
        Loading live editor…
      </div>
    ),
  },
)

export function LiveExample({
  files,
  dependencies,
}: {
  files: Record<string, string>
  dependencies: Record<string, string>
}) {
  return (
    <Sandpack
      template="vite-react-ts"
      theme="dark"
      customSetup={{ dependencies }}
      files={files}
      options={{
        activeFile: '/src/App.tsx',
        visibleFiles: ['/src/App.tsx', '/src/main.tsx', '/src/styles.css'],
        editorHeight: 560,
        showLineNumbers: true,
        showTabs: true,
      }}
    />
  )
}

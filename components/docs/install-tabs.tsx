import { CodeBlock } from '@/components/code-block'
import { CodeTabs } from '@/components/code-tabs'

/**
 * Dual install + import for a single block, shown as npm / shadcn tabs.
 *
 * - npm: one `npm install prompt-area` and import from the package barrel.
 * - shadcn: `npx shadcn add <block>.json` and import from the copied source.
 *
 * Renders both Shiki-highlighted variants on the server; CodeTabs toggles
 * which is visible.
 */
export function InstallTabs({
  exportName,
  block,
}: {
  /** Named export(s) to import, e.g. `PromptArea` or `PromptArea, ActionBar`. */
  exportName: string
  /**
   * Registry file name (without extension), e.g. `prompt-area`. shadcn copies
   * each file flat into `@/components`, so this is also the shadcn import path.
   */
  block: string
}) {
  const npmTab = (
    <>
      <CodeBlock lang="bash" code={`npm install prompt-area`} />
      <CodeBlock lang="tsx" code={`import { ${exportName} } from 'prompt-area'`} />
    </>
  )
  const shadcnTab = (
    <>
      <CodeBlock
        lang="bash"
        code={`npx shadcn@latest add https://prompt-area.com/r/${block}.json`}
      />
      <CodeBlock lang="tsx" code={`import { ${exportName} } from '@/components/${block}'`} />
    </>
  )

  return (
    <CodeTabs
      label="Install method"
      tabs={[
        { label: 'npm', content: npmTab },
        { label: 'shadcn', content: shadcnTab },
      ]}
    />
  )
}

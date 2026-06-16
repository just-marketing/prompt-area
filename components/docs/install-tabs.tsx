import { CodeBlock } from '@/components/code-block'
import { CodeTabs } from './code-tabs'

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
  shadcnPath,
}: {
  /** Named export(s) to import, e.g. `PromptArea` or `PromptArea, ActionBar`. */
  exportName: string
  /** Registry file name (without extension), e.g. `prompt-area`. */
  block: string
  /** Path under the shadcn `@/components` alias, e.g. `prompt-area/prompt-area`. */
  shadcnPath: string
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
      <CodeBlock lang="tsx" code={`import { ${exportName} } from '@/components/${shadcnPath}'`} />
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

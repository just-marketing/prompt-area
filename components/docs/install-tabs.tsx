import { CodeBlock } from '@/components/code-block'
import { PackageManagerTabs } from '@/components/package-manager-tabs'

/**
 * Dual install for a single block: the npm package and the shadcn registry,
 * each with pnpm / npm / yarn tabs (pnpm default) and the matching import.
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
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">npm package</span>
        <PackageManagerTabs add="prompt-area" />
        <CodeBlock lang="tsx" code={`import { ${exportName} } from 'prompt-area'`} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">shadcn registry</span>
        <PackageManagerTabs dlx={`shadcn@latest add https://prompt-area.com/r/${block}.json`} />
        <CodeBlock lang="tsx" code={`import { ${exportName} } from '@/components/${block}'`} />
      </div>
    </div>
  )
}

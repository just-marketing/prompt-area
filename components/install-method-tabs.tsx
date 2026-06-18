import { CodeTabs } from '@/components/code-tabs'
import { PackageManagerTabs } from '@/components/package-manager-tabs'

/**
 * Homepage install switcher: pick the shadcn registry or the npm package, each
 * with pnpm / npm / yarn sub-tabs. shadcn leads to match the "shadcn chat
 * input" framing, with npm one click away — so the install command stays
 * consistent with the "npm + shadcn" badge instead of only ever showing npm.
 *
 * Both variants render in the static HTML (only visibility toggles), so every
 * command stays crawlable.
 */
export function InstallMethodTabs({ block = 'prompt-area' }: { block?: string }) {
  return (
    <CodeTabs
      label="Install method"
      tabs={[
        {
          label: 'shadcn',
          content: (
            <PackageManagerTabs dlx={`shadcn@latest add https://prompt-area.com/r/${block}.json`} />
          ),
        },
        {
          label: 'npm',
          content: <PackageManagerTabs add={block} />,
        },
      ]}
    />
  )
}

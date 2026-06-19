import { CodeTabs } from '@/components/code-tabs'
import { CommandBox } from '@/components/command-box'
import { packageManagerCommand } from '@/lib/package-managers'

/**
 * Homepage install switcher: one row of tabs to pick the shadcn registry or
 * the npm package, each showing a single pnpm-default command. shadcn leads to
 * match the "shadcn chat input" framing, with the npm package one click away —
 * so the install stays consistent with the "npm + shadcn" badge instead of
 * only ever showing npm. Per-manager (pnpm / npm / yarn) commands live in the
 * docs install section.
 *
 * Both commands render in the static HTML (only visibility toggles), so they
 * stay crawlable.
 */
export function InstallMethodTabs({ block = 'prompt-area' }: { block?: string }) {
  return (
    <CodeTabs
      label="Install method"
      tabs={[
        {
          label: 'shadcn',
          content: (
            <CommandBox
              compact
              cmd={packageManagerCommand('pnpm', {
                dlx: `shadcn@latest add https://prompt-area.com/r/${block}.json`,
              })}
            />
          ),
        },
        {
          label: 'npm package',
          content: <CommandBox compact cmd={packageManagerCommand('pnpm', { add: block })} />,
        },
      ]}
    />
  )
}

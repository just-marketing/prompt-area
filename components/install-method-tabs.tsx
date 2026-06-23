import { CodeTabs } from '@/components/code-tabs'
import { CommandBox } from '@/components/command-box'
import { InstallPromptBox } from '@/components/install-prompt-box'
import { packageManagerCommand } from '@/lib/package-managers'

/**
 * Homepage install switcher: one row of tabs to install with an AI agent, the
 * npm package, or the shadcn registry.
 *
 * The "AI agent" tab leads with the copy-paste prompt — the lowest-effort path,
 * and the one that does the whole integration for you. npm is next (the default
 * distribution), with the shadcn registry one click further. Per-manager (pnpm
 * / npm / yarn) commands live in the docs install section.
 *
 * The npm / shadcn commands render in the static HTML (only visibility
 * toggles), so they stay crawlable. The AI prompt is client-rendered (it has a
 * copy button) but mirrors the prose on /docs/installation.
 */
export function InstallMethodTabs({ block = 'prompt-area' }: { block?: string }) {
  return (
    <CodeTabs
      label="Install method"
      tabs={[
        {
          label: 'AI agent',
          content: <InstallPromptBox compact />,
        },
        {
          label: 'npm',
          content: <CommandBox compact cmd={packageManagerCommand('pnpm', { add: block })} />,
        },
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
      ]}
    />
  )
}

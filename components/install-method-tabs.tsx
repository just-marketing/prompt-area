'use client'

import { CodeTabs } from '@/components/code-tabs'
import { CommandBox } from '@/components/command-box'
import { InstallPromptBox } from '@/components/install-prompt-box'
import { track } from '@/lib/analytics'
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
 * Selecting a tab fires `install_method_selected` (tagged with the surface
 * `location`) so we can see which install path visitors lean toward on each
 * surface — the copy itself still fires `install_command_copied`. Client-
 * rendered for that tracking, but every tab's content is still SSR'd into the
 * initial HTML (only visibility toggles), so the commands stay crawlable.
 */
export function InstallMethodTabs({
  block = 'prompt-area',
  location,
}: {
  block?: string
  /** Where the tabs are rendered, forwarded to copy + selection analytics (e.g. 'hero'). */
  location?: string
}) {
  return (
    <CodeTabs
      label="Install method"
      onSelect={(_, label) => track('install_method_selected', { method: label, location })}
      tabs={[
        {
          label: 'AI agent',
          content: <InstallPromptBox compact />,
        },
        {
          // Labelled "npm" in the UI, but the command we copy uses pnpm — so
          // report method:'pnpm' to match the actual command and stay
          // consistent with PackageManagerTabs (method = the real CLI).
          label: 'npm',
          content: (
            <CommandBox
              compact
              method="pnpm"
              location={location}
              cmd={packageManagerCommand('pnpm', { add: block })}
            />
          ),
        },
        {
          label: 'shadcn',
          content: (
            <CommandBox
              compact
              method="shadcn"
              location={location}
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

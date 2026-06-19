'use client'

import { CodeTabs } from '@/components/code-tabs'
import { CommandBox } from '@/components/command-box'
import {
  PACKAGE_MANAGERS,
  packageManagerCommand,
  type PackageManager,
} from '@/lib/package-managers'

/**
 * Copy-able install command with pnpm / npm / yarn tabs (pnpm default).
 *
 * Pass `add` for a dependency install, or `dlx` for a one-off command such as
 * the shadcn CLI.
 */
export function PackageManagerTabs(props: { add: string } | { dlx: string }) {
  const op = 'add' in props ? { add: props.add } : { dlx: props.dlx }

  return (
    <CodeTabs
      label="Package manager"
      tabs={PACKAGE_MANAGERS.map((pm: PackageManager) => ({
        label: pm,
        content: <CommandBox cmd={packageManagerCommand(pm, op)} />,
      }))}
    />
  )
}

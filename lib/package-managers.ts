/** Supported package managers, in display order. pnpm is the default. */
export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

/**
 * Build the install / one-off command for a package manager.
 *
 * - `add`: install a dependency (`pnpm add`, `npm install`, `yarn add`).
 * - `dlx`: run a one-off binary like the shadcn CLI (`pnpm dlx`, `npx`,
 *   `yarn dlx`).
 */
export function packageManagerCommand(
  pm: PackageManager,
  op: { add: string } | { dlx: string },
): string {
  if ('add' in op) {
    return pm === 'npm' ? `npm install ${op.add}` : `${pm} add ${op.add}`
  }
  return pm === 'npm' ? `npx ${op.dlx}` : `${pm} dlx ${op.dlx}`
}

// Cut a release in one command.
//
//   pnpm release <version> [--yes] [--dry-run]
//   pnpm release 0.4.0
//   pnpm release v1.0.0 --yes
//
// Creates a GitHub Release whose tag drives the npm version. The Release
// workflow (.github/workflows/release.yml) then publishes
// prompt-area@<version> to npm and commits the version back to main.
//
// This script never touches package.json or npm directly — the tag is the
// single source of truth, the workflow does the rest.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout, argv, exit } from 'node:process'

const REPO = 'just-marketing/prompt-area'

function sh(file, args, opts = {}) {
  // With { stdio: 'inherit' } execFileSync returns null — guard before trimming.
  const out = execFileSync(file, args, { encoding: 'utf8', ...opts })
  return out == null ? '' : String(out).trim()
}
function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  exit(1)
}

const args = argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('-')))
const yes = flags.has('--yes') || flags.has('-y')
const dryRun = flags.has('--dry-run')
const raw = args.find((a) => !a.startsWith('-'))

if (!raw) fail('Usage: pnpm release <version> [--yes] [--dry-run]   (e.g. pnpm release 0.4.0)')

// Normalize: drop a leading v, coerce X.Y -> X.Y.0
let version = raw.replace(/^v/, '')
if (/^\d+\.\d+$/.test(version)) version += '.0'
if (!/^\d+\.\d+\.\d+([.-].+)?$/.test(version)) {
  fail(`'${raw}' is not a semver version. Try e.g. 0.4.0 or v1.0.0.`)
}
const tag = `v${version}`

// gh must be available and authenticated
try {
  sh('gh', ['auth', 'status'])
} catch {
  fail('GitHub CLI is not authenticated. Run: gh auth login')
}

// Refuse if the tag already exists on the remote
const existing = sh('git', [
  'ls-remote',
  '--tags',
  'origin',
  `refs/tags/${tag}`,
  `refs/tags/${version}`,
])
if (existing) fail(`A tag for ${version} already exists on origin. Pick a higher version.`)

// Context + a basic "must go up" guard against accidental downgrades
const pkgVersion = JSON.parse(readFileSync('packages/prompt-area/package.json', 'utf8')).version
let npmVersion = null
try {
  npmVersion = sh('npm', ['view', 'prompt-area', 'version'])
} catch {
  /* not published yet */
}

const core = (v) => v.split('-')[0].split('.').map(Number)
function isHigher(a, b) {
  const [x, y] = [core(a), core(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]
  return a.includes('-') ? false : b.includes('-') // equal core: release > prerelease
}
if (npmVersion && !isHigher(version, npmVersion) && !flags.has('--force')) {
  fail(`${version} is not higher than the published ${npmVersion}. Use --force to override.`)
}

console.log(`\n  release       ${tag}`)
console.log(`  npm current   ${npmVersion ?? 'unpublished'}`)
console.log(`  package.json  ${pkgVersion}`)
console.log(`  target        ${REPO} @ main`)
console.log(
  `\n  → creates GitHub release ${tag} → publishes prompt-area@${version} → syncs package.json on main\n`,
)

if (dryRun) {
  console.log('  (dry run — nothing created)\n')
  exit(0)
}

if (!yes) {
  if (!stdin.isTTY) fail('Not a TTY; re-run with --yes to confirm non-interactively.')
  const rl = createInterface({ input: stdin, output: stdout })
  const ans = (await rl.question('  Continue? (y/N) ')).trim().toLowerCase()
  rl.close()
  if (ans !== 'y' && ans !== 'yes') {
    console.log('  Aborted.\n')
    exit(0)
  }
}

sh(
  'gh',
  [
    'release',
    'create',
    tag,
    '--repo',
    REPO,
    '--target',
    'main',
    '--title',
    tag,
    '--generate-notes',
  ],
  { stdio: 'inherit' },
)
console.log(`\n✓ Created release ${tag}. Track the publish:`)
console.log(`  https://github.com/${REPO}/actions/workflows/release.yml\n`)

# Contributing to Prompt Area

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
pnpm install          # Install dependencies (pnpm required)
pnpm dev              # Start dev server (Next.js + Turbopack)
```

> **Note:** This project enforces pnpm. Running `npm install` or `yarn install` will fail.

## Making Changes

1. Fork the repository and create a branch from `main`
2. Make your changes in `packages/prompt-area/src/` for component code (this is the single source of truth for both the npm package and the shadcn registry)
3. Add or update tests in `__tests__/` directories alongside the code you changed
4. Run the checks below before submitting

## Code Quality

Before submitting a pull request, make sure all checks pass:

```bash
pnpm lint             # Lint with ESLint
pnpm typecheck        # Type-check with TypeScript
pnpm test             # Run tests with Vitest
pnpm build            # Verify production build (docs site)
pnpm package:build    # Verify the npm package builds
pnpm package:check    # Validate package exports & types
```

A pre-commit hook (via Lefthook) will automatically lint and format staged files.

## Releasing

The npm version is driven by the GitHub release tag — they stay in sync
automatically. To cut a release:

```bash
pnpm release 0.4.0          # creates the v0.4.0 GitHub release
pnpm release 0.4.0 --dry-run  # preview without creating anything
```

This creates a `v0.4.0` GitHub Release, which triggers
[`release.yml`](.github/workflows/release.yml) to publish `prompt-area@0.4.0`
to npm and commit the version back to `main`. A one-time `NPM_TOKEN` repo
secret (an npm Automation token) is required for the publish to authenticate.

## Code Style

- Code is formatted with Prettier — run `pnpm format` to auto-fix
- Follow existing patterns in the codebase
- Use TypeScript strict mode — no `any` types without justification
- Keep the zero-dependency philosophy for the core component

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Write a clear description of what changed and why
- Include before/after screenshots for visual changes
- Make sure CI passes before requesting review

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include a minimal reproduction when reporting bugs
- Check existing issues before creating a new one

## Project Structure

```
packages/prompt-area/src/  # The distributed source (npm package + shadcn registry)
├── prompt-area/             # Core component
├── action-bar/              # Toolbar component
├── status-bar/              # Status display component
├── compact-prompt-area/     # Pill-shaped collapsible variant
├── chat-prompt-layout/      # Chat UI layout component
└── helpers/                 # Server-safe re-exports

app/
├── page.tsx                 # Landing page
└── examples/                # Interactive demos
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

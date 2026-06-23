# Changelog

All notable changes to the `prompt-area` package are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

## Unreleased

### Changed

- **`commandTrigger()` now fires anywhere in the input by default, and exposes a
  `position` option.** Previously the preset hardcoded `position: 'start'` and
  did not let you override it, so `/commands` only worked at the very start of a
  line — an artificial limitation. The default is now `position: 'any'` (a `/`
  after any whitespace opens the menu), and you can opt back into the classic
  line-start behavior with `commandTrigger({ position: 'start' })`. Consumers
  using the raw `TriggerConfig` are unaffected — they already set `position`
  explicitly.
- **BREAKING: `clsx` and `tailwind-merge` are now peer dependencies** instead of
  bundled runtime dependencies. The package no longer ships its own copies of
  the two `cn` helpers; they dedupe with the copies any shadcn/Tailwind project
  already has, so prompt-area now declares **zero bundled runtime dependencies**
  (`tailwind-merge` alone was ~17 KB gzipped — larger than the rest of the
  package combined). Both are tiny and present in essentially every shadcn
  project, but if your project doesn't already depend on them, install them
  explicitly: `pnpm add clsx tailwind-merge`.

### Fixed

- **`autoGrow` now respects the `maxHeight` prop.** Previously, enabling
  `autoGrow` ignored `maxHeight` and always capped the editor at `70dvh`, so a
  composer seeded with lots of content could grow to fill most of the screen.
  The explicit `maxHeight` is now honored (falling back to `70dvh` only when no
  cap is provided).

## 0.3.2

### Fixed

- **Installs cleanly alongside Tailwind v3 (or no Tailwind).** `tailwindcss` and
  `tw-animate-css` are no longer declared as (optional) peer dependencies — they
  are build-time tools, and an optional peer still triggers an npm `ERESOLVE`
  conflict when the consumer has a non-matching version (e.g. Tailwind v3)
  installed. The prebuilt `prompt-area/styles.css` is self-contained and works
  with any stack; the optional `prompt-area/tailwind.css` preset still requires
  Tailwind v4 in your own project (documented, not version-gated). No API or
  runtime changes.

## 0.3.1

### Changed

- **Smaller package** — the framework-agnostic engine is now emitted once as a
  shared chunk instead of being bundled into both the components and the
  `prompt-area/helpers` entry. The published tarball dropped from ~36 kB to
  ~33 kB (unpacked ~134 kB → ~117 kB), and the core `PromptArea` import is
  ~14 kB gzipped. No API changes.

## 0.3.0

First npm publish since `0.1.0`. `0.1.1` was tagged but never published, so
its packaging changes (listed below) reached npm as part of this release. No
`0.2.0` was ever released — the version jumped straight from `0.1.1` to `0.3.0`.

### Changed

- Install docs now show `pnpm` / `npm` / `yarn` side by side and clarify that
  `react` and `react-dom` are peer dependencies. No functional or API changes
  versus `0.1.1`.

## 0.1.1

### Changed

- **Much smaller package** — the published tarball dropped from ~109 kB to
  ~37 kB (unpacked 513 kB → 135 kB). The build is now minified and no longer
  ships source maps.
- `tailwindcss` (>= 4) is now declared as an **optional** peer dependency, for
  consumers who use the `prompt-area/tailwind.css` preset. The prebuilt
  `prompt-area/styles.css` still works with zero Tailwind setup.

## 0.1.0

Initial release.

- `PromptArea` contentEditable rich-text input with trigger-based chips
  (`@mentions`, `/commands`, `#tags`), inline markdown, undo/redo, URL
  detection, list auto-formatting, IME support, and file & image attachments.
- Companion components: `ActionBar`, `StatusBar`, `CompactPromptArea`,
  `ChatPromptLayout`.
- `usePromptAreaState` hook, trigger presets, and segment helpers.
- Server-safe helpers re-exported from `prompt-area/helpers`.
- Prebuilt `styles.css` (zero-config) and an optional Tailwind v4 preset.
- ESM, per-entry types, and tree-shakeable subpath exports.
- Zero runtime dependencies beyond `clsx` + `tailwind-merge`.

# Changelog

All notable changes to the `prompt-area` package are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

## 0.6.2

### Added

- **`useMarkdownMode` hook.** Toggles a PromptArea between its markdown and
  plain-text variants by owning the `markdown` prop as a named mode
  (`'markdown' | 'plain'`). Switching is non-destructive: the segment value is
  kept and only the rendering changes, so inline decoration turns on and off and
  list bullets convert between `•` and `-` when `normalizeBullets` is on. Returns
  `markdown`, `mode`, `isPlainText`, `toggle` and `setMode`, and supports both
  uncontrolled use via `initialMode` and controlled use via `mode` /
  `onModeChange`. The pure `oppositeMode()` helper is exported for building
  custom toggles.

## 0.6.1

### Fixed

- **Placeholder reappears after the editor is cleared.** Typing into the editor
  and then deleting everything left a browser filler `<br>`, which was read as a
  `"\n"` text segment. That kept `value` from returning to empty, so the
  placeholder (including animated placeholders) stayed hidden permanently. The
  filler-only DOM is now detected as genuinely empty, restoring the placeholder
  once the field is cleared. A rendered trailing newline (a content `<br>` paired
  with a trailing sentinel `<br>`) still counts as real content.

## 0.6.0

### Added

- **Rich paste — markdown, HTML & Notion.** Pasting formatted content now
  converts it into the editor's own format instead of dropping it as plain
  text. The editor reads `text/markdown` when a source provides it (e.g. Slack
  nested lists) and otherwise converts `text/html` to markdown, so bold,
  italics, links, headings, code, and nested bullet/ordered lists survive a
  paste from Notion, Slack, Google Docs, and the web.
- **`reopenOnChipClick` trigger option.** For `'dropdown'` triggers, set
  `reopenOnChipClick: true` so clicking an existing chip reopens the suggestion
  dropdown anchored to that chip, with its current value preselected; picking a
  suggestion replaces the chip in place. `onChipClick` still fires, so existing
  side effects (analytics, etc.) keep working.

### Changed

- **Rebuilt list numbering, nesting & indentation.** Ordered- and unordered-list
  handling was reworked for correct numbering across nested levels and
  Notion-style Tab / Shift+Tab indentation. The `•` bullet is now drawn as a
  precise, vertically centered CSS dot.

### Fixed

- **Ordered lists renumber on native delete.** Deleting a list item with
  Backspace/Delete now renumbers the remaining items instead of leaving a gap.
- **Fence-aware bullet normalization is now balanced-only**, so `- ` inside an
  unterminated code fence is no longer rewritten to `• `.

## 0.5.0

### Added

- **Consumer control surface for embedding the editor.** New props to drive
  PromptArea from a host composer: `onKeyDown`, `onBlur` and `onRawPaste` (the
  consumer runs first; call `preventDefault()` to suppress the built-in
  handling), plus `maxLength`, `submitOnEnter`, `spellCheck` and
  `aria-describedby`.
- **Imperative handle methods** on the PromptArea ref — `setText`, `appendText`,
  `getCursorPosition`, `setCursorPosition`, `setCursorToEnd`, `getSelection` and
  `setSelection` — a textarea-shaped surface for programmatic control. Cursor
  offsets are plain-text character indices; `setText` / `appendText` are not
  capped by `maxLength`.
- **`maxLength` prop** — caps typed input at N plain-text characters (chips
  count as their `trigger + displayText` length). Paste is not capped; divert it
  via `onRawPaste`.
- **`normalizeBullets` prop** — set `false` to keep a typed `- ` as literal
  markdown instead of rewriting it to `• `.
- **`'launch'` trigger mode** — fires `onActivate` on keydown and suppresses the
  character, for opening an external surface (command palette, context picker)
  instead of the built-in dropdown.
- **Trigger popover flips above the trigger** when there isn't room below, so
  the suggestion list stays on-screen.
- **ActionBar `leftClassName` / `rightClassName`** for styling the left and
  right slot wrappers.

## 0.4.0

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

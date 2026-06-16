# Changelog

All notable changes to the `prompt-area` package are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

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

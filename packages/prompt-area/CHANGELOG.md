# Changelog

All notable changes to the `prompt-area` package are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

## 0.6.8

### Fixed

- **Enter no longer submits the prompt while an IME candidate is open.**
  Confirming a Japanese, Chinese or Korean candidate with Enter sent the
  prompt instead of committing the text, so the composition was lost and a
  half-finished message went out. Key handling is now skipped for the whole
  duration of a composition, including on legacy IMEs that report `keyCode`
  229 without setting `isComposing`.
- **An interrupted composition no longer disables the keyboard.** The
  composing flag was cleared only by `compositionend`, so a composition that
  never delivered one left the editor with no Enter, no undo/redo, no Escape
  and no chip-aware Backspace, and no way for the user to recover short of
  starting and finishing another composition. Blur now resets the flag: a
  blurred editor cannot still be composing.
- **A completed composition is a single undo step.** Committing a candidate
  could push two entries, one at `compositionend` and another opened by the
  input event carrying the commit, so undoing one composition took two Ctrl+Z
  presses. Both browser orderings of `compositionend` and the trailing input
  now fold into one entry.
- **`maxLength` is enforced when a composition completes.** An IME commit
  could carry the content past the cap. The committed value is now truncated
  the way typed input is. The `onChange` calls emitted DURING a composition
  are still uncapped, so a host forwarding them straight to a backend sees
  over-cap content until the composition ends.
- **The caret at the start of chip-leading content lands before the chip.**
  Not IME specific, and it affects every caret path in the package. When the
  editor's first child was atomic (a chip, or a `<br>` on an empty line),
  offset 0 resolved to the position AFTER it, so `setCursorAtOffset` and
  `setSelectionAtOffsets` both placed the caret one position too far. Typing
  at the start of `@alice hello` produced `@aliceX hello` rather than
  `X@alice hello`, and a caret parked at offset 0 jumped past the chip on any
  controlled value update.

### Changed

- **`onChange` no longer fires for input events that leave the content
  unchanged.** The prop is documented as "called when the content changes",
  but every input event notified, including the duplicate echo a browser emits
  after a composition. Hosts that counted keystrokes, drove a "user is typing"
  indicator, or set a dirty flag from `onChange` will see fewer calls. Calls
  emitted during a composition are unaffected and still fire on every event.
- **Key handling is fully suspended during a composition.** Trigger dropdown
  navigation (arrows, Tab), Escape, undo/redo and the markdown shortcuts still
  ran mid-composition; they now wait for the commit, as Enter, Backspace and
  Delete already did.

## 0.6.7

### Fixed

- **The caret lands at the end of a pasted document.** Pasting several pages
  from Word or Google Docs left the cursor partway up the document — on an
  11k-character contract, 1679 characters short of the end, roughly 85% in.
  The paste itself collapsed the caret correctly; the re-render that follows
  it (the pass that decorates the pasted text) preserved the caret as a
  child-node INDEX, and decoration replaces one text node with a
  text/`<span>`/text run, so the editor ends up holding more direct children
  than when the index was captured and the restore lands proportionally
  short. The drift scaled with the document, because a word-processor paste
  turns every bold heading into `**…**`. The caret is now preserved as a
  plain-text offset, which survives decoration.
- **A pasted ordered list keeps the numbering its author wrote.** Ordered-list
  renumbering restarted every run at 1 — right for typing, where Tab-indenting
  restarts a sublist, but wrong for a paste, whose numbering was authored
  somewhere else. A contract's section 7 arrived as 1, and every section
  resuming after a paragraph of prose dropped back to 1 again. A pasted run
  now continues from its own first number; contiguity is still rebuilt, so a
  stale `7. 7. 7.` lands `7. 8. 9.` Typing is unchanged.
- **Sublists emitted as a sibling of their parent item are no longer dropped.**
  Word, Outlook and Apple Notes put a nested list NEXT TO the `<li>` it belongs
  to rather than inside it. The HTML→markdown converter skipped every child
  that was not an `<li>`, so every nested item vanished from such a paste —
  silent content loss. Both shapes are handled now, and a sibling sublist does
  not advance the parent list's counter.

### Changed

- **A pasted Word list keeps the numbers Word rendered.** A list fragment
  whose markers read `3.` `4.` now pastes as `3. 4.` rather than being
  normalized to `1. 2.` (the behaviour 0.6.5 shipped). The numbers a word
  processor renders are the author's, and rewriting them is what corrupted
  real documents.

## 0.6.6

### Fixed

- **Typing stays fast when the editor holds pages of text.** Every keystroke
  used to do work proportional to the whole document: the caret offset was
  measured by deep-cloning everything before it (`Range.cloneContents`, two to
  three times per keystroke), the DOM was read and serialized to plain text up
  to four separate times, all decorations (bold/italic, URLs, bullets,
  indents, headings) were stripped and rebuilt across every line, autoGrow
  forced two full layout reflows, and a fresh empty suggestions array forced a
  React re-render even when nothing changed. On a multi-page document a single
  keystroke blocked the frame for 40–80 ms. Offsets are now computed by
  walking the live tree without cloning, one scan produces the segments and
  plain text for the whole keystroke, the decoration cycle runs only on the
  caret's `<br>`-delimited line (decorations are line-local; anything
  ambiguous — foreign elements, literal newlines in text nodes, no collapsed
  caret — still takes the full pass), height syncs coalesce into one
  pre-paint `requestAnimationFrame`, and idle keystrokes no longer re-render.
  Measured at 600 seeded lines with markdown and autoGrow: median keystroke
  handler time dropped from 39.8 ms to 7.5 ms and input-to-frame latency from
  45 ms to 8 ms, with p95 under one 60 Hz frame.
- **Newlines insert without rebuilding the document.** Shift+Enter (and Enter
  with `submitOnEnter` off) re-rendered and re-decorated the entire editor to
  insert one `\n`, a ~37 ms stutter at 600 lines. When the caret is collapsed
  in a clean flat DOM and ordered-list renumbering is provably a no-op, the
  newline is now inserted surgically — split the caret's text node, insert one
  `<br>`, re-decorate just that line — halving the cost; every other case
  keeps the full re-render.
- **URLs keep their commas.** The URL matcher excluded commas outright, so a
  link like
  `https://en.wikipedia.org/wiki/Dominic_Johnson,_Baron_Johnson_of_Lainston`
  was cut short at the first comma. Commas now count as part of a URL, and a
  trailing one is trimmed along with the other trailing punctuation, in both
  the editor decoration pass and inline markdown parsing.

## 0.6.5

### Fixed

- **Pasting from Microsoft Word inserts the text instead of silently dropping
  it.** Word (macOS especially) puts a bitmap rendering of the copied selection
  on the clipboard next to its HTML; the image branch of the paste handler
  consumed it and returned before any text flavor was read, so with no
  `onImagePaste` consumer wired nothing happened at all. Office clipboards
  (detected via their `mso-`/`Mso`/ProgId/office-xmlns fingerprints) now let
  the text path win; the bitmap is only delivered to `onImagePaste` when the
  clipboard yields no text — e.g. an image or drawing object copied inside
  Word. Non-Office pastes are unchanged: a copied image still takes precedence
  over incidental `<img>` HTML.
- **Word lists convert to real markdown lists.** Word's clipboard HTML has no
  `<ul>`/`<ol>` — each item is an `mso-list` paragraph carrying its marker
  glyph (`·`, `o`, `1.`, `a.`, …) in a hidden `mso-list:Ignore` span behind
  conditional comments. Runs of those paragraphs now become nested markdown
  lists (2-space indent per level, per-level numbering seeded from Word's own
  digits, bullets normalizing to `•`) instead of literal `·` lines separated by
  blank lines, and Word's `<o:p>` placeholders and `<xml>` data islands no
  longer leak junk text into the paste.

## 0.6.4

### Added

- **`markdownHeadings` renders ATX headings at their real size.** With
  `markdown` on, `## Risks` showed its hashes and sat at body size, so an
  editor holding a document looked like a textarea with syntax in it. The new
  opt-in `markdownHeadings` prop renders `# ` through `###### ` as headings
  with the hashes collapsed, the same way `**bold**` already works. It is
  display-only: the `#` characters stay in the DOM inside a zero-size
  `.prompt-area-md-marker`, so `textContent`, the segment model and every caret
  offset are unchanged, and the markdown stays the source of truth. A heading
  is only recognised at a real line start, so `see #4` stays prose, and inline
  decoration still applies inside the heading text. Scale is retunable via
  `--prompt-area-heading-1` through `--prompt-area-heading-6`. Off by default,
  because a comment box is prose and silently turning a typed `## ` into a
  display heading there would surprise rather than help.

## 0.6.3

### Fixed

- **Caret stays visible when content overflows the editor.** Once content grew
  past `maxHeight` (e.g. after pasting long text), Shift+Enter newlines — and
  the caret itself right after the paste — landed below the visible box,
  forcing a manual scroll. Browsers only auto-scroll the caret into view for
  native editing, never for selections placed via the Selection API, and the
  editor's model→DOM re-render additionally reset `scrollTop` to 0. Every
  programmatic caret placement in a focused editor (paste, newlines, list
  edits, chip insertion, undo/redo, imperative moves) now commits through a
  single primitive that ends by scrolling the editor's own scroll box so the
  caret is visible. Only the editor's `scrollTop` is adjusted — ancestor
  scroll containers and the page never move — and blurred editors are left
  alone, so imperative `setText`/`appendText` from a toolbar button can't pan
  a collapsed auto-grow preview. The correction is transform-aware, so it
  scrolls correctly inside scaled ancestors (zoomed canvases, animated
  dialogs).
- **Scroll position survives re-renders.** The model→DOM re-render clears the
  editor, which collapsed `scrollHeight` and clamped `scrollTop` to 0 — so any
  re-render of an overflowing editor (external value updates, undo/redo,
  markdown toggling, formatting) silently jumped the view to the top, and
  mid-document edits re-anchored the caret line to the box edge. The viewport
  is now preserved across the rebuild and the caret correction only nudges
  when the caret genuinely left the visible box. Restored range selections
  (Cmd+B/Cmd+I) keep the viewport instead of jumping to the selection's end.
- **Trigger popover anchors correctly after chips and line breaks.** A trigger
  character typed at an element boundary (right after a chip or `<br>`)
  reports no geometry, so the suggestion popover kept a stale anchor from a
  previous position. The caret measurement now falls back to a temporary
  zero-width-space probe — inserted and removed synchronously without
  disturbing the DOM or selection — and the popover anchors at the real
  trigger position.

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

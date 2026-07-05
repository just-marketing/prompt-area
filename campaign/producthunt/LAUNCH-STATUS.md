# Prompt Area — PH Launch Status & Paste-Ready Pack

> Audited against the live submission draft at
> https://www.producthunt.com/posts/new/submission on **2026-07-05** (Sat).
> Planned launch: **Thursday 2026-07-09, 12:01 AM PST** (4 days out).
> Companion files: [`LAUNCH-PLAN.md`](./LAUNCH-PLAN.md) · [`COPY.md`](./COPY.md) · [`CHECKLIST.md`](./CHECKLIST.md)

## Where we stand

PH's own in-form checklist: **Required 100% complete** 🎉 — name, tagline,
description, thumbnail, gallery (9 slides), launch tags.
**Strongly Recommended** still open: first comment, video, additional makers.
The post is **not yet scheduled** (still "In progress").

| Form section         | State                                                          | Action                                                                    |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Name                 | ✅ `Prompt Area`                                               | none                                                                      |
| Tagline              | ⚠️ "A production-grade rich text input for AI chat interfaces" | consider §Tagline below                                                   |
| Description          | ⚠️ 193/500 chars                                               | paste §Description below                                                  |
| Links                | ✅ site + GitHub                                               | add npm link                                                              |
| Open-source checkbox | ✅ ticked                                                      | none                                                                      |
| Launch tags          | ⚠️ 2/3 (Artificial Intelligence, User Experience)              | add 1, see §Tags                                                          |
| Thumbnail            | ✅ logo mark (11 KB, limit 2 MB)                               | none                                                                      |
| Gallery              | ✅ 9 slides uploaded                                           | verify GIF slide present + position #2                                    |
| Video / Loom         | ❌ empty                                                       | upload `assets/prompt-area-typing-demo.mp4` to YouTube or Loom, paste URL |
| Interactive demo     | ❌ empty                                                       | paste `https://prompt-area.com/docs/try-it-live`                          |
| Makers               | ⚠️ only @ilko_kacharov                                         | add contributors (need PH accounts)                                       |
| Shoutouts            | ⚠️ 1/3 (shadcn/ui)                                             | add 2 more, see §Shoutouts                                                |
| Pricing              | ✅ Free                                                        | none                                                                      |
| Promo code           | — empty                                                        | N/A (free product)                                                        |
| Schedule             | ❌ not scheduled                                               | schedule for Thu 2026-07-09 12:01 AM PST                                  |

## Paste-ready values

### Tagline (pick one, then align hero slide + docs)

Current form: `A production-grade rich text input for AI chat interfaces` (57)
COPY.md pick: `The open-source textarea built for AI chat UIs` (46 — carries the open-source signal)
Hero slide says: `The go-to textarea for AI agents & chatbots`

### Description (481/500)

```
Every AI chat box needs @mentions, /commands, #tags, markdown and file uploads. The usual way? Stitch five libraries. Prompt Area is all of it in one dependency-light React component (~37 kB, no ProseMirror, Slate or Lexical). Install from npm (ships its own CSS, no Tailwind required) or copy the source in via the shadcn registry and own every line. Production-grade: undo/redo, IME, ARIA a11y, dark mode. MIT licensed, free forever. Try it live in your browser, no setup needed.
```

### Tags (3 max)

Priority per COPY.md: `Developer Tools` · `Open Source` · `Artificial Intelligence`.
Currently selected: Artificial Intelligence + User Experience — swap/add so
Developer Tools is included (that's where React/AI builders browse).

### Links

- npm: `https://www.npmjs.com/package/prompt-area`
- Interactive demo field: `https://prompt-area.com/docs/try-it-live`
- Video field: YouTube/Loom URL of `prompt-area-typing-demo.mp4` (upload pending)

### First comment

Paste-ready in [`COPY.md §2`](./COPY.md). PH: 70% of Product-of-the-Day winners
had a maker first comment; it can be saved with the draft before launch.

### Shoutouts (3 total, 1 used)

1. ✅ shadcn/ui
2. Suggestion: Claude Code (built with it, on-brand for the audience)
3. Suggestion: Next.js or Remotion (docs site / launch video)

## Assets verified (2026-07-05)

All in [`assets/`](./assets), within PH limits (thumbnail < 2 MB, gallery < 3 MB):

| Asset                                    | Size              | OK                                   |
| ---------------------------------------- | ----------------- | ------------------------------------ |
| `thumbnail-240.png`                      | 11 KB             | ✅                                   |
| `gallery-01…08` PNGs                     | 0.75–0.99 MB each | ✅                                   |
| `gallery-02-demo.gif` (motion slide)     | 198 KB            | ✅                                   |
| `prompt-area-typing-demo.mp4` (PH video) | 43 KB, ~6.5 s     | ✅ needs YouTube/Loom upload         |
| `prompt-area-demo-compact.gif` (social)  | 2.1 MB            | ✅                                   |
| `prompt-area-demo.gif` (social, large)   | 5.1 MB            | social only — too big for PH gallery |

## Code readiness

- ✅ `app/docs/try-it-live/page.tsx` now pins `prompt-area@0.5.0` (was 0.3.2; npm latest is 0.5.0; jsdelivr CSS for 0.5.0 verified live) — **needs deploy before launch**
- ✅ `examples/basic/package.json` bumped to `^0.5.0` + now lists `clsx` and `tailwind-merge`
- Pre-existing unrelated: stale `.next` type validators reference deleted slide-capture pages; clean with a fresh build

### ⚠️ Found & fixed: 0.5.0 breaks the live demo (peer deps)

In **0.5.0, `clsx` and `tailwind-merge` moved from `dependencies` to
`peerDependencies`** (the package now has zero runtime deps). Sandpack does not
auto-install peers, so bumping the try-it-live demo to 0.5.0 rendered a **blank
preview**. Fixed and verified locally (2026-07-05): the Sandpack setup and
`examples/basic` now list `clsx@2.1.1` + `tailwind-merge@3.6.0` explicitly, and
the demo renders correctly with 0.5.0.

**Open launch decision:** npm ≥7, pnpm ≥8 and bun auto-install peers, but
**yarn does not** — `yarn add prompt-area` on 0.5.0 yields a broken install
unless users also add clsx + tailwind-merge. The installation docs
(`app/docs/installation/page.tsx`) and README still say `yarn add prompt-area`
works as-is. Before launch either:

1. document the two peers in README + installation docs (and mention them in
   the PH FAQ answer about being dependency-light), or
2. ship a `0.5.1` that returns clsx/tailwind-merge to regular `dependencies`
   (safest for the "it just works" story; the packed size impact is tiny).

## PH guide deltas (form/guide read 2026-07-05)

- Description limit is **500 chars** (docs previously said 260)
- Thumbnail limit is **2 MB** (was documented as 3 MB); 240×240 recommended
- Video field accepts **YouTube or Loom** (was YouTube-only)
- Gallery: recommend 1270×760, minimum 2 images; per-image caption fields not
  visible in the new form — check in-form before relying on COPY.md §3 captions
- Scheduling allowed up to **1 month ahead**; scheduling creates the upcoming
  page that collects followers (do this ASAP)
- "Topics" are now "Launch tags" (still 3)
- New PH data point: weekend launches get ~15% more "Visit" clicks — doesn't
  change the Thursday call, but relevant if the date slips

## Remaining human actions (in order)

1. Decide final tagline (align form, hero slide, docs)
2. Paste expanded description; fix tags; add npm + interactive-demo links
3. Paste first comment from COPY.md §2
4. Upload typing demo to YouTube/Loom; paste URL
5. Add co-makers (PH accounts required) + 2 shoutouts
6. Verify GIF slide position in gallery
7. **Schedule the launch** (Thu 2026-07-09 12:01 AM PST) → share the upcoming
   page for follows
8. Decide the peer-deps question above (docs note vs 0.5.1) — affects the
   "dependency-light" pitch and yarn users
9. Deploy the site so try-it-live runs 0.5.0 (verified locally); smoke-test
   both install paths in clean apps (npm + Vite, shadcn + Next, and one
   `yarn add` check)

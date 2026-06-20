# Prompt Area — Product Hunt Launch Kit

Everything needed to launch **Prompt Area** on Product Hunt. Open these in order:

| File                                 | What it is                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [`LAUNCH-PLAN.md`](./LAUNCH-PLAN.md) | Full strategy: positioning, timing, hunter, pre-launch → launch-day playbook → post-launch, risks                            |
| [`COPY.md`](./COPY.md)               | Paste-ready copy: PH fields, tagline & description options, first comment, gallery captions, X/LinkedIn/Reddit/HN posts, FAQ |
| [`CHECKLIST.md`](./CHECKLIST.md)     | One-page tick-box checklist from "decide the date" to "post-launch"                                                          |
| [`assets/`](./assets)                | All launch images (thumbnail + 8 gallery slides), ready to upload                                                            |

## The 60-second version

- **What:** Open-source React textarea for AI chat UIs — @mentions, /commands, #tags, inline markdown, file attachments. Install via **npm** (`npm install prompt-area`, ships its own CSS, no Tailwind needed) **or shadcn** (own the source). Dependency-light, ~37 kB, MIT. Currently **v0.3.2**.
- **Tagline:** _The open-source textarea built for AI chat UIs._
- **When:** A Tue/Wed/Thu, post at **12:01 AM PST**. Suggested: **Thu 2026-07-09** (backup **Tue 2026-07-14**; avoid US July 4 week).
- **Hunter:** Self-hunt. Add all contributors as makers.
- **Try-it-live:** real Vite + React app in the browser → `prompt-area.com/docs/try-it-live` (use it as the PH interactive-demo link).
- **Win condition:** Reply to every comment, all day. Lead with the pain (5 libraries) and the relief (1 component).

## Assets

| File                                      | Size              | Use                                                                     |
| ----------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `assets/thumbnail-240.png`                | 240×240           | PH thumbnail                                                            |
| `assets/thumbnail-600.png`                | 600×600           | Hi-res thumbnail / social                                               |
| `assets/gallery-01-hero.png`              | 1280×720          | Gallery #1 (hero, value prop)                                           |
| `assets/gallery-02-demo.gif`              | 1200×675, looping | **Gallery #2 — animated** (chips + markdown resolving live as you type) |
| `assets/gallery-03-markdown.png`          | 1280×720          | Gallery #3 (inline markdown)                                            |
| `assets/gallery-04-attachments.png`       | 1280×720          | Gallery #4 (files & images)                                             |
| `assets/gallery-05-drop-in-replicas.png`  | 1280×720          | Gallery #5 (recreate known inputs)                                      |
| `assets/gallery-06-install-zero-deps.png` | 1280×720          | Gallery #6 (install / 0 deps)                                           |
| `assets/gallery-07-one-component.png`     | 1280×720          | Gallery #7 (one component vs five)                                      |
| `assets/gallery-08-dark-mode-a11y.png`    | 1280×720          | Gallery #8 (dark mode & a11y)                                           |
| `assets/prompt-area-typing-demo.mp4`      | 1280×720, ~6.5s   | **Primary demo** → YouTube for PH **video** field (focused typing demo) |
| `assets/prompt-area-demo.mp4`             | 1280×720, ~17s    | Slideshow teaser (all slides) for social                                |
| `assets/prompt-area-demo.gif`             | 960px, looping    | README / X / LinkedIn (~4.6 MB)                                         |
| `assets/prompt-area-demo-compact.gif`     | 720px, looping    | Slideshow GIF / Slack (~2 MB, <3 MB)                                    |

> Gallery images are real product UI (the actual `<PromptArea>` component) rendered
> at 16:9 on-brand canvases, exported at 2× (2560×1440) for crispness. Captions for
> each are in [`COPY.md §3`](./COPY.md).

## Regenerating the images

The slides are generated from a temporary Next.js route that renders the real
`prompt-area` components on branded 1280×720 canvases (`app/launch-slides`) plus a
dev-only writer route (`app/api/save-slide`). Both are removed from the app after
export to keep the product clean. The reference source is saved here as
[`slide-generator.tsx.txt`](./slide-generator.tsx.txt) — drop it back into
`app/launch-slides/page.tsx`, add the writer route, run `pnpm dev`, open
`/launch-slides`, and in the browser console run the **manual rasterizer** snippet
over each `[data-slide]` element. The full, current steps (incl. the npm-package
imports and the gotchas below) live in the comment header of that file.

> **Capture gotchas (learned 2026-06-20):**
>
> - Use the **manual rasterizer** (`toSvg` → `Image` → `<canvas>` → `toDataURL`).
>   `html-to-image`'s `toPng()` **hangs** in some embedded/automation browsers.
> - Capture from a **foreground / focused tab**. In a backgrounded tab React throttles its
>   scheduler, so the layout's `<Suspense>` boundary never hydrates and the contentEditable
>   engine never paints chips (composer editors render empty). Foreground the tab (a
>   screenshot does it) + one real click, wait ~2s, and confirm `.prompt-area-chip` count > 0
>   before capturing. Static slides (e.g. slide 6 — install) capture fine even backgrounded.
> - The slideshow MP4 is built from the 8 gallery PNGs (position 2 is a still
>   extracted from `gallery-02-demo.gif`) with the skill's `build-video.js`, then the
>   two GIFs are derived with the `ffmpeg` commands below.

```bash
# slideshow MP4 (run from campaign/producthunt/assets, ffmpeg required)
ffmpeg -y -i gallery-02-demo.gif -frames:v 1 -vf "scale=2560:1440:force_original_aspect_ratio=decrease,pad=2560:1440:(ow-iw)/2:(oh-ih)/2:white" gallery-02-triggers.png
node build-video.js prompt-area-demo            # from ~/.claude/skills/producthunt-launch/assets/build-video.js
# social GIF (~5MB, fine for README/X/LinkedIn)
ffmpeg -y -i prompt-area-demo.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 prompt-area-demo.gif
# PH-gallery GIF (MUST be < 3MB)
ffmpeg -y -i prompt-area-demo.mp4 -vf "fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" -loop 0 prompt-area-demo-compact.gif
rm gallery-02-triggers.png                       # intermediate, not shipped
```

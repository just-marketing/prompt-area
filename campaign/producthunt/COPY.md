# Prompt Area — Launch Copy (paste-ready)

All copy for the Product Hunt post + every promotion channel. Pick the **bold "USE THIS"** option for each field; alternatives are provided for A/B choice.

---

## 1. Product Hunt post fields

### Name

```
Prompt Area
```

> Name only — no tagline, no emoji (PH rule).

### Tagline (lead with value; target 40–55 chars so PH doesn't truncate)

**USE THIS** — _"X for Y"_ formula, instant clarity (46 chars):

```
The open-source textarea built for AI chat UIs
```

Alternatives by formula (pick what fits the audience you most want to win):

- _"But better"_ → `A textarea — but with mentions, commands & markdown` (51)
- _Action + outcome_ → `Drop a rich chat input into any React app in 1 command` (54)
- _Problem killer_ → `Stop stitching 5 libraries for one AI chat input` (48)
- _Capability list_ → `@mentions, /commands & markdown in one React textarea` (53)
- _Speed/ease_ → `One React textarea for AI chat — npm or shadcn` (46)

> Avoid jargon; a non-React reader should still grasp it. Lead with the benefit, not the feature.

### Description (≤ 260 chars)

**USE THIS** — _PAS (Problem → Agitate → Solution)_, the highest-converting framework (251 chars):

```
Every AI chat box needs @mentions, /commands, #tags, markdown and file uploads. The usual way? Stitch five libraries. Prompt Area is all of it in one React component — install from npm or copy it in via shadcn. Zero heavy deps, no Tailwind required.
```

Alternative A — _FAB (Feature → Advantage → Benefit)_, scannable (244 chars):

```
The open-source React textarea for AI chat & prompt inputs. @mentions, /commands, #tags, inline markdown, file attachments — one component. Install from npm (with its own CSS, no Tailwind needed) or copy the source in via the shadcn registry.
```

Alternative B — _capability-dense_ (225 chars):

```
A production-grade React textarea for AI chat UIs: @mentions, /commands, #tags, markdown, files, undo/redo, dark mode & a11y. Install from npm or copy in via shadcn — ships its own CSS, zero heavy deps, fully yours to edit.
```

### Topics (pick 3, most relevant first)

```
Developer Tools · Open Source · Artificial Intelligence
```

Backup options if available: `GitHub`, `Design Tools`, `User Experience`, `React`.

### Links

- **Main link:** `https://prompt-area.com`
- **GitHub:** `https://github.com/just-marketing/prompt-area`
- **Docs / install:** `https://prompt-area.com/docs/installation` (npm + shadcn)
- **Interactive demo:** `https://prompt-area.com/docs/try-it-live` — a real Vite + React app running live in the browser (edit the code, watch chips resolve). This is a genuine interactive demo for the PH demo field; no Arcade/Storylane needed.
- **npm:** `https://www.npmjs.com/package/prompt-area`
- **X/Twitter (product or maker):** add if available

### Pricing tag

```
Free  (Open Source · MIT)
```

---

## 2. Maker's first comment (post immediately at 12:01 AM PST)

**USE THIS:**

```
Hey Product Hunt 👋

I'm part of the team at Juma (formerly Team-GPT). While building AI chat
interfaces, we kept hitting the same wall: every prompt box needs @mentions,
/commands, #tags, inline markdown and file attachments — but the only way to
get them was to bolt together a mention library + a command palette + a tag
input + a markdown editor + an upload widget. Five dependencies and five APIs
for *one* input box.

Most "rich text editors" are document editors (ProseMirror, Lexical, Slate)
crammed into a chat box. We wanted the opposite: something purpose-built for
prompt-style inputs.

So we built Prompt Area and open-sourced it:

• One contentEditable component — @mentions, /commands, #tags, inline markdown,
  files & images, undo/redo, IME (CJK), copy/paste chip preservation, dark mode,
  and ARIA accessibility.
• Two ways to install, same source — no lock-in either way:
    – npm:    npm install prompt-area   (ships its own CSS, no Tailwind needed)
    – shadcn: npx shadcn@latest add https://prompt-area.com/r/prompt-area.json
              (copies the source into your repo so you own every line)
• Dependency-light: no ProseMirror / Slate / Lexical, ~37 kB packed.
• Companion components included: Action Bar, Status Bar, Compact, and Chat Layout
  — enough to recreate the inputs in Claude Code, Codex, ChatGPT or Slack.

You don't have to take my word for it — there's a full Vite + React app running
live in your browser (no setup): https://prompt-area.com/docs/try-it-live —
edit the code and watch the chips and markdown resolve.

It's MIT licensed and free. We'd genuinely love your feedback — what's missing,
what would make it a drop-in for your stack, and which trigger behaviors you'd
want next. I'll be here all day answering everything 🙏

Repo → https://github.com/just-marketing/prompt-area
Docs & live demo → https://prompt-area.com
```

### Pinned reply seeds (use if conversation is quiet)

- "Happy to show how to recreate a specific app's input — drop the app and I'll share the config."
- "For the curious: the trickiest part was IME composition (CJK) + undo/redo on contentEditable without a framework. Ask me anything about the engine."
- "Want to kick the tires without installing anything? The live editor runs a real Vite app in your browser: https://prompt-area.com/docs/try-it-live"

---

## 3. Gallery image captions (set under each slide in the PH gallery)

1. **gallery-01-hero** — `One textarea for AI chat: mentions, commands, markdown & files`
2. **gallery-02-demo** (animated GIF) — `Watch it resolve: @mentions, /commands, #tags & **markdown** live as you type`
3. **gallery-03-markdown** — `Inline markdown renders live as you type — no preview pane, no editor framework`
4. **gallery-04-attachments** — `Files & images built into the composer — no extra upload widget`
5. **gallery-05-drop-in-replicas** — `Recreate the inputs from Claude Code, Codex, ChatGPT & Slack`
6. **gallery-06-install-zero-deps** — `Two ways, one source: npm install (own CSS, no Tailwind) or shadcn to own the code`
7. **gallery-07-one-component** — `One component instead of five libraries — a single typed API`
8. **gallery-08-dark-mode-a11y** — `Dark mode, keyboard control, ARIA & IME — production-grade by default`

---

## 4. X / Twitter launch thread

**Tweet 1 (hook + link):**

```
We just launched Prompt Area on Product Hunt 🚀

The open-source React textarea built for AI chat UIs.

@mentions · /commands · #tags · inline markdown · file attachments
→ one dependency-light component. Install from npm or copy it in via shadcn.

Would love your support & feedback 👇
[PH link]
```

**Tweet 2 (the pain):**

```
Every AI chat box needs the same things: mentions, slash commands, tags,
markdown, file uploads.

The usual way? Stitch together react-mentions + cmdk + a tag input + Tiptap/
Lexical + an upload widget. 5 deps, 5 APIs, for ONE input.
```

**Tweet 3 (the relief):**

```
Prompt Area is all of it in a single contentEditable component. Install it two ways:

→ npm install prompt-area   (ships its own CSS — no Tailwind setup)
→ npx shadcn@latest add …    (copy the source into YOUR repo)

Dependency-light, ~37 kB, MIT.
```

**Tweet 4 (proof / demo GIF):**

```
It's production-grade, not a toy:
• undo/redo
• IME (CJK) composition
• copy/paste chip preservation
• ARIA a11y + full keyboard control
• dark mode via your shadcn tokens
• companions: Action Bar, Status Bar, Chat Layout

Try it live in your browser → https://prompt-area.com/docs/try-it-live
[attach demo.gif]
```

**Tweet 5 (CTA):**

```
Built by the team at @juma (formerly Team-GPT) and open-sourced for the community.

⭐ Repo: https://github.com/just-marketing/prompt-area
📚 Docs + live demo: https://prompt-area.com
🚀 Product Hunt: [PH link]

Tell us what would make it a drop-in for your stack.
```

---

## 5. LinkedIn post

```
We open-sourced Prompt Area — and we're live on Product Hunt today 🚀

Building AI chat and agent UIs, we kept rebuilding the same input box: @mentions,
/commands, #tags, inline markdown, file attachments. The only way to get them was
to stitch together five libraries.

Prompt Area is all of that in ONE React component:
→ Install two ways from the same source: `npm install prompt-area` (ships its own CSS, no Tailwind needed) or copy it in via the shadcn registry
→ Dependency-light (~37 kB) — no ProseMirror/Slate/Lexical
→ Production-grade: undo/redo, IME, accessibility, dark mode
→ Companion components to recreate the inputs in Claude Code, Codex, ChatGPT & Slack
→ Run it live in your browser before installing: https://prompt-area.com/docs/try-it-live
→ MIT licensed, free

If you build with React/Next.js and AI, I'd love your feedback.

Product Hunt: [PH link]
GitHub: https://github.com/just-marketing/prompt-area
Demo: https://prompt-area.com

#opensource #react #nextjs #ai #shadcn #developertools
```

---

## 6. Reddit (tailor per subreddit; read self-promo rules first)

**Title (r/reactjs, r/nextjs):**

```
I open-sourced Prompt Area — a React textarea with @mentions, /commands, #tags & markdown for AI chat UIs (npm or shadcn, no Tailwind required)
```

**Body:**

```
Building AI chat interfaces I kept stitching together react-mentions + a command
palette + a tag input + a markdown editor + an upload widget just to get one good
input box. So I built Prompt Area: a single contentEditable component with
@mentions, /commands, #tags, inline markdown, and file attachments.

Install it whichever way you prefer — both from the same source:
- npm install prompt-area  (ships its own styles.css, so no Tailwind setup needed)
- npx shadcn add …          (copies the source into your repo so you own/edit it)

Dependency-light (~37 kB, no ProseMirror/Slate/Lexical). Production stuff is
handled too: undo/redo, IME (CJK), copy/paste chip preservation, ARIA a11y, dark
mode. MIT licensed.

Run it live in your browser (real Vite app, no setup): https://prompt-area.com/docs/try-it-live
Docs: https://prompt-area.com
Code: https://github.com/just-marketing/prompt-area

We're also on Product Hunt today if you want to weigh in: [PH link]

Honest feedback welcome — especially what would make it a drop-in for your stack.
```

> For **r/SideProject** lead with the build story; for **Hacker News** use a `Show HN:` title, link to **GitHub** (not PH), and never mention upvotes.

---

## 7. Hacker News — Show HN

**Title:**

```
Show HN: Prompt Area – Open-source React textarea for AI chat (mentions, commands, markdown)
```

**First comment:**

```
Author here. While building AI chat UIs we kept rebuilding the same input box, so
we made Prompt Area: a single contentEditable React component with @mentions,
/commands, #tags, inline markdown and file attachments — no ProseMirror/Lexical/
Slate underneath.

You can install it as a normal npm package (it ships its own CSS, so no Tailwind
setup) or copy the source in via the shadcn registry if you'd rather own/edit it.
Either way it's dependency-light (~37 kB, no ProseMirror/Slate/Lexical). We handled
the annoying parts: IME composition for CJK, undo/redo on contentEditable, and
copy/paste that preserves chip data.

MIT licensed. There's a live, editable Vite app in the browser if you want to poke
at it: https://prompt-area.com/docs/try-it-live
Code: https://github.com/just-marketing/prompt-area
Happy to go deep on the contentEditable engine in the comments.
```

---

## 8. Notify message (DM / email to your network — pre-launch & launch day)

**Pre-launch (T‑3, "be notified"):**

```
Hey — we're launching Prompt Area (our open-source React textarea for AI chat UIs)
on Product Hunt on [DATE]. If it's relevant to you, you can follow the page here so
you get pinged when we go live: [upcoming PH link]. No pressure — just figured
you'd want to see it.
```

**Launch day ("it's live"):**

```
We're live on Product Hunt! 🚀 Prompt Area — the open-source textarea for AI chat
UIs. If you build with React/AI, would love your honest feedback in the comments:
[PH link]
```

> Never write "please upvote." Ask for a look, a try, and feedback.

---

## 9. Community/Discord/Slack one-liner

```
Just launched Prompt Area on PH — open-source React textarea for AI chat UIs
(@mentions, /commands, #tags, markdown, files; npm or shadcn, no Tailwind needed).
Feedback very welcome 🙏 [PH link] · live demo: prompt-area.com/docs/try-it-live
```

---

## 10. FAQ — pre-written answers for likely launch-day questions

**"How is this different from Tiptap / Lexical?"**

> Those are general-purpose editor _frameworks_ (ProseMirror/plugin-based, 2–5 deps) for full document editing. Prompt Area is purpose-built for chat/prompt inputs with zero deps. Use Tiptap/Lexical for docs; use Prompt Area for a chat box you can ship today.

**"npm package or shadcn registry — which should I use?"**

> Both install the same component from the same source; pick by how you like to consume code. `npm install prompt-area` if you want a versioned package that updates with your lockfile (it ships its own `styles.css`, so no Tailwind setup). Use `npx shadcn add …` if you'd rather copy the source into your repo and own/edit every line. You can start with npm and eject to shadcn later.

**"Does it work outside Next.js / without shadcn / without Tailwind?"**

> Yes. The npm package ships a self-contained `prompt-area/styles.css`, so it drops into any React app — Vite, CRA, Remix, Next — with no Tailwind required. There's also an optional `prompt-area/tailwind.css` preset if you do want token-level theming. (Try-it-Live is literally a plain Vite + React app.)

**"Is it really dependency-light?"**

> Yes — no ProseMirror/Slate/Lexical and ~37 kB packed. The shadcn path adds zero runtime deps to your bundle (it's just source); the npm path is a single small package.

**"Can I style the chips / add my own triggers?"**

> Yes — every trigger is configurable (char, position, dropdown vs callback, chip style/class). You can define any trigger character, not just @ / #.

**"Accessibility / international input?"**

> Full ARIA roles + keyboard nav, and proper IME composition handling for CJK input. It's built for production.

**"License / cost?"**

> MIT, free, forever. Built by Juma and open-sourced for the community.

---

## 11. Safe-messaging conversion table (PH-compliance — apply to ALL copy above)

PH penalizes/unfeatures products that solicit or incentivize votes. Never write "upvote." Use this table to sanity-check every message:

| ❌ Don't say               | ✅ Say instead                           |
| -------------------------- | ---------------------------------------- |
| "Please upvote"            | "Check it out"                           |
| "Vote for us" / "Vote now" | "We'd love your support" / "Take a look" |
| "Upvote if you like it"    | "Let us know what you think"             |
| "Every vote counts"        | "Your feedback means a lot"              |
| "Help us reach #1"         | "Excited to share this with you"         |
| "We need your upvotes"     | "We need your feedback"                  |
| "Upvote for 20% off"       | "The PH community gets 20% off"          |
| "First 100 upvoters win"   | "First 100 signups from PH win"          |

All copy in this file already follows these rules. If you edit anything, re-check against this table.

---

## 12. Launch-day comment responses (the 9-minute rule)

Aim to reply to **every** comment within ~9 minutes during peak hours — engagement depth is a real ranking signal, and observers see an active maker. Be genuine, add value, stay positive, ask a question back, keep it concise.

**Simple praise** ("Love this!")

```
Thanks so much, [Name]! 🙏 What are you building where a richer input would help?
Happy to share the trigger config for your use case.
```

**Detailed praise** (calls out a specific feature)

```
[Name], this made my day — [that feature] was exactly the pain we built it for.
Fun detail: [one insight about the decision]. Anything you'd want it to do next?
```

**Feature question** ("Does it work with X?")

```
Great question! [Direct yes/no + how]. Here's a 3-line example: [link/snippet].
If X needs something special, tell me your setup and I'll show the config.
```

**Comparison** ("How is this vs Tiptap/Lexical?")

> Use the FAQ §10 answer — factual, never bash competitors by name.

**Skeptical / critical** ("It's just a textarea")

```
Totally fair to ask! The hard part isn't the box — it's mentions + commands + tags +
markdown + IME + undo/redo working together with zero deps. That's the 90% we handled.
What would make it genuinely useful for your stack?
```

**Negative / bug report**

```
Thank you for flagging this — genuinely. [Acknowledge specifically]. Tracking it here:
[issue link]. I'll follow up when it's fixed. Really appreciate you taking the time.
```

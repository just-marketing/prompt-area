# Prompt Area — Product Hunt Launch Checklist

Tick these off in order. Details live in [`LAUNCH-PLAN.md`](./LAUNCH-PLAN.md) and [`COPY.md`](./COPY.md).

## Decide (now)

- [ ] Pick launch date — a **Tue/Wed/Thu** (suggested: **Thu 2026-07-09**; backup **Tue 2026-07-14**; avoid Jun 30–Jul 3 around US July 4)
- [ ] Confirm maker accounts (all contributors, complete profiles + avatars)
- [ ] Decide self-hunt (recommended) vs external hunter
- [ ] Check PH "upcoming" + tech/holiday calendar for that day

## Product readiness (T‑14 → T‑7)

- [ ] `prompt-area.com` loads fast and looks great on mobile
- [ ] **npm path:** `npm install prompt-area` + `import 'prompt-area/styles.css'` works in a **fresh Vite** app (no Tailwind)
- [ ] **shadcn path:** `npx shadcn@latest add https://prompt-area.com/r/prompt-area.json` works in a **fresh Next** project
- [ ] **Live demo:** `prompt-area.com/docs/try-it-live` loads & runs (pinned version matches latest npm — currently `0.5.0`)
- [ ] GitHub repo public, README polished, MIT license visible
- [ ] A couple of "good first issue" labels for inbound contributors
- [ ] `llms.txt` / `llms-full.txt` current (great for the AI-agent install path)

## Assets (T‑10 → T‑5) — all in [`assets/`](./assets)

- [x] Thumbnail uploaded (logo mark; PH limit is **2MB**, ours is 11KB) ✅ 2026-07-05
- [x] Gallery images uploaded (9 slides: new hero + the 8 story slides) ✅ 2026-07-05
- [x] First gallery image = hero with value prop overlay ✅
- [ ] Verify the **animated GIF** slide is in the gallery and sits at position #2 (motion early)
- [ ] Captions under gallery images — the new PH form may not expose caption fields; check in-form (`COPY.md §3` has the copy if it does)

## PH post draft (T‑5 → T‑1) — draft exists, audited 2026-07-05

- [x] Name: `Prompt Area` ✅
- [x] Tagline set — ⚠️ says "A production-grade rich text input for AI chat interfaces"; COPY.md §1 recommends "The open-source textarea built for AI chat UIs" (open-source signal). Pick one.
- [ ] Description — currently 193 chars; PH limit is now **500 chars** (not 260). Use the expanded version in `COPY.md §1`.
- [ ] Launch tags (3) — only 2 set (Artificial Intelligence, User Experience); add **Developer Tools** / **Open Source** per COPY.md priority
- [ ] Links: site ✅, GitHub ✅ — still add **npm** link; put `/docs/try-it-live` in the **Interactive demo** field (accepts any URL)
- [x] Pricing: Free ✅ (open-source checkbox ticked)
- [ ] Makers — only @ilko_kacharov added; add other contributors (they need PH accounts first)
- [ ] Shoutouts — 1/3 (shadcn/ui); add 2 more (ideas: Claude Code, Next.js/Vercel, Remotion)
- [ ] First comment — **empty in form**; paste from `COPY.md §2`
- [ ] Video — field empty; accepts **YouTube or Loom**; upload `prompt-area-typing-demo.mp4` and link it
- [ ] Post **scheduled for 12:01 AM PST** on launch day (form still "In progress" — scheduling creates the upcoming page that collects followers)

## Audience warm-up (T‑10 → T‑1)

- [ ] Build notify list (team, communities, X, newsletter)
- [ ] Ask people to **follow the upcoming page** (not "upvote")
- [ ] Line up 5–10 supporters who'll leave substantive comments
- [ ] Pre-write & queue: X thread, LinkedIn, Reddit, HN, Discord (`COPY.md §4–9`)
- [ ] Notify relevant newsletters/communities of the date

## Launch day (12:01 AM PST)

- [ ] Post live — verify gallery, links, thumbnail render
- [ ] Paste the **maker's first comment** immediately
- [ ] DM close circle that it's **live** (no "upvote" language)
- [ ] Publish X thread (pin it) + LinkedIn
- [ ] Reply to every comment within minutes — all day
- [ ] US-morning push (6–9 AM PST): share milestone updates
- [ ] Post Reddit + Show HN (organic, no PH-vote mentions)
- [ ] Engage genuinely with other makers' launches
- [ ] Evening: "behind the build" technical post

## Do NOT

- [ ] ❌ Ask for upvotes anywhere
- [ ] ❌ Incentivize / buy votes or use vote rings
- [ ] ❌ Mass-DM ref-upvote links

## Post-launch (T+1 → T+14)

- [ ] Thank everyone publicly + share result/badge
- [ ] Triage inbound issues/PRs; ship a visible improvement, credit contributors
- [ ] Add "Featured on Product Hunt" badge to site + README
- [ ] Write a build-in-public recap post (T+7)
- [ ] Repurpose gallery slides for social/docs

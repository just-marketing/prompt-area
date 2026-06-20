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
- [ ] **Live demo:** `prompt-area.com/docs/try-it-live` loads & runs (pinned version matches latest npm — currently `0.3.2`)
- [ ] GitHub repo public, README polished, MIT license visible
- [ ] A couple of "good first issue" labels for inbound contributors
- [ ] `llms.txt` / `llms-full.txt` current (great for the AI-agent install path)

## Assets (T‑10 → T‑5) — all in [`assets/`](./assets)

- [ ] Thumbnail uploaded (`thumbnail-240.png`)
- [ ] Gallery images 01–08 uploaded in order
- [ ] First gallery image = hero with value prop overlay ✅
- [ ] (Optional, recommended) `demo.gif` recorded (5–8s, <3MB, good first frame)
- [ ] Captions set under each gallery image (from `COPY.md §3`)

## PH post draft (T‑5 → T‑1)

- [ ] Name: `Prompt Area`
- [ ] Tagline (from `COPY.md §1`)
- [ ] Description ≤ 260 chars (from `COPY.md §1`)
- [ ] Topics (3) selected
- [ ] Links: site, GitHub, **interactive demo** (`/docs/try-it-live`), npm, X
- [ ] Pricing: Free / Open Source
- [ ] Makers all added
- [ ] First comment drafted & ready to paste (`COPY.md §2`)
- [ ] Post **scheduled for 12:01 AM PST** on launch day

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

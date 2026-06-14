# Prompt Area — Product Hunt Launch Plan

> Everything needed to run a Product-of-the-Day–caliber launch for **Prompt Area**,
> the open-source React textarea for AI chat UIs (shadcn registry, zero deps).
>
> Companion files: [`COPY.md`](./COPY.md) · [`CHECKLIST.md`](./CHECKLIST.md) · [`assets/`](./assets) · [`README.md`](./README.md)

---

## 1. Positioning & strategy

**One-line positioning:** _The open-source rich textarea built specifically for AI chat & prompt inputs — mentions, commands, markdown and files in one shadcn component, with zero extra dependencies._

**Who we're for (in priority order):**

1. React / Next.js developers building AI chat, agent, or copilot UIs.
2. shadcn/ui users who want a drop-in composer instead of stitching libraries.
3. Indie hackers & AI-app founders who need a polished input _today_.
4. Design-engineers who care about a11y, dark mode, and owning their code.

**Why this wins on PH:** The PH audience over-indexes on devs, indie hackers, and AI builders. A _free, open-source, install-in-one-command_ dev tool with an instantly-recognizable problem ("every AI app needs a good input box") is exactly the kind of product that earns upvotes and genuine comments. We lead with the pain (stitching 5 libraries) and the relief (1 component, 0 deps).

**The core narrative (repeat everywhere):**

> Most rich text editors are document editors crammed into a chat box. Prompt Area is purpose-built for prompt-style inputs — @mentions, /commands, #tags, inline markdown, and file attachments — shipped as source via the shadcn registry so you own the code and add zero dependencies.

**Proof points to hammer:**

- 0 extra dependencies (vs 2–5 for Tiptap/Lexical/Plate/BlockNote)
- Install in one command: `npx shadcn@latest add …`
- You own the source — it lives in your repo, fully editable
- Companion components included: Action Bar, Status Bar, Compact, Chat Layout
- Production-grade: undo/redo, IME (CJK), ARIA a11y, copy/paste chip preservation
- MIT licensed, built by Juma (formerly Team-GPT)

---

## 2. Goals & success metrics

| Tier        | Outcome                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| 🥉 Baseline | Top 5 Product of the Day, 250+ upvotes, 40+ comments                      |
| 🥈 Target   | **#1 Product of the Day**, 500+ upvotes, GitHub stars +500                |
| 🥇 Stretch  | Product of the Week feature, 800+ upvotes, front-page of a dev newsletter |

Secondary metrics that matter more than rank: **GitHub stars, `npx shadcn add` installs, site traffic, newsletter signups, and qualitative feedback from real builders.** PH is a traffic-and-credibility event, not the finish line.

---

## 3. Timing

- **Launch day:** Tue/Wed/Thu. **Reality check on competition:** Tue & Wed have the most traffic _and_ the most brutal competition (often **600–1000+ upvotes needed for #1**, frequently VC-backed). **Thursday** keeps high traffic with slightly lighter competition — a better risk-adjusted pick for an open-source tool without a huge existing network. Avoid Mon (crowded) and Fri–Sun (low traffic).
- **Go-live time:** **12:01 AM PST** (PH days run 24h on PST) — gives the full 24-hour window. Be available the first 3–4 hours and again during US morning (6–9 AM PST) and US-East midday.
- **Suggested date:** **Thursday, June 18 or 25, 2026** (or a Tuesday if you've built a large support network and want max exposure). Gives ~1.5–2 weeks of prep from today (2026‑06‑07). Schedule the draft now so the upcoming page collects followers.
- **Plan outreach waves by timezone** (stagger so it looks organic, not a spike — see §10):

  | Wave | PST                      | Who                                         |
  | ---- | ------------------------ | ------------------------------------------- |
  | 1    | 12:01 AM                 | Inner circle (already awake / set an alarm) |
  | 2    | ~8 AM (London/EU 4–5 PM) | EU network + communities                    |
  | 3    | ~6–9 AM                  | US East Coast (3:01 AM EST → their morning) |
  | 4    | midday                   | US West + newsletter sends                  |

- **Avoid collisions:** check the PH "upcoming" page + tech/holiday calendar. Don't launch the same day as a major OpenAI/Anthropic/Vercel keynote. Keep a backup date one week out.

---

## 4. Roles & hunter

- **Maker(s):** Add every contributor as a Maker (by PH username) so their networks get notified and they show as the team. Makers should have complete PH profiles + avatars.
- **Hunter:** **Self-hunt.** Since ~2023 the hunter halo matters far less than an engaged maker. Self-hunting keeps you in full control of timing and the first comment. Only use an external hunter if they are genuinely relevant and will actively engage — a disengaged "big" hunter adds nothing.
- **Featured/notified audience:** Ask your team and friends to **follow the Prompt Area PH page before launch** and to _follow you as a maker_ — followers of makers get an email when the post hits the homepage.

---

## 5. Pre-launch (T‑14 → T‑1)

**T‑14 to T‑10 — Foundation**

- Lock the launch date; create the PH post as a **draft/scheduled** so the "upcoming" page collects followers.
- Finalize all copy from [`COPY.md`](./COPY.md) and all images in [`assets/`](./assets).
- Make sure `https://prompt-area.com` and the `npx shadcn add` command work flawlessly (the #1 thing visitors will try). Test the install in a fresh project.
- Confirm GitHub repo is public, README polished, issues templates ready, a "good first issue" or two labeled.

**T‑10 to T‑5 — Audience warm-up**

- Build a notify list: teammates, past users, Discord/Slack communities, X followers, newsletter. Do **not** ask for upvotes in advance (against PH rules) — ask people to **be notified / check it out on launch day**.
- Line up 5–10 genuine supporters who will comment with substance (questions, use-cases), not just "congrats."
- Pre-write your social posts (X thread, LinkedIn, Reddit, Discord, HN) — see [`COPY.md`](./COPY.md).
- Reach out to relevant newsletters/communities (shadcn, React, Next.js, AI-eng) letting them know the date.

**T‑4 to T‑1 — Final prep**

- Dry-run the post in a draft: name, tagline, description, topics, gallery order, thumbnail, links, first comment.
- Schedule the post for 12:01 AM PST on launch day.
- Prepare the maker's first comment (paste-ready) and an FAQ doc of likely questions + answers.
- Sleep. Block the launch day calendar.

---

## 6. Launch day playbook (the 24-hour window)

**12:01 AM PST — Go live**

- Post goes live (or publish the scheduled draft). Immediately post the **maker's first comment** (story + ask for feedback).
- Verify gallery renders, links work, thumbnail looks right on the live card.

**First 1–2 hours — Ignition**

- Notify your closest circle that it's **live** (DM the link, don't say "upvote"). Early velocity matters for the algorithm.
- Post the X launch thread + LinkedIn post. Pin the X thread.
- Drop in relevant Slack/Discord communities where self-promo is allowed.

**US morning 6 AM–12 PM PST — Sustain**

- Reply to **every** comment within minutes. Be helpful, technical, human. This is where Product of the Day is won.
- Share milestone updates ("we're #2 — thank you!") on X to re-trigger your network.
- Post to Reddit (r/reactjs, r/nextjs, r/SideProject — read each sub's self-promo rules) and consider Hacker News _Show HN_ (organic, no vote-asking, link to GitHub not PH).

**Afternoon/Evening — Closing strong**

- Keep replying. Engage with _other_ makers' launches genuinely (community reciprocity).
- Post a "behind the build" angle on X (a technical detail: contentEditable engine, IME handling, the zero-dep decision).
- Final evening push to time zones that haven't seen it (EU is asleep; US east evening still active).

**Rules — do NOT break these (PH will penalize/disqualify):**

- ❌ Never explicitly ask for upvotes anywhere ("check it out", "I'd love feedback" is fine; "please upvote" is not).
- ❌ No vote rings, no incentives for votes, no bought votes.
- ❌ Don't link straight to `?ref` upvote URLs in mass DMs.
- ✅ Ask people to _try it, comment, and share honest feedback._

---

## 7. Assets checklist (all in [`assets/`](./assets))

| Asset                               | File                                     | Spec                   | Status                                                         |
| ----------------------------------- | ---------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Thumbnail (square)                  | `thumbnail-240.png`, `thumbnail-600.png` | 240×240 min, <3MB      | ✅                                                             |
| Gallery 1 — Hero (value prop)       | `gallery-01-hero.png`                    | 1280×720 (16:9)        | ✅                                                             |
| **Gallery 2 — Live demo (motion!)** | `gallery-02-demo.gif`                    | 1200×675, 0.2MB (<3MB) | ✅ animated — chips + markdown resolving as you type           |
| Gallery 3 — Inline markdown         | `gallery-03-markdown.png`                | 1280×720               | ✅                                                             |
| Gallery 4 — Files & images          | `gallery-04-attachments.png`             | 1280×720               | ✅                                                             |
| Gallery 5 — Drop-in replicas        | `gallery-05-drop-in-replicas.png`        | 1280×720               | ✅                                                             |
| Gallery 6 — Install / zero deps     | `gallery-06-install-zero-deps.png`       | 1280×720               | ✅                                                             |
| Gallery 7 — One component vs five   | `gallery-07-one-component.png`           | 1280×720               | ✅                                                             |
| Gallery 8 — Dark mode & a11y        | `gallery-08-dark-mode-a11y.png`          | 1280×720               | ✅                                                             |
| **Typing demo video (primary)**     | `prompt-area-typing-demo.mp4`            | 1280×720, ~6.5s        | ✅ upload to YouTube for PH video field — focused product demo |
| Slideshow video                     | `prompt-area-demo.mp4`                   | 1280×720, ~17s         | ✅ social teaser (all slides)                                  |
| Looping GIF (social)                | `prompt-area-demo.gif`                   | 960px, ~4.6MB          | ✅                                                             |
| Looping GIF (slideshow, <3MB)       | `prompt-area-demo-compact.gif`           | 720px, ~2MB            | ✅                                                             |

**Gallery notes (PH best practice):**

- **Image #2 is now an animated GIF** — ≈53% of Product-of-the-Day winners include motion, and it shows the product's "wow" (chips + markdown resolving live) in the first few seconds. Put motion early.
- First image is the strongest static shot — value-prop headline + flagship UI (the hero). Most people only see #1–2.
- Images are 16:9 (1280×720 static, 1200×675 GIF), fully supported by PH. (PH "recommends" 1270×760; 16:9 displays cleanly in the carousel and embeds.)
- All slides keep generous padding so UI never touches the edges — stays readable when PH scales the carousel.

---

## 8. Post-launch (T+1 → T+14)

- **T+1:** Thank everyone publicly (X, LinkedIn). Post final result + a screenshot of the badge. Reply to any straggler comments.
- **T+1–3:** Triage the GitHub issues/PRs and feature requests that came in. Ship a quick visible improvement and credit contributors — momentum compounds.
- **T+7:** Write a "what launching on Product Hunt taught us" build-in-public post (great for X/LinkedIn reach and SEO).
- **Embed the PH badge** ("Featured on Product Hunt") on prompt-area.com and the README.
- **Repurpose the gallery slides** as social content, README images, and docs hero shots.
- Feed learnings + new use-cases back into the docs and the `llms-full.txt`.

---

## 9. Risks & mitigations

| Risk                                | Mitigation                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Install command fails for a visitor | Test in a clean repo pre-launch; pin shadcn version notes in docs; watch issues on launch day.                   |
| "It's just a textarea" skepticism   | Gallery 7 (one component vs five) + comparison table answer this head-on; first comment frames the real pain.    |
| Low early velocity                  | Warm up the notify list; have 5–10 engaged supporters ready; launch 12:01 PST for full window.                   |
| Comments go unanswered              | Block the full day; assign a maker to monitor; pre-write FAQ answers (COPY §10) + response templates (COPY §12). |
| Launch-day collision                | Check PH upcoming + tech calendar; keep a backup date one week out.                                              |

---

## 10. How Product Hunt ranking actually works

Don't optimize for raw upvotes — optimize for the signals the algorithm rewards.

- **Upvotes ≠ points.** PH weights votes by account quality. Votes from **older (30+ day), active, diverse-history** accounts count far more than new/single-purpose/same-day accounts. Bulk or coordinated votes (same IP/device, connected accounts, team votes) are discounted or flagged.
- **Engagement depth is a first-class signal.** Thoughtful comments + maker replies + Q&A threads are harder to fake than votes and meaningfully lift ranking. This is why the 9-minute reply rule (COPY §12) matters.
- **Velocity pattern matters more than a spike.** Steady accumulation across the day reads as organic; a huge hour-1 spike followed by silence looks artificial and can hurt. This is the reason to **stagger outreach in timezone waves** (§3), not blast everyone at once.
- **First ~4 hours are special:** rankings are randomized and public vote counts are hidden while the algorithm observes. Don't panic about position early — focus on steady votes + rich comments. Rankings become vote-based after ~4h.
- **Implication for us:** prioritize a _genuine_ supporter network (§11) and real conversation over a vote blast. For an open-source tool, depth of discussion is our edge.

## 11. Supporter network (build before launch)

Top launches have 50–200+ _genuine_ supporters. Build a tiered list now and activate it in waves (§3). **Ideal supporter:** has a real PH account, 30+ days old, some activity history, genuine interest — and leaves a _substantive_ comment, not just "Congrats!"

| Tier             | Who                                                                               | Target  |
| ---------------- | --------------------------------------------------------------------------------- | ------- |
| 1 — Inner circle | Team, close friends/family on PH, beta users, advisors                            | 20–50   |
| 2 — Warm network | Professional connections, industry peers, ex-colleagues, active community members | 50–100  |
| 3 — Extended     | Newsletter subs, social followers, past users                                     | 100–300 |
| 4 — Reciprocal   | Other makers you've genuinely supported; launch-swap partners                     | 20–50   |

Nurture tiers 1–2 in the weeks before; ask everyone to **follow the upcoming page** (not "upvote"). On the day, DM that it's **live** with the link and ask for honest feedback + a comment. Line up ~10 people ready to ask real questions early to seed discussion.

## 12. Channel strategy — ORB (funnel everything to owned)

Structure promotion across three channel types, always routing attention back to **owned** assets so the launch compounds beyond the day:

- **Owned** (you control): GitHub repo, prompt-area.com, docs, newsletter, any Discord/Slack. → The PH spike should convert into **stars, installs, and signups** here.
- **Rented** (visibility, not control): X/Twitter, LinkedIn, Reddit, YouTube, HN. Pick the 1–2 where React/AI builders actually are; use them to drive to owned + the PH page.
- **Borrowed** (someone else's audience): relevant newsletters (shadcn/React/Next/AI-eng), community shout-outs, dev influencers. Line these up pre-launch (§5).

Goal: a viral post or a newsletter mention should always lead to a GitHub star or an install — not just a vote that evaporates at 11:59 PM PST.

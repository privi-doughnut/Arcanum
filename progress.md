# Arcanum — Progress & Roadmap

> Living roadmap. Maintained by Claude + Privi. Last updated: 2026-07-24.
> CAC deadline: **Oct 26, 2026**. Branch for current work: `audit-and-fixes`.

---

## 🟡 TO DO — things we still need to do (Claude can do these)

Ordered roughly by priority. _(The bug patch + readability + Planar redesign from this session are DONE — see below.)_

1. **Your review of the Planar redesign** — eyeball both themes + a real phone, then tell me what to tweak. This is the main open loop.
2. **Cloudflare Pages / single-Worker migration** — _scheduled for tomorrow (Privi's call)._ Prep the combined frontend+backend Worker (design below). Claude writes it; you deploy.
3. **Live + total users widget** — design below under "Only Privi can do" (needs a Worker/KV backend + deploy). Claude writes the Worker + client widget once you approve the approach. (Pairs naturally with the migration.)
4. **B5 — remove the dead duplicate light-theme CSS block.** DEFERRED for safety (see Done/notes); best done alongside the migration when we can fully verify. *(Needs your OK — deletes a big interleaved block.)*
5. **Surface real error messages in `sendMsg()`** (currently everything becomes "connection unstable"). Small, safe improvement — awaiting your go.
6. **Game-mode tiny fonts (R3)** — nav 5.5px / essence label 5px are near-illegible. Left alone for now (layout risk + it's the arcade aesthetic; the "Larger text" a11y zoom covers accessibility). Revisit if you want.
7. **Marketplace "Load more" perf** — append only the new batch instead of rebuilding all shown cards. Nice-to-have.

---

## 🔵 ONLY PRIVI CAN DO — Claude is blocked on these

These need your accounts / dashboards / deploy access. Claude will prep the code, but only you can pull the trigger.

- **Deploy `worker.js` changes** — the Worker deploys from the Cloudflare dashboard, not from this repo. Any Worker edit Claude makes is inert until you paste + deploy it.
- **Cloudflare Pages setup** — connect the GitHub repo to Cloudflare Pages (or set up the combined Worker + static assets). DNS / custom domain if you want one.
- **Create the KV namespace (or Durable Object)** for the live/total user counter, and bind it to the Worker. Claude can't create Cloudflare resources.
- **Supabase** — if we count anonymous users via Supabase instead of KV, you'd add the table + RLS policy. (Claude recommends KV/DO over Supabase for this — see widget design.)
- **Netlify → Cloudflare cutover** — decide when to flip, and retire the Netlify site.
- **Decide the CAC-facing "impact" framing** — what numbers you want judges to see (total users, live users, ECs catalogued, plans generated, etc.).

---

## 🟢 DONE

- ✅ Cloned repo, created `audit-and-fixes` branch off `main`.
- ✅ Full audit of the app (code + live browser, both modes, both themes).
- ✅ **B1 — nav mislabel fixed.** `NAV_LABELS.grimoire` game label corrected `'Spellbook'→'Grimoire'` (index.html:9139). Fixes the desktop nav, mobile menu, AND the quick-add button in one line.
- ✅ **B1b — data-std poisoning fixed (found during verification).** The grimoire nav-link was double-managed by both `NAV_LABELS` and a redundant `data-std="Tracker"`; when the app initialized in Planar mode the `data-game-cache` got poisoned with "Tracker", so game mode showed the wrong word. Removed the redundant `data-std` from that one nav-link (index.html:1247). Verified across repeated mode toggles and both init states.
- ✅ **B2 — duplicate `id="contrast-toggle"` fixed.** Second element renamed to `hicontrast-labels-toggle` + `toggleHighContrast()` updated. No more id collision; each toggle controls its own switch.
- ✅ **B3 — Planar mobile scaling fixed.** Added `@media(max-width:600px)` Planar font overrides at winning specificity/order (verified in the parsed stylesheet: override exists, comes after the fixed rule, wins ≤600px; desktop unchanged at 16px).
- ✅ **R1 — contrast improved.** `--text3` darkened/brightened in all three token blocks (base dark, both light copies) toward AA; `--text2` nudged on dark. Planar gets a full AA-contrast palette (below).
- ✅ **Planar redesign — business-chic skin shipped.** New neutral palette scoped to `[data-mode="standard"]` (dark = deep slate, light = cool off-white), ink Cormorant wordmark (retired the cursive), ink headings, confident buttons, cool-neutralized ~20 previously-warm "parchment" surfaces, subtle card shadows. Game mode 100% untouched.
- ✅ **R4 — Planar language leaks fixed (mode-aware, game voice preserved).** Search placeholder ("Search spells…"→"Search activities…" in Planar), empty-state ("No spells/activities match"), Load-more count ("… of N spells/activities"), and the Quill validation ("Spell Name"/"Activity Name"). Game mode keeps every word it had.
- ✅ **B4 — accessibility settings consolidated.** Merged the two duplicate ACCESSIBILITY sections into one: Read aloud · Larger text (whole-app zoom) · High contrast (the robust `data-contrast` one) · Disable animation · Replay tour. Removed the two weaker redundant toggles ("Larger text in EC cards", "High contrast labels") and their now-dead functions (`toggleLargeText`, `toggleHighContrast`). No user DATA keys touched. Verified: 1 section, no dup ids, 0 dangling handlers.
- ✅ Verified after all edits: JS parses, **0 dangling handlers**, API_URL ×1, model ×6, catalog intact, no duplicate ids.
- ⏳ _Not yet real-device tested — B3 is verified by cascade logic; Privi should eyeball on an actual phone (the browser here has a min-width and can't emulate <600px)._
- ⏸ **B5 (dead duplicate light-theme CSS) — intentionally DEFERRED.** The two light-theme blocks are large and **interleaved with non-light rules**, so a safe delete needs a line-by-line diff I can't fully visually verify here. It's harmless dead weight (the later copy just wins). Not worth a regression risk on a competition build for invisible byte savings — revisit once there's a build/verify step, or when doing the Cloudflare migration.

### Session 3 (2026-07-25) — product changes you requested
- ✅ **Default mode is now Planar.** New visitors start in the calm Planar skin (`siteMode` default `'game'`→`'standard'`). Game mode is now opt-in gamification via Settings. Existing users keep whatever they had. _(Theme still defaults to dark — Planar+dark; tell me if you'd rather new users land on the cream light theme.)_
- ✅ **Streaks removed.** Deleted the home streak display, `tickStreak()` + its caller, and the "Day streak" stat in Insights. No nudgy streak counter anywhere.
- ✅ **Planar light is now warm cream** (not pure white): `--bg #f5f0e8`, warm off-white cards, warm neutral borders, warm espresso primary button, warm shadows/gradients. Softer, still business-chic.
- ✅ **Game-mode readability lift.** Brightened the shared dark text tokens and bumped serif body sizes (`.ec-desc`, `.feat-desc`, taglines, FAQ, etc.) in `[data-mode="game"]` only. Pixel fonts + layout untouched.
- ✅ **Comprehensive, replayable onboarding.** Rebuilt the first-run tour into 11 plain-language slides covering every feature AND every Settings section (Account/sync, Appearance, Accessibility, Data export/backup, Replay). Progress dots now generate dynamically; replay resets cleanly; card scrolls on small screens. Replayable from Settings → Accessibility → Replay intro tour.
- ✅ Verified: JS parses, 0 dangling handlers, no streak refs, default=standard, 11 tour steps, API_URL/model/catalog intact. Onboarding flow tested end-to-end in-browser (dots, Back/Next, "Begin ✦", Settings slide).
- ❓ **Mobile (B3):** the confirmed root cause (Planar `!important` font scaling) is fixed and verified by cascade logic, but this environment's viewport is locked at 1440px so I could NOT capture a real phone screenshot. **Please eyeball on an actual phone.** If other mobile issues remain (overflow, overlays, ported game sections), send me what you see and I'll fix them specifically.

---

## 🛠 IMPROVEMENTS — what I (Claude) want to fix, based on the audit

Grouped **critical → important → nice-to-have**. Bug IDs referenced in the audit section at the bottom.

### Critical
- **B1 — Game-mode nav mislabel.** Tracker nav item reads "Spellbook" instead of "Grimoire" in game mode (two "Spellbook"s in the nav). One-word fix; high visibility to judges.
- **B2 — Duplicate `id="contrast-toggle"`.** Two elements share the id, so the "High contrast labels" toggle mis-wires to the other section's switch. Rename the second id + update its function.

### Important
- **B3 — Mobile Planar layout.** Add mobile-scoped Planar font overrides *after* the existing rules, at matching specificity + `!important`, so text scales down on phones. Additive only.
- **R1 — Contrast overhaul.** `--text3` fails WCAG in both themes; darken/brighten it to ≥4.5:1. Nudge `--text2` on dark. This is the core of the "hard to read" complaint.
- **Planar redesign** — rework Standard mode into a "business-chic / smooth-professional" system: refined neutral palette scoped to `[data-mode="standard"]` (game mode untouched), professional type treatment for the wordmark (retire the cursive), cleaner cards, stronger contrast.

### Nice-to-have
- **R3 — Game-mode font sizes.** Bump the smallest pixel fonts (nav 5.5px, essence label 5px) just enough to be legible without breaking layout. Game mode only.
- **B4 — Accessibility settings cleanup.** Merge the two overlapping a11y sections (after B2 fix). Needs your sign-off since it removes UI.
- **P1 — Load-more perf.** Append new batch instead of full re-render.

---

## ✨ FEATURE IDEAS — additions worth considering (kept few + high-quality on purpose)

Per your note: I'd rather pitch **one meaningful thing** than fifteen small ones. Ranked by impact-for-a-judge.

1. **Impact / usage widget (the one you asked for).** A small, tasteful bar showing **live users now** + **total users all-time**, counting anonymous visitors too. This *is* a feature and a strong "impact" signal for CAC. Design in the section below. **My recommendation: build this one well.**

2. **A single "Impact" strip on the home page** that folds the usage widget in with the numbers you already have (3,208 ECs, plans generated, ECs saved) — one cohesive proof-of-traction band instead of scattered stats. High judge value, low clutter, reuses existing data.

*(Deliberately NOT proposing more than this. The app is already feature-dense; these two reinforce each other rather than adding surface area.)*

---

## 📐 DESIGN NOTES (for the bigger items)

### Live + total users widget — recommended approach
**Goal:** count *everyone*, including anonymous visitors (most users don't make an account).

- **Total users (all-time):** a monotonic counter in **Cloudflare KV** (or a Durable Object for exactness). On first visit, the client generates a random anonymous id stored in `localStorage` (`arc-visitor-id`) and pings the Worker once; the Worker increments "total" only for ids it hasn't seen (dedupe via KV key or a hashed set). This counts anonymous humans without accounts.
- **Live users (now):** a **Durable Object** holding a set of heartbeats — each open tab pings every ~20s; entries older than ~45s expire. The DO returns the current live count. (KV alone can't do "live" cleanly; a DO is the right tool.)
- **Why not Supabase for this:** RLS + row writes per heartbeat is heavier and costs more than a DO/KV; KV/DO is the idiomatic Cloudflare path and pairs perfectly with the migration below.
- **Anti-inflation:** dedupe totals by visitor id; rate-limit heartbeats; judges care about honesty, so keep the count real (no seeding).
- **Client:** a small widget (home "impact" strip + optional nav badge) that reads both numbers. Fails gracefully to hidden if the Worker is unreachable.

### Cloudflare Pages / single-Worker migration
You already run the Jebadias proxy Worker. Combining frontend + backend:
- **Option A (recommended): one Worker serves everything.** Use Workers Static Assets (`assets` binding in `wrangler.jsonc`) to serve `index.html`, and keep the existing `POST` proxy handler for `/api/*` (Jebadias). Same origin → no CORS, one deploy, and the usage-counter DO/KV lives right there.
- **Option B:** Cloudflare Pages for the static site + Pages Functions for the API. Simpler DX, but splits concerns.
- Either way `API_URL` in `index.html` would change to a same-origin path (e.g. `/api`) — **this is the one "do-not-touch" value that would intentionally change**, so we do it deliberately and verify Jebadias still replies before cutover.
- Claude will draft the combined `worker.js` + `wrangler.jsonc` as a proposal; **you deploy.**

---

## 🔍 FULL AUDIT FINDINGS (reference)

### Bugs / correctness
- **B1** [critical] ✅ FIXED — Game-mode tracker nav labeled "Spellbook" (should be "Grimoire"). Root cause was `NAV_LABELS.grimoire[0]` (index.html:9139), which `applyMode()` writes onto the nav link, mobile menu, and quick-add button.
- **B1b** [critical] ✅ FIXED — the grimoire nav-link was ALSO carrying a redundant `data-std="Tracker"`, so it was double-managed by two labeling systems. Initializing in Planar mode poisoned its `data-game-cache` with "Tracker", leaking a Planar label into game mode. Removed the redundant `data-std` (index.html:1247).
- **B2** [critical] ✅ FIXED — Duplicate `id="contrast-toggle"` (index.html:4935 and :5050) → `getElementById` collision mis-wired `toggleHighContrast()`. Second id renamed to `hicontrast-labels-toggle`.
- **B3** [important] ✅ FIXED — Planar mobile layout: fixed-px `!important` font rules (index.html:1198–1213) overrode responsive `@media` breakpoints. Added winning `@media(max-width:600px)` overrides.
- **B4** [important] OPEN — Two live ACCESSIBILITY sections (index.html:4923 & 5042) with overlapping features: `toggleBigText`/`arc-bigtext` (whole-app zoom) vs `toggleLargeText`/`arc-large-text` (EC-card only); `toggleContrast`/`data-contrast` (robust) vs `toggleHighContrast`/`.high-contrast` (3 weak rules). Neither dead; confusing duplication. Consolidation needs your sign-off.
- **B5** [important] OPEN — the entire `[data-theme="light"]` stylesheet is duplicated (head block ~line 576 AND a body-level block ~line 2342). The later copy wins; the first is dead weight (~350 lines). Safe to delete the dead copy, but it's a big block so flagging rather than removing unilaterally.

### Readability
- **R1** [important] `--text3` fails WCAG contrast in both themes (dark `#505068`≈2.9:1; light `#9a8060`≈2.7:1). Used for taglines, section labels, meta, placeholders.
- **R2** [nice] `--text2` on dark (`#9090a8`) is borderline given the volume of muted body text.
- **R3** [nice] Smallest game-mode pixel fonts (nav 5.5px, essence 5px, labels 6px) are near-illegible.
- **R4** [important] Game-language leaks into Planar: "Search spells", "No spells match", "showing X of Y spells", "Scroll to browse ECs".

### Security / risk (mostly known/accepted)
- **S1** Worker has no rate limiting (§11.7 — known/accepted).
- **S2** `sendMsg()` catch swallows all errors into one message (§11.6 — known). Recommend surfacing `data.error.message`.
- **S3** Verify user-submitted (Quill) content is escaped wherever rendered. Catalog render path uses no `escH()` — safe for static data; confirm submissions never reach it. Low priority.

### Performance
- **P1** [nice] `renderMarketplace()` renderBatch rebuilds full shown-set innerHTML each "Load more" (O(n²)). Fine for typical use; minor phone jank deep in the list.

### Holistic read
- **Strongest:** catalog depth (3,208 rated ECs), the AI advisor + persona system, Common App export, the dual-mode concept.
- **Weakest link:** Planar mode visual design + readability + mobile — i.e. exactly what this session targets.
- **Density:** 15 pages + 14 overlays + streaks/badges/fragments/quiz/compare/timeline/insights is a lot. Breadth is impressive but risks overwhelming first-timers; onboarding + quiz mitigate. Recommend *reinforcing* existing surfaces (impact strip) over adding new ones.

# Arcanum — Progress & Roadmap

> Living roadmap. Maintained by Claude + Privi. Last updated: 2026-07-24.
> CAC deadline: **Oct 26, 2026**. Branch for current work: `audit-and-fixes`.

---

## 🟡 TO DO — things we still need to do (Claude can do these)

Ordered roughly by priority. _(The bug patch + readability + Planar redesign from this session are DONE — see below.)_

1. **Your review of the Planar redesign** — eyeball both themes + a real phone, then tell me what to tweak. This is the main open loop.
2. **✅ DEPLOYED & LIVE on Cloudflare (2026-07-26).** Single Worker `arcanum-api-proxy` serves the app + advisor + live-users widget, verified end-to-end. Remaining: **add a custom domain** (dashboard → worker → Settings → Domains & Routes) and **retire Netlify** once you're happy.
3. **✅ B5 — dead duplicate light-theme CSS removed** (2026-07-26). 137 lines of a verbatim-duplicate `[data-theme="light"]` block deleted from the body `<style>`; the head copy governs. Verified diff-identical before removal and visually unchanged in game+light and Planar+light after.
5. **Game-mode tiny fonts (R3)** — nav 5.5px / essence label 5px are near-illegible. Left alone for now (layout risk + it's the arcade aesthetic; the "Larger text" a11y zoom covers accessibility). Revisit if you want.
6. **Marketplace "Load more" perf** — append only the new batch instead of rebuilding all shown cards. Nice-to-have.
7. **~~Surface real `sendMsg()` errors~~ — DONE this session (S2).**

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
- ✅ **B5 (dead duplicate light-theme CSS) — DONE (2026-07-26).** Confirmed the body-`<style>` `[data-theme="light"]` block (lines 2477–2610) was a verbatim duplicate of the head block (576–709) via `diff` (identical), then deleted it + its comment header (137 lines). Head copy governs; verified visually unchanged in game+light and Planar+light, JS/handlers/critical-values intact.

### Session 3 (2026-07-25) — product changes you requested
- ✅ **Default mode is now Planar.** New visitors start in the calm Planar skin (`siteMode` default `'game'`→`'standard'`). Game mode is now opt-in gamification via Settings. Existing users keep whatever they had. _(Theme still defaults to dark — Planar+dark; tell me if you'd rather new users land on the cream light theme.)_
- ✅ **Streaks removed.** Deleted the home streak display, `tickStreak()` + its caller, and the "Day streak" stat in Insights. No nudgy streak counter anywhere.
- ✅ **Planar light is now warm cream** (not pure white): `--bg #f5f0e8`, warm off-white cards, warm neutral borders, warm espresso primary button, warm shadows/gradients. Softer, still business-chic.
- ✅ **Game-mode readability lift.** Brightened the shared dark text tokens and bumped serif body sizes (`.ec-desc`, `.feat-desc`, taglines, FAQ, etc.) in `[data-mode="game"]` only. Pixel fonts + layout untouched.
- ✅ **Comprehensive, replayable onboarding.** Rebuilt the first-run tour into 11 plain-language slides covering every feature AND every Settings section (Account/sync, Appearance, Accessibility, Data export/backup, Replay). Progress dots now generate dynamically; replay resets cleanly; card scrolls on small screens. Replayable from Settings → Accessibility → Replay intro tour.
- ✅ Verified: JS parses, 0 dangling handlers, no streak refs, default=standard, 11 tour steps, API_URL/model/catalog intact. Onboarding flow tested end-to-end in-browser (dots, Back/Next, "Begin ✦", Settings slide).
- ❓ **Mobile (B3):** the confirmed root cause (Planar `!important` font scaling) is fixed and verified by cascade logic, but this environment's viewport is locked at 1440px so I could NOT capture a real phone screenshot. **Please eyeball on an actual phone.** If other mobile issues remain (overflow, overlays, ported game sections), send me what you see and I'll fix them specifically.

### Session 4 (2026-07-25) — advisor reliability + Cloudflare migration prep
- ✅ **`sendMsg()` error handling fixed (S2).** It no longer masks every failure as "connection unstable." Now: real errors are `console.error`-logged for diagnosis (an HTTP/API error used to be swallowed silently); the user sees a **busy/overloaded** message (429/529/rate-limit) vs a **network** message vs a generic API error, all mode-aware (game vs Planar voice). Happy path unchanged.
- ✅ **Cloudflare single-Worker migration — code prepped (you deploy).**
  - `worker.js` is now a **combined Worker**: POST → Anthropic proxy (identical behaviour to before), everything else → static app via `env.ASSETS`. Backward compatible — if deployed with no assets binding it falls back to the old proxy-only behaviour.
  - `wrangler.jsonc` gains `main: worker.js` + an `assets` binding (`ASSETS`) + SPA not-found handling.
  - **`.assetsignore` added — SECURITY FIX.** The old config (`directory: "./"`, no ignore) would have **publicly served `CLAUDE.md`, `progress.md`, `claude-code-brief.md`, `worker.js`, `arcanum-data.js`** if deployed. `.assetsignore` now keeps everything but `index.html` private.
  - `API_URL` in index.html is **left untouched** (still the old proxy URL) so nothing breaks pre- or post-deploy; switch it to the new worker's origin only after you've verified.

### Session 5 (2026-07-25) — live/total users widget + migration instructions
- ✅ **Impact widget shipped (live + total visitors, anonymous included).** Home page, under the hero CTAs: a clean strip showing **Live now · Total explorers · 3,208 Activities**, with a pulsing green live dot. Adapts to both modes and both themes via tokens (verified game/dark + Planar/cream). Numbers use the chic serif in Planar.
  - **Backend:** a single global `Stats` **Durable Object** (SQLite) in worker.js. `seen` table = all-time unique visitors (total); `live` table = visitors pinged within 45s (pruned each heartbeat). Atomic, accurate, and — unlike KV — no write-quota problem. Route: `POST /api/presence {vid}` → `{live,total}`.
  - **Client:** each browser gets an anonymous `arc-visitor-id` (localStorage) and pings every 25s. Counts logged-out users. **Fails silently** (widget hidden) when the endpoint isn't deployed — so it's invisible on Netlify and lights up automatically once on the Worker. Live floored at 1 (you're always counted).
  - **Chose DO over KV deliberately:** a 25s heartbeat per user would blow KV's free-tier write quota in hours; the DO handles heartbeats cheaply and gives real-time-accurate live counts.
  - `wrangler.jsonc`: added the `Stats` DO binding + `new_sqlite_classes` migration. Worker name set to `arcanum-api-proxy` to reuse your existing worker (keeps API_URL + secret).
- ✅ **Detailed Cloudflare deploy instructions** written above (Workers Builds Git-connect + manual wrangler paths, custom domain, retiring Netlify).
- ✅ Verified: worker.js (ESM) parses, index.html parses, wrangler.jsonc valid JSON, 0 dangling handlers. Widget rendered in-browser (both modes/themes) and confirmed it hides gracefully when the endpoint is absent.

### Session 6 (2026-07-26) — DEPLOYED to Cloudflare (single Worker, live)
Merged everything to `main`, connected the repo to the Worker (Workers Builds), and got it live. Three deploy-time fixes were needed and made:
- **`public/` restructure** — dry-run caught that `assets.directory:"./"` would have served `.git` (140+ files) + all docs publicly; `.assetsignore` wasn't reliably excluding them. Moved index.html to `public/`, pointed assets there → wrangler reads exactly 1 asset. Added `netlify.toml` (publish=public) so Netlify kept working; removed `.assetsignore`.
- **`package.json`** — Cloudflare's builder ran `npm run build` and failed (no package.json). Added a minimal one with a no-op build + wrangler devDep. App still has no real build step.
- **`run_worker_first: true`** — Static Assets served asset-first, so POST `/` (the advisor) was 405'd by the asset layer before reaching the proxy. Ran the Worker first (it delegates GET to `env.ASSETS`).
- **Verified live via curl:** GET `/` → the app HTML (Planar default + widget markers); POST `/api/presence` → `{"live":1,"total":1}` (DO works); POST `/` → HTTP 200 with a real `claude-sonnet-5` reply (advisor + secret work). 🎉
- **Left for Privi:** add a custom domain to the worker; retire the Netlify site once satisfied.

### 🚀 CLOUDFLARE MIGRATION — step-by-step (Privi)

**What we're actually doing, in plain English:** right now two things host Arcanum — Netlify serves the website, and your Cloudflare Worker (`arcanum-api-proxy`) holds the API key and talks to Claude. We're merging them so **one Cloudflare Worker does everything**: serves the website, talks to Claude, AND runs the new live/total-users counter. Your website URL becomes the Worker's URL, and you turn Netlify off.

**The tool that does this is called `wrangler`** — it's Cloudflare's command-line uploader (think of it like the thing that pushes your files up, the way GitHub Desktop pushes commits). You run a couple of commands once, and you're migrated.

> Two small facts that make this easy:
> - I set the config to reuse your **existing** Worker (`arcanum-api-proxy`), so the API key/secret is **already there** and `API_URL` in the app **doesn't change**.
> - There's **no build step** — Arcanum is one HTML file, so wrangler just uploads it as-is.

---

#### ✅ STEP 0 — Before you start (2 checks)
1. **Confirm the Worker name.** Cloudflare dashboard → **Workers & Pages**. Look at your existing worker's name. It should be exactly **`arcanum-api-proxy`**. If it's spelled differently, open `wrangler.jsonc` and change the `"name"` line to match, then save. (If it matches, do nothing.)
2. **Make sure Node is installed.** In a terminal, run `node --version`. If you see `v18` or higher (you're on v22), you're good. If "command not found", install Node first (nvm).

> 💡 You can run every command below right here in this chat by typing `!` then the command (e.g. `! wrangler --version`), and I'll see the output and help if something errors. Or use your own Terminal app — either works.

---

#### ✅ STEP 1 — Open a terminal in the project folder
Everything must run from inside the Arcanum repo folder (the one with `index.html` and `wrangler.jsonc`). In a terminal:
```
cd /Users/privivijayakumar/Arcanum
```
(If you cloned it somewhere else, `cd` to that folder instead.)

#### ✅ STEP 2 — Install wrangler
```
npm install -D wrangler@latest
```
This downloads wrangler into the project. Takes ~30 seconds. It creates a `node_modules` folder and a `package.json` — that's normal and expected for deploying (they don't change the app itself).

#### ✅ STEP 3 — Log in to Cloudflare
```
npx wrangler login
```
This opens your browser and asks you to authorize wrangler. Click **Allow**. When the browser says "successfully logged in", come back to the terminal. (If it asks which account, pick the one that has your `arcanum-api-proxy` worker.)

#### ✅ STEP 4 — Validate first (doesn't deploy anything)
```
npx wrangler deploy --dry-run
```
This just checks the config is correct **without** uploading. If it prints something like "Total Upload… (dry run)" with no red errors, you're good. If it errors, paste the output to me and I'll fix it.

#### ✅ STEP 5 — Deploy for real
```
npx wrangler deploy
```
This uploads `worker.js` + `index.html` together and creates the `Stats` live-counter automatically. When it finishes it prints your Worker URL, e.g.
`https://arcanum-api-proxy.its-the-prithivi-show.workers.dev`

#### ✅ STEP 6 — Check it worked
Open that Worker URL in a browser. You should see:
- ✅ **The actual Arcanum app** loads (not the old "Method not allowed" text).
- ✅ The **Advisor** replies when you send it a message (proves the API key still works).
- ✅ The **home page shows the live/total widget** with real counts.

If all three are good, the migration worked. 🎉

#### ✅ STEP 7 — Put it on your real domain (optional but recommended for judges)
In the dashboard → your worker → **Settings → Domains & Routes → Add** → **Custom domain**. Enter the domain (or subdomain) you want, e.g. `arcanum-ec.com`. Cloudflare wires it up. That clean URL is what you show the CAC judges.

#### ✅ STEP 8 — Turn off Netlify
Once the Worker URL (or custom domain) is confirmed working, go to Netlify and either delete the site or unpublish it, so there's only one live copy.

---

#### 🔁 OPTIONAL — auto-deploy on every push (so you never run wrangler again)
This recreates the Netlify "push to GitHub → it deploys itself" convenience, but pointed at the Worker:
1. Dashboard → **Workers & Pages → `arcanum-api-proxy` → Settings**, find the **Build / Git** section → **Connect** and pick your `privi-doughnut/Arcanum` repo, branch `main`.
2. Build command: **leave blank**. Deploy command: `npx wrangler deploy`. Root directory: `/`.
3. Save. Now every push to `main` redeploys automatically — no terminal needed after this.

---

#### 🆘 If something goes wrong (common ones)
| You see… | Fix |
|---|---|
| `command not found: npm` / `node` | Node isn't installed/active. Run `nvm use 22` (or install Node), then retry. |
| `wrangler` asks you to log in | Run `npx wrangler login` (Step 3) and authorize in the browser. |
| A name/`workers.dev` conflict | The `"name"` in `wrangler.jsonc` doesn't match your real worker. Fix it (Step 0.1) and redeploy. |
| Advisor says it can't respond after deploy | The secret didn't carry over. Run `npx wrangler secret put ARCANUM_ANTHROPIC_KEY` and paste your `sk-ant-…` key, then `npx wrangler deploy` again. |
| Widget shows nothing | Normal for a few seconds; it appears after the first heartbeat. If it never shows, the `Stats` DO didn't deploy — paste the deploy output to me. |
| Anything red in the terminal | Copy the whole message into this chat; I'll tell you exactly what to do. |

**Don't:** paste `worker.js` into the dashboard's code editor. Static Assets + the DO counter only work through `wrangler deploy` (or the auto-deploy in the optional step). And don't delete `.assetsignore` — it's what keeps your `CLAUDE.md` / `progress.md` from being served to the public.

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

Per your note: significant, high-quality steps only — no oversaturation.

- ✅ **Impact / usage widget — SHIPPED & LIVE.** Home strip: live now · total explorers · 3,208 activities (counts anonymous users, Durable Object backend).

**Requested — to roadmap (both are meaningful Advisor upgrades, worth doing well):**

1. **Import an outside AI chat into Jebadias.** Let a student paste (or upload) a conversation they had with another model — ChatGPT, Gemini, etc. — so Jeb instantly gets up to speed on their situation instead of re-interviewing them. *Sketch:* a "Catch Jeb up" button on the Advisor page → paste box (or `.txt`/`.json` upload) → the text is summarized/condensed (via the Worker) into a compact context block that's prepended to `buildJebSystem()` for that session, and optionally saved. Keep it to a size cap so it doesn't blow the token budget. High value: removes the cold-start friction that makes new users bounce.

2. **Jeb cross-chat memory (like Claude's "who I am / how I like replies").** A persistent, user-controlled profile Jeb remembers across every conversation and persona: name, grade, goals, constraints, tone preferences ("be blunt," "keep it short"). *Sketch:* a small "What Jeb should remember about you" editor in Settings (and/or an inline "remember this" action in chat) → stored in an `arc-jeb-memory` key (and synced to the user's Supabase row when signed in) → injected into `buildJebSystem()` on every chat. Must be **viewable, editable, and clearable** by the student (transparency + trust). This is the natural companion to #1 and would make Jeb feel genuinely personal. Likely the single highest-impact Advisor upgrade on the list.

*(These two pair together — import = one-time catch-up, memory = ongoing context — and both reinforce the Advisor rather than adding new app surface. Deliberately not proposing more.)*

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

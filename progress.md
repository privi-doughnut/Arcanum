# Arcanum — Progress & Roadmap

> Living doc for Arcanum (extracurricular marketplace + AI advisor, 2026 Congressional App Challenge, deadline **Oct 26 2026**).
> Last updated: 2026-08-14. Branch: `main` (deploys automatically to Cloudflare).

---

## ✅ CURRENT STATUS — live on Cloudflare

Arcanum runs from **one Cloudflare Worker** named `arcanum` (Workers Builds auto-deploys on push to `main`). That single Worker:
- serves the app (`public/index.html`) via Static Assets,
- proxies the AI advisor to Anthropic (key stays server-side),
- tracks live/total visitors (`Stats` Durable Object),
- rate-limits + guards the advisor (`RateLimiter` DO, model pin, origin lock, input caps).

`API_URL` is same-origin (`location.origin`), so it survives renames/custom domains.

**Shipped:** business-chic Planar redesign across every high-traffic surface (home hero with a live catalog "wall", marketplace, advisor, EC detail, tracker/saved, about) · a distinct retro **game-mode** hero (pixel arcade buttons, HUD scoreboard, blinking cursor, CRT, catalog ticker) · Planar-as-default with game mode opt-in · comprehensive replayable onboarding · live/total users widget · Jeb memory + import-outside-chat · Common App export · clickable scroll pill · readability + accessibility fixes · security hardening (below).

---

## 🧭 WHERE WE LEFT OFF (read this first on a cold start)

**State as of 2026-08-14:** app is live on the single `arcanum` Cloudflare Worker and healthy. The design-polish batch (commit `c70dfce`) is pushed, live, and — as of this session — **visually verified in a real browser**. Local `public/index.html` is byte-identical to what the Worker serves (matching `shasum`).

**✅ The visual eyeball is DONE.** Drove headless Chrome over CDP against the **live** Worker at 1440px (both modes) and 390px, forcing `arc-mode` via `localStorage` and reading back computed styles. Results:
- **Game mode** — no blinking c‍ursor after "The Extracurricular Marketplace" (change 2 confirmed gone), the ticker is legible at 9px, and all 12 nav labels fit on one row without wrapping (change 5 good).
- **Planar mode** — `#impact-strip` computes to **429px, not full-width**, and renders as a bordered box hugging its three stats with even spacing (change 3 good).
- **Grid centering** — `.home-features-grid` computes `279.99px ×3` and `.feat-ec-grid` `319.99px ×3`, both with `justify-content: center`. No `1fr` stretching left anywhere (change 4 good).
- **Ticker speed** (change 1) is a CSS duration, confirmed by grep (`htScroll 92s`) rather than by eye — a still frame can't show it.

Nothing from the batch is broken. **Repro recipe** for future visual checks lives in `/tmp/arcshot/cdp.mjs` (regenerate if gone: launch Chrome with `--headless=new --remote-debugging-port=9333`, drive `Page.captureScreenshot` over CDP — plain `--screenshot` **hangs** on this page because the infinite ticker animation means the load-idle heuristic never settles).

### 🔎 Two pre-existing mobile issues found (NOT from the polish batch — unfixed, your call)
Spotted at 390px in Planar while verifying. Both predate `c70dfce`; nothing in that batch touched them.
1. **Header is cramped** — "Sign in" wraps onto two lines and crowds the "Arcanum" wordmark.
2. **Hero CTAs are left-aligned** while every other hero element (eyebrow, headline, subhead) is centered at that width — looks unintentional. The impact strip also wraps 2+1 with a divider trailing into empty space.

Neither is fixed — say the word and they're a small scoped CSS change.

### Design-polish batch — commit `c70dfce` (all in `public/index.html`, CSS-only)
1. **Game-mode catalog ticker** — slowed `htScroll` 46s→**92s** and bumped `.ht-item` font 8→9px (was hard to read / looked jittery). Track is 22 items ×2 duplicated, `translateX(-50%)` = seamless loop. CSS ~line 1533/1536.
2. **Removed the blinking terminal c‍ursor** — the `[data-mode="game"] .home-logo-sub::after` `▮` (+`@keyframes pxBlink`) read as a stray "flashing orange type-here line." Fully removed; `grep pxBlink` = 0.
3. **Planar hero impact strip** — was stretching full-width (`max-width:none`) with stats smushed left + a big right gap. Now `width:fit-content` + `gap:22px` so the bordered box hugs its 3 stats evenly. Scoped to `@media (min-width:900px)` desktop hero; mobile keeps the base centered strip. CSS ~line 1414.
4. **Home card grids center incomplete rows** — 4 grids (`.home-features-grid`, `.feat-ec-grid`, the "Four Ratings" inline grid, the game-only "Rating Systems" inline grid) switched from `minmax(…,1fr)` (which stretched/left orphan cards) to `minmax(…,280px|320px)` + `justify-content:center`, so ragged last rows center instead of leaving gaps.
5. **Game-mode nav labels** — `[data-mode="game"] .nav-link` bumped 5.5→**6.5px** with padding trimmed 10→8px so all ~14 items still fit. (Scoped to game mode only; Planar nav untouched.) CSS just after `.nav-link.active`.

**Verify markers (fast re-check any time):**
```bash
URL=https://arcanum.its-the-prithivi-show.workers.dev
b=$(curl -s "$URL")
grep -c 'htScroll 92s' <<<"$b"            # 1
grep -c 'minmax(210px,280px)' <<<"$b"     # 3
grep -c 'pxBlink' <<<"$b"                  # 0 (cursor gone)
grep -c 'width:fit-content' <<<"$b"        # 1
```

### ✅ CLAUDE.md reconciled (2026-08-14) — no longer stale
`CLAUDE.md` described the **old** architecture (Netlify + a separate `arcanum-api-proxy` Worker, `API_URL` hardcoded). It has now been rewritten to match reality: single `arcanum` Worker, same-origin `API_URL`, `public/index.html`, wrangler/Workers Builds deploy. Also refreshed against the actual file: line count 12,109 → **12,580**, all structural line numbers (`ECS_INLINE` now **5964–9178**), model refs **7** in index + **2** in worker, **15** overlays (was 14 — `#jebmem-overlay` was undocumented), and 5 `<style>` blocks. Its §12 previously said to paste `worker.js` into the **dashboard code editor**, which would have broken Static Assets and DO migrations — that is now an explicit "never." The DO-NOT-TOUCH rules were all still valid and were left intact.

### 🧹 Repo cleanup (2026-08-14)
Deleted three files that no longer earn their place:
- **`arcanum-data.js`** (488 KB) — the dead external-catalog file. Zero references anywhere in `public/index.html` or `worker.js`; the app has always run on `ECS_INLINE`. CLAUDE.md already *claimed* it was deleted — now it actually is. The defensive `window.ECS_DB` fallback expression stays.
- **`claude-code-brief.md`** — a finished one-off task brief for the old mobile-bug hunt. Stale (Netlify/proxy era) and fully superseded by CLAUDE.md.
- **`netlify.toml`** — Netlify is gone; `arcanum-ec.netlify.app` now returns **404**.

Also: **`README.md` was an 18-byte stub** and is now a real README (what it is, features, architecture, security, how to run) — judges land on the repo, so it mattered. And the dead `https://arcanum-ec.netlify.app` entry was removed from `ALLOWED_ORIGINS` in `worker.js`: same-origin passes on its own via `blockedOrigin()`, so it was doing nothing except allow-listing a domain someone else could later claim. **This one touches the live server — it ships on your next push.**

---

## ⚠️ ACTION ITEMS FOR PRIVI (things only you can do)

### Security config (do these — quick dashboard checks)
- [ ] **Supabase RLS write policies** — confirm `INSERT`/`UPDATE` on `user_state` (and `submissions`, `ravens`) use `WITH CHECK (auth.uid() = user_id)`, so a crafted request can't write to another user's row. (SELECT is already provably locked — verified.)
- [ ] **Supabase Auth → URL Configuration** — make sure the Site URL + redirect allowlist include the current Worker origin (`arcanum.its-the-prithivi-show.workers.dev`) and any custom domain, or Google sign-in breaks.
- [ ] **Rotate the 21st.dev API key** you pasted in chat (`21st_sk_…`) — treat any secret typed into a chat as exposed.
- [ ] (Optional) Supabase Auth: require **email confirmation** on signup + raise the **min password length**.
- [ ] (Optional) Add a **Turnstile** widget to the contact form — `ravens` allows anonymous inserts (by design) with no spam guard.

### Dependency hardening (supply-chain)
- [ ] **Self-host `supabase-js`** instead of the unpinned jsdelivr CDN (`@supabase/supabase-js@2`, no SRI). Drop the versioned file into `public/` and load it same-origin — removes the CDN supply-chain risk entirely. (Or at minimum pin an exact version + add an `integrity=` SRI hash.)

### CSP (test carefully before enforcing)
- [ ] Add a **Content-Security-Policy**. The safe headers (nosniff, frame-options, referrer, permissions-policy) are already live. CSP is left out because the app uses inline scripts/styles + CDNs, so a wrong policy breaks it. Recommended starting policy to add to `SEC_HEADERS` in `worker.js` and test on the workers.dev URL before trusting:
  ```
  default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;
  img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  ```
  (If you self-host supabase-js, drop `https://cdn.jsdelivr.net`. If you self-host fonts, tighten style/font-src too.)

### Launch / QA
- [ ] Add a **custom domain** to the `arcanum` Worker (Settings → Domains & Routes) — the clean URL for judges.
- [x] ~~**Retire the Netlify site**~~ — done; `arcanum-ec.netlify.app` returns 404. `netlify.toml` and the stale allow-listed origin are removed.
- [ ] **Eyeball on a real phone** — still worth doing on real hardware. Emulated 390px found two cosmetic issues (see "Where we left off"); a real device also catches touch-target and safe-area problems emulation misses.

---

## 🔒 SECURITY REVIEW — done (Bites 1–5)

- **Bite 1 · XSS:** `escH` didn't escape quotes and user URLs weren't scheme-checked. Added `safeURL()` (http(s)/relative only; blocks `javascript:`/`data:`) on the EC link, personal tracker link, and Quill image. Shared-link decoder was already escaped.
- **Bite 2 · Worker/proxy:** model pinned to `claude-sonnet-5` (no pricier-model abuse), cross-origin browser requests `403`'d (advisor + presence), plus the existing per-IP rate limit (15/min, 120/hr) + input caps (≤40 msgs, ≤8k chars, max_tokens ≤1500).
- **Bite 3 · Supabase/auth:** **RLS verified working** — anon queries to `user_state`/`submissions`/`ravens`/`profiles` all return `[]`. Public anon key exposes nothing. Standard auth, no custom crypto. (Follow-ups in Action Items.)
- **Bite 4 · Headers:** Worker now sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` on all responses. (CSP left as a tested-carefully to-do above.)
- **Bite 5 · Dependencies:** only external scripts are Supabase (jsdelivr) + Google Fonts. Recommendation: self-host supabase-js (in Action Items).

---

## 🗺️ ROADMAP / IDEAS

### Aesthetic long-tail (nice-to-have, not load-bearing)
- Polish the remaining Planar overlays (auth, Common App, compare, timeline, quiz) and the smaller pages (Guidelines/Codex, Submit EC form details) to match the redesigned surfaces. Global label/input polish already covers most of it.

### Feature ideas (kept few + high-quality on purpose)
- **Jeb cross-device sync** — SHIPPED and enabled (Supabase columns added). Memory/import follow signed-in users.
- **Summarize-on-import** — SHIPPED ("Condense with AI" button).
- **A single home "impact" strip for judges** — the live/total widget already does this; could fold in plans-generated once tracked.

---

## 📦 REFERENCE

**Architecture:** vanilla single-file `public/index.html` (no framework/build — a deliberate, judge-defensible choice) + `worker.js` (combined Worker) + `wrangler.jsonc`. Dual visual modes via `data-mode` on `<html>`: `standard` = Planar (default, editorial), `game` = pixel/retro. `.std-only` / `.mode-hide` / `data-std` drive the per-mode content.

**Naming gotcha (historical debt — leave it):** the `grimoire` variable is the *Saved* shortlist (`arc-grimoire`); the `spellbook` variable is the *Tracker* (`arc-spellbook`). Labels are inverted vs. the variable names. Page `id`s were swapped so Saved/Tracker nav shows the right content — don't "fix" the variable names.

**Supabase tables (RLS on):** `profiles`, `user_state` (synced blob: spellbook/grimoire/fragments/badges/pcounts + `jeb_memory`/`jeb_context`), `submissions` (pending, AI-moderated), `ravens` (contact). Anon key is public by design.

**Deploy:** push to `main` → Cloudflare Workers Builds runs `npx wrangler deploy`. Manual: `npx wrangler deploy` from the repo (needs `wrangler login` once). Deploy via wrangler/Workers Builds, **never** the dashboard code editor (Static Assets + DO migrations need wrangler). `.gitignore` keeps `node_modules` out; `package.json` exists only so the CI build's `npm run build` is a no-op.

**Verify a deploy quickly:**
```bash
URL=https://arcanum.its-the-prithivi-show.workers.dev
curl -s "$URL" | head -c 40                    # app HTML
curl -s -X POST "$URL/api/presence" -d '{"vid":"x"}'   # -> {"live":..,"total":..}
```

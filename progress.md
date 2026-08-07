# Arcanum — Progress & Roadmap

> Living doc for Arcanum (extracurricular marketplace + AI advisor, 2026 Congressional App Challenge, deadline **Oct 26 2026**).
> Last updated: 2026-08-04. Branch: `main` (deploys automatically to Cloudflare).

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
- [ ] **Retire the Netlify site** once the Worker/custom domain is confirmed.
- [ ] **Eyeball on a real phone** — mobile layout is verified by CSS logic, but I can't emulate a phone here.

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

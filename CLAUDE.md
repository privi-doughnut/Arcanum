# CLAUDE.md — Arcanum

> Persistent project context. Read this fully before touching anything.

---

## ⚠️ READ FIRST — THE ONE-PARAGRAPH BRIEFING

Arcanum is a **finished, live, deployed application** built solo by a high school sophomore. It is the submission for the **2026 Congressional App Challenge (deadline: Oct 26, 2026)** and a centerpiece of an NCSSM application. The entire app is **one 1.9 MB HTML file with 12,580 lines** (`public/index.html`). It works. **The default action is to report, not to change.** Make the smallest possible change that solves the stated problem, never refactor, never reformat, and always ask before doing anything not explicitly requested.

**Before any edit session: ensure the working tree is committed so changes are revertible.**

---

## 1. WHAT THIS APP IS

**Arcanum** helps high school students plan their extracurricular activities. Three core pillars:

1. **The catalog** — 3,208 activities, each rated on four dimensions, filterable and searchable.
2. **The AI advisor ("Jebadias")** — reads the student's situation and produces personalized guidance and full strategic plans.
3. **The tracker** — students commit to activities, track status/milestones/deadlines, and export to Common App format.

**Live:** https://arcanum.its-the-prithivi-show.workers.dev
**Repo:** `privi-doughnut/Arcanum` → Cloudflare **Workers Builds** auto-deploys on push to `main`.

The app has a **fantasy skin** ("game mode") that can be toggled off for a clean "**Planar**" mode. This is deliberate: the fantasy layer makes an intimidating process approachable for younger students; the toggle serves everyone else. Both modes expose identical functionality.

---

## 2. ARCHITECTURE

Arcanum runs as **one Cloudflare Worker named `arcanum`** that serves the app *and* backs it. Line numbers below are current as of 2026-08-14.

```
public/index.html  (1.9 MB, 12,580 lines)  ← THE ENTIRE FRONTEND
├── <script>  line 20            · JSON-LD structured data (SEO)
├── <script>  line 23–45         · mobile arrow-reset handler (tiny)
├── <style>   line 46–1042       · MAIN STYLESHEET (all base + responsive CSS)
├── <script>  line 1043          · supabase-js from jsdelivr (the one external script)
├── <style>   line 1044–1578     · id="mode-standard-css" — Planar skin + mode overrides
├── <body>    line 1579
│   ├── <style> line 2644        · inline scoped fix (#page-contact mobile)
│   ├── <style> line 2940        · scoped block
│   ├── <style> line 3608        · scoped block
│   └── ...all 15 pages as <div class="page"> …
└── <script>   line 5694–12558   · ALL APPLICATION LOGIC
    ├── const API_URL         line 5699  ← same-origin, NOT hardcoded (see §3)
    ├── const ECS_INLINE=[    line 5964  ← 3,208 objects, the bulk of the file
    └── const ECS = …         line 9179
worker.js  (228 lines)  ← the combined Worker: static assets + AI proxy + 2 Durable Objects
wrangler.jsonc          ← Worker config (assets dir, DO bindings, migrations)
```

**Stack:** Vanilla HTML/CSS/JS. **No framework, no build step, no router, no bundler.** This is a deliberate architectural decision that must be defensible to judges — do not introduce tooling. `package.json` exists **only** so Workers Builds has a no-op `build` script and `wrangler` for deploy; it is *not* an app dependency. The app's only runtime externals are **supabase-js** (jsdelivr CDN) and **Google Fonts**.

**Hosting:** Cloudflare Workers — a single Worker (`arcanum`) with Static Assets, auto-deployed from GitHub by Workers Builds. `wrangler.jsonc` sets `run_worker_first: true` so `POST /` (the advisor) and `POST /api/presence` reach the Worker instead of being 405'd by the asset layer; GET is served from `./public`.

**What the one Worker does** (`worker.js`):
- serves `public/index.html` via `env.ASSETS`,
- proxies the AI advisor to Anthropic so the API key never reaches the browser (key = encrypted Cloudflare secret),
- `Stats` Durable Object — live/total visitor counts (`POST /api/presence`),
- `RateLimiter` Durable Object — per-IP limits (15/min, 120/hr) + input caps,
- sends `SEC_HEADERS` (nosniff, referrer-policy, X-Frame-Options: DENY, permissions-policy) on every response.

**One external service:**
- **Supabase** — optional accounts + cross-device sync. Tables: `profiles`, `user_state`, `submissions`, `ravens`. Protected by Row Level Security.

---

## 3. 🚫 DO NOT TOUCH — HARD CONSTRAINTS

Breaking any of these takes down the live app or destroys user data.

| Item | Why it's untouchable |
|---|---|
| `const API_URL` (line 5699) — **same-origin**, derived from `location` | The app and its API are the *same* Worker, so the advisor posts to its own origin. This deliberately survives renames and custom domains. **Do not hardcode a URL here.** A wrong value silently kills the advisor with a misleading "connection unstable" error — that has already happened once. |
| `claude-sonnet-5` (7 refs in `public/index.html`, 2 in `worker.js`) | Current model, and the Worker **pins** it server-side so a crafted request can't bill a pricier model. The previous model was deprecated by Anthropic mid-project and took the app down. Do not "update" or guess at model strings. |
| `ECS_INLINE` array (lines 5964–9178) | The entire 3,208-activity catalog. **Never** reformat, sort, prettify, minify, deduplicate, or "optimize" it. |
| `ARC_SUPABASE_URL` / `ARC_SUPABASE_ANON_KEY` | Live credentials. **The anon key is PUBLIC BY DESIGN** — security comes from Row Level Security policies. This is NOT a leaked secret. Do not "fix" it, do not move it to env vars, do not flag it as a vulnerability. |
| `worker.js` + `wrangler.jsonc` | This is the live server, not a reference copy. It deploys **only via wrangler / Workers Builds** (push to `main`) — **never** paste it into the Cloudflare dashboard code editor, which cannot handle Static Assets or Durable Object migrations. Changing `durable_objects` bindings or `migrations` tags can orphan stored state. |
| `grimoire` / `spellbook` variable names | **INVERTED relative to their UI labels** (see §5). Renaming touches hundreds of references AND breaks localStorage for existing users. Known, accepted debt. |
| All `arc-*` localStorage keys | Renaming any key silently wipes existing users' saved data. Full list in §7. |
| `.mode-hide`, `.std-only`, `data-std="…"` | The dual-mode system (§4). Removing any of these breaks one of the two modes. |
| `escH()` call sites | XSS protection at every user-input → `innerHTML` boundary. Never remove one "for readability." |
| `#ascension-nav` / `#menu-ascension` `display:none` | **Intentional.** This is a locked feature revealed only after first unlock. Not a bug. |
| `@media print` block | Scoped clean-PDF export for the master plan. |
| `@media (prefers-reduced-motion: reduce)` block | Accessibility support. |

**Also never:**
- Reformat, re-indent, minify, or beautify any part of the file
- Split the single file into modules
- Add a build step, bundler, linter, framework, or dependency
- Convert inline styles ↔ classes as "cleanup"
- Remove or disable a feature to fix a bug (ask first)
- Rewrite user-facing copy (it's written in the owner's voice deliberately)
- "Modernize" ES5-style JS
- Run `git push` or modify `.git`

---

## 4. THE DUAL-MODE SYSTEM (critical before any CSS work)

Two complete visual modes, driven by a `data-mode` attribute on the root `<html>` element:

| Mode | Attribute | Character |
|---|---|---|
| **Game** | `data-mode="game"` | Immersive: lore, map, pixel font (Press Start 2P), fantasy naming |
| **Planar** | `data-mode="standard"` | Clean: plain language, serif (Lora/Cormorant Garamond), no lore |

⚠️ **The internal attribute value is `"standard"`, but the user-facing name is "Planar."** Don't rename the attribute.

**Three mechanisms:**
1. `.mode-hide` → hidden when `data-mode="standard"` (game-only content)
2. `.std-only` → hidden when `data-mode="game"` (Planar-only content)
3. `data-std="replacement text"` → the element's `innerHTML` is swapped to the Planar wording when the mode flips. Original game HTML is cached in `data-game-cache` on first swap.

**Relevant functions:** `applyMode()`, `toggleMode()`, `isGameMode()`

**RULE: Every CSS or UI change must be verified in BOTH modes.** They share one stylesheet.

---

## 5. ⚠️ NAMING GOTCHAS — read before touching state

### The inverted lists (the #1 source of confusion)

| Code variable | localStorage key | Game-mode label | Planar label | What it actually is |
|---|---|---|---|---|
| `grimoire` | `arc-grimoire` | "Spellbook" | "Saved" | The **shortlist** — activities being considered, no commitment |
| `spellbook` | `arc-spellbook` | "Grimoire" | "Tracker" | The **committed tracker** — with `status`, `milestones`, `targetDate`, `priority`, `tags`, `userLink` |

**The variable names are backwards relative to their labels.** This is historical debt from a mid-project rename. `saveGrimoire()` saves the shortlist; `saveSpellbook()` saves the tracker. **Do not rename them.**

### Other naming notes
- **"The Ascension"** (Planar: "The Planner") is internally called **Part Two / phase two / secondsea**. Look for `enterPhaseTwo()`, `#secondsea-overlay`, `SS_SYSTEM`, `arc-phase`, `arc-p2-unlocked`.
- **"The Stacks"** = the marketplace/catalog page (`#page-marketplace`).
- **"The Quill"** = the user submission page (`#page-list`).
- **"Jebadias"** (Planar: "the Advisor") = the AI chat (`#page-jebadias`).
- **"Chamber"** = settings (`#page-settings`).

---

## 6. DATA SHAPES

### An EC (extracurricular) object — the core unit
```js
{
  id:        'r01',              // unique; batch prefixes x/y/z/w from later additions
  icon:      '🔬',
  name:      'Research Science Institute',
  cat:       'Research',         // one of 40 categories
  impact:    'National',         // Local | Regional | State | National | Global
  rarity:    'Legendary',        // Common | Rare | Epic | Legendary
  branches:  4.5,                // 🌿 difficulty      (number, 0–5, .5 steps)
  bones:     4.5,                // 🦴 time commitment (number, 0–5)
  mushrooms: 5,                  // 🍄 competitiveness (number, 0–5)
  time:      '6 wks summer',
  cost:      'Free + stipend',
  desc:      '…',                // summary
  what:      '…'                 // "what you'll actually do"
}
```
The fourth user-facing rating, **🔮 Essence** (overall value), is *derived* — see `getEssence()`.

### A tracker entry (in `spellbook`)
The full EC object **plus**: `status` (`'not-started'` | `'in-progress'` | `'done'`), `milestones[]`, `targetDate`, `priority`, `tags`, `userLink`.

### Lookups
```js
const ECS    = (typeof window.ECS_DB !== "undefined" && window.ECS_DB.length) ? window.ECS_DB : ECS_INLINE;
const EC_MAP = {};  // id → EC object, O(1) detail lookups
```
`window.ECS_DB` is a legacy external-data hook that is **never populated** — the app always falls back to `ECS_INLINE`. Leave the fallback in place.

---

## 7. localStorage KEYS (complete)

**Renaming any of these wipes user data silently.**

| Key | Holds |
|---|---|
| `arc-grimoire` | Shortlist (labeled "Spellbook"/"Saved") |
| `arc-spellbook` | Committed tracker (labeled "Grimoire"/"Tracker") |
| `arc-mode` | game / standard |
| `arc-theme` | dark / light |
| `arc-profile` | Signup profile: name, age, grade, goal |
| `arc-phase` | `'two'` when inside The Ascension |
| `arc-p2-unlocked` | `'1'` once The Ascension nav item is unlocked |
| `arc-p2-seen` | First-time Ascension welcome dismissed |
| `arc-onboarded` | Onboarding completed |
| `arc-persona` | Current Jebadias persona |
| `arc-pcounts` | Per-persona message counts |
| `arc-chat-*` | Chat history, per persona |
| `arc-fragments` | Discovered Chronicle fragments |
| `arc-badges` | Earned badges |
| `arc-streak`, `arc-streak-last` | Daily streak tracking |
| `arc-recent` | Recently viewed ECs |
| `arc-submissions` | User-submitted activities (Quill) |
| `arc-rev-*` | Per-EC user reviews |
| `arc-pref-*` | Quiz/preference answers |
| `arc-allunlocked` | Easter-egg flag |
| `arc-showprogress`, `arc-readaloud`, `arc-no-particles`, `arc-reduce-motion` | Settings toggles |
| `arc-bigtext` / `arc-large-text` | Large-text setting ⚠️ *possible duplicate — see §11* |
| `arc-contrast` / `arc-high-contrast` | High-contrast setting ⚠️ *possible duplicate — see §11* |

---

## 8. THE 15 PAGES

Each is a `<div class="page" id="page-…">`. `nav(id)` hides all and shows one — there is no router.

`page-home` · `page-marketplace` (The Stacks) · `page-ec-detail` · `page-jebadias` (AI advisor) · `page-spellbook` (shortlist) · `page-grimoire` (tracker) · `page-list` (The Quill / submissions) · `page-map` (Arcana, game-only) · `page-collections` (The Chronicle) · `page-codex` (guidelines) · `page-about` (The Origin) · `page-faq` (The Guide) · `page-contact` · `page-settings` (Chamber) · `page-menu` (mobile nav)

### The 15 overlays (full-screen layers, separate from pages)
`#auth-overlay` · `#secondsea-overlay` (The Ascension) · `#commonapp-overlay` · `#share-link-overlay` · `#shared-overlay` · `#explore-overlay` · `#insights-overlay` · `#chronicle-all-overlay` · `#compare-overlay` · `#timeline-overlay` · `#rarity-overlay` · `#quiz-overlay` · `#onboarding-overlay` · `#p2-detail-overlay` · `#jebmem-overlay` (Jeb memory)

Several set `document.body.style.overflow='hidden'` when open and must restore it on close. `closeTopOverlays()` handles escape behavior.

---

## 9. KEY FUNCTIONS BY SYSTEM

**Navigation & shell:** `nav(id)`, `navMob(id)`, `toggleDrawer()`, `closeDrawer()`, `applyMode()`, `toggleMode()`, `isGameMode()`, `applyTheme()`, `toggleTheme()`, `showNotif(msg)`, `closeTopOverlays()`

**Catalog:** `renderMarketplace()` ← the big one, `openEC()`, `openECById(id)`, `setFilter()`, `setSort()`, `setImpactFilter()`, `setRarityFilter()`, `ecMatch()`, `_ecNorm()`, `_lev1()` (fuzzy search), `renderSimilar()`, `surpriseEC()`, `renderEcOfDay()`, `pushRecent()`, `renderRecent()`

**Ratings & display:** `getEssence()`, `ratingsHtml()`, `ratingBar()`, `ratingDots()`, `branchHtml()`, `generateRatingChart()`

**Shortlist & tracker:** `toggleSpell()`, `saveGrimoire()`, `saveSpellbook()`, `renderGrimoire()`, `renderSpellbook()`, `castGrimoire()`, `cycleStatus()`, `addMilestone()`, `updateMilestone()`, `removeMilestone()`, `updateField()`, `updateTargetDate()`, `openEditModal()`, `saveEditModal()`, `exportGrimoire()`, `committedCount()`, `savedEcIds()`

**AI advisor:** `sendMsg()` (async), `buildJebSystem()`, `typeBubble()` (typewriter reveal), `appendBubble()`, `showTyping()`, `saveChat()`, `loadChat()`, `chatKey()`, `switchPersona()`, `checkPersonaUnlocks()`, `updateJebAvatar()`, `shareWithJebadias()`, `renderRecommendations()`

**The Ascension:** `enterPhaseTwo()`, `exitPhaseTwo()`, `renderPhaseTwo()`, `openP2Detail()` (async), `generateSecondSeaPlan()` (async), `ssRender()`, `ssMarkdown()`, `ssPortfolio()`, `copySecondSea()`, `printPlan()`, `updatePlanGate()`, `dismissP2Welcome()`

**Exports & sharing:** `openCommonApp()`, `caGenerate()` (async), `caType()`, `caTrim()`, `renderCA()`, `caCopyOne()`, `caCopyAll()`, `shareGrimoire()`, `checkSharedHash()`, `openSharedView()`, `copyECLink()`, `exportData()`

**Auth & cloud:** `openAuth()`, `closeAuth()`, `authSubmit()`, `authToggleMode()`, `authGoogle()`, `reflectAuthMode()`, `showAuthGreeting()`, `jebWelcome()` (async), `cloudSyncNow()`, plus the `ARC_CLOUD` object

**Submissions:** `submitListing()` (async), `moderateListing()` (async — AI moderation), `updateQuillPreview()`, `submitReview()`, `tryWriteReview()`, `seededReviews()`, `renderReviews()`

**World/lore (game mode):** `mapClick()`, `mapSearch()`, `discoverFragment()`, `getFragment()`, `showChronicle()`, `openChronicleReadAll()`, `renderCollections()`, `checkBadges()`, `renderBadges()`, `triggerEgg()`, `checkTypedEggs()`, `moonClick()`

**Onboarding & quiz:** `initOnboarding()`, `obStep()`, `closeOnboarding()`, `replayTour()`, `openQuiz()`, `quizNext()`, `quizBack()`, `quizPick()`, `quizRecs()`, `renderQuizResults()`, `addQuizRecsToGrimoire()`

**Accessibility & settings:** `applyA11y()`, `toggleBigText()`, `applyBigText()`, `toggleContrast()`, `applyContrast()`, `toggleReadAloud()`, `toggleReduceMotion()`, `toggleParticles()`, `wipeAllData()`, `updateSettingsDisplay()`

**Utilities:** `escH(s)` ← **XSS escape, always use for user text**, `hashStr(s)` (stable seeding), `clampR()`, `savePref()`

---

## 10. VERIFICATION — run these after ANY change

### 1. JS syntax check (extracts inline scripts, ignores `src=` tags)
```bash
python3 -c "
import re
h=open('public/index.html',encoding='utf-8').read()
b=re.findall(r'<script(?![^>]*\b(?:src=|type=["\']application/ld\+json))[^>]*>(.*?)</script>',h,re.S)
open('/tmp/_check.js','w').write('\n;\n'.join(b))
" && node --check /tmp/_check.js && echo "JS SYNTAX OK"
```

### 2. Dangling handler audit (catches `onclick` → undefined function)
```bash
python3 - <<'EOF'
import re
h=open('public/index.html',encoding='utf-8').read()
js='\n'.join(re.findall(r'<script(?![^>]*\b(?:src=|type=["\']application/ld\+json))[^>]*>(.*?)</script>',h,re.S))
defs=set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js))
defs|=set(re.findall(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()',js))
defs|=set(re.findall(r'window\.([A-Za-z_$][\w$]*)\s*=',js))
bi={'if','for','while','return','typeof','new','this','setTimeout','JSON','Math','Object','Array',
    'parseInt','URL','getAttribute','getElementById','toggle','print','add','remove','classList',
    'split','forEach','querySelectorAll','matchMedia','select'}
handlers=re.findall(r'on(?:click|input|change|submit|keydown|keyup|mouseover)\s*=\s*"([^"]+)"',h)
called=set(m for hd in handlers for m in re.findall(r'(?<![.\w])([A-Za-z_$][\w$]*)\s*\(',hd))
missing=sorted(c for c in called if c not in defs and c not in bi)
print("DANGLING HANDLERS:", missing if missing else "NONE ✓")
EOF
```

### 3. Critical-value integrity
```bash
grep -c "location.protocol" public/index.html    # API_URL still same-origin, ≥1
grep -c "claude-sonnet-5" public/index.html      # must be 7
grep -c "claude-sonnet-5" worker.js              # must be 2
grep -c "id:'" public/index.html                 # catalog intact
```

### 3b. Live deploy check (after a push — Workers Builds takes ~1 min)
```bash
URL=https://arcanum.its-the-prithivi-show.workers.dev
curl -s "$URL" | shasum                                 # compare to: shasum public/index.html
curl -s -X POST "$URL/api/presence" -d '{"vid":"x"}'    # -> {"live":..,"total":..}
```
Identical hashes mean the repo and the live Worker are byte-for-byte in sync.

### 4. Manual checklist (no substitute for this)
- [ ] Both modes: game **and** Planar
- [ ] Both themes: dark **and** light
- [ ] Mobile widths: 375px, 414px, 768px
- [ ] Marketplace filters + search still work
- [ ] Jebadias returns a reply (live API call)
- [ ] Overlays open **and** close, and restore body scroll

> **These automated checks prove the code parses and wires up. They do NOT prove it looks right.** Visual/layout bugs have slipped through them before — the mobile layout bug is exactly that class. Always eyeball changes in a browser.

---

## 11. KNOWN TECHNICAL DEBT & QUIRKS

Documented so they aren't "discovered" and mistakenly fixed:

1. **`grimoire`/`spellbook` inverted naming** — see §5. Intentional. Leave alone.
2. **`window.ECS_DB` never populated** — a legacy external-data hook. The original `arcanum-data.js` had a syntax error and never parsed; the app silently ran on the inline fallback. The dead file was removed. **Keep the fallback expression** — it's harmless and defensive.
3. **Possible duplicate localStorage keys** ⚠️ — recon shows both `arc-bigtext` **and** `arc-large-text`, plus `arc-contrast` **and** `arc-high-contrast`. Likewise duplicate-looking functions: `toggleBigText()`/`toggleLargeText()` and `toggleContrast()`/`toggleHighContrast()`. **Investigate and REPORT — do not unilaterally remove.** One pair may be dead code, or both may be wired to different UI. Removing the wrong one breaks a setting.
4. **Five `<style>` blocks** (lines 46, 1044, 2644, 2940, 3608) — later blocks and inline scoped fixes can override earlier ones. Check cascade order before adding CSS.
5. **CSS specificity trap** — responsive `@media` queries live early (in the main stylesheet, lines 46–1042), but the `[data-mode="standard"]` Planar overrides live in the *later* `#mode-standard-css` block (1044–1578) and lean on `!important`. Because `!important` beats non-`!important` regardless of media query, Planar-mode rules can override mobile breakpoints. **This was the root cause of a past mobile layout bug.** New mobile rules must be scoped and specific enough to win.
6. **Generic error handling** — `sendMsg()`'s `catch` swallows every exception into one message ("connection unstable"), whether the cause is a network failure, a bad URL, or an API error. This masked a real outage. An improvement would be surfacing `data.error.message`.
7. ~~**Permissive Worker**~~ — **FIXED (security review, Bite 2).** The Worker now pins the model server-side, `403`s cross-origin browser requests, rate-limits per IP via the `RateLimiter` DO (15/min, 120/hr), and caps input (≤40 msgs, ≤8k chars, `max_tokens` ≤1500). Remaining gap: no CSP header yet — see `progress.md` action items.
8. **Sample reviews are AI-generated** — labeled as samples in the UI, disclosed on the About page. Not real student data. This is intentional and honestly disclosed; do not present them as real.

---

## 12. DEPLOYMENT

**Everything deploys the same way: commit + push to `main`.** Cloudflare **Workers Builds** then runs `npx wrangler deploy`, which ships `public/index.html`, `worker.js`, and `wrangler.jsonc` together as the one `arcanum` Worker. There is no second place to deploy.

- **`public/index.html`** → push to `main`. (Note the `public/` prefix — only that directory is served publicly, so repo source, git history, and docs can never leak as static assets.)
- **`worker.js` / `wrangler.jsonc`** → push to `main`. **Never** paste into the Cloudflare dashboard code editor — it cannot handle Static Assets or Durable Object migrations and will break the deploy.
- **Manual deploy** (if Workers Builds is down): `npx wrangler deploy` from the repo root, after `wrangler login` once.
- **Supabase schema** — already applied. Do not re-run schema SQL.

**Verifying a deploy:**
```bash
URL=https://arcanum.its-the-prithivi-show.workers.dev
curl -s "$URL" | shasum ; shasum public/index.html      # hashes must match
curl -s -X POST "$URL/api/presence" -d '{"vid":"x"}'    # -> {"live":..,"total":..}
```
Cross-origin browser requests to the advisor return **`403` by design** (origin lock), and the advisor is POST-only — neither is a bug.

---

## 13. WORKING PREFERENCES

- **Report before acting.** Findings, bugs, and improvement ideas go in a written report for the owner to approve. Don't fix beyond the stated scope.
- **Ask when ambiguous.** If there are two reasonable approaches, ask rather than choose.
- **Smallest viable diff.** Add rules rather than rewriting them where possible.
- **Comment new changes** so they're findable later, e.g. `/* mobile fix: Planar text scaling */`.
- **Prioritize findings** as: critical → important → nice-to-have.
- **Be honest about weaknesses.** The owner explicitly prefers hearing problems from you rather than from a competition judge.
- **The app is feature-dense on purpose.** Suggesting consolidation is welcome; unilaterally removing features is not.

**When in doubt: stop and ask. Restoring a backup costs far more than a question.**

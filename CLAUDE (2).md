# CLAUDE.md — Arcanum

> Persistent project context. Read this fully before touching anything.

---

## ⚠️ READ FIRST — THE ONE-PARAGRAPH BRIEFING

Arcanum is a **finished, live, deployed application** built solo by a high school sophomore. It is the submission for the **2026 Congressional App Challenge (deadline: Oct 26, 2026)** and a centerpiece of an NCSSM application. The entire app is **one 1.9 MB HTML file with 12,109 lines**. It works. **The default action is to report, not to change.** Make the smallest possible change that solves the stated problem, never refactor, never reformat, and always ask before doing anything not explicitly requested.

**Before any edit session: ensure the working tree is committed so changes are revertible.**

---

## 1. WHAT THIS APP IS

**Arcanum** helps high school students plan their extracurricular activities. Three core pillars:

1. **The catalog** — 3,208 activities, each rated on four dimensions, filterable and searchable.
2. **The AI advisor ("Jebadias")** — reads the student's situation and produces personalized guidance and full strategic plans.
3. **The tracker** — students commit to activities, track status/milestones/deadlines, and export to Common App format.

**Live:** https://arcanum-ec.netlify.app
**Repo:** `privi-doughnut/Arcanum` → Netlify auto-deploys on push to `main`.

The app has a **fantasy skin** ("game mode") that can be toggled off for a clean "**Planar**" mode. This is deliberate: the fantasy layer makes an intimidating process approachable for younger students; the toggle serves everyone else. Both modes expose identical functionality.

---

## 2. ARCHITECTURE

```
index.html  (1.9 MB, 12,109 lines)  ← THE ENTIRE APP
├── <script>  line 9–29        · mobile arrow-reset handler (tiny)
├── <style>   line 32–1019     · MAIN STYLESHEET (all base + responsive CSS)
├── <style>   line ~1020–1225  · continued styles (mode overrides, Planar skin)
├── <body>    line 1226
│   ├── <style> line 2252      · inline scoped fix (#page-contact mobile)
│   ├── <style> line 2686      · scoped block
│   ├── <style> line 3354      · scoped block
│   └── ...all 15 pages as <div class="page"> …
└── <script>   line 5427–12087 · ALL APPLICATION LOGIC
    ├── const API_URL         line ~5429
    ├── const ECS_INLINE = [  line 5692   ← 3,208 objects, the bulk of the file
    └── const ECS = …         line 8907
worker.js   (~90 lines)  ← Cloudflare Worker, DEPLOYED SEPARATELY
```

**Stack:** Vanilla HTML/CSS/JS. **No framework, no build step, no router, no bundler, no npm, no dependencies.** This is a deliberate architectural decision that must be defensible to judges — do not introduce tooling.

**Hosting:** Netlify (static, auto-deploy from GitHub).

**Two external services:**
- **Cloudflare Worker** — proxies all AI calls so the Anthropic API key never reaches the browser. Deployed at `arcanum-api-proxy.its-the-prithivi-show.workers.dev`. Key stored as encrypted Cloudflare secret `ARCANUM_ANTHROPIC_KEY`.
- **Supabase** — optional accounts + cross-device sync. Tables: `profiles`, `user_state`, `submissions`, `ravens`. Protected by Row Level Security.

---

## 3. 🚫 DO NOT TOUCH — HARD CONSTRAINTS

Breaking any of these takes down the live app or destroys user data.

| Item | Why it's untouchable |
|---|---|
| `const API_URL = 'https://arcanum-api-proxy.its-the-prithivi-show.workers.dev'` | Live Worker URL. A wrong value silently kills the AI advisor with a misleading "connection unstable" error. This has already happened once. |
| `claude-sonnet-5` (6 refs in index.html, 1 in worker.js) | Current model. The previous model was deprecated by Anthropic mid-project and took the app down. Do not "update" or guess at model strings. |
| `ECS_INLINE` array (lines 5692–8906) | The entire 3,208-activity catalog. **Never** reformat, sort, prettify, minify, deduplicate, or "optimize" it. |
| `ARC_SUPABASE_URL` / `ARC_SUPABASE_ANON_KEY` | Live credentials. **The anon key is PUBLIC BY DESIGN** — security comes from Row Level Security policies. This is NOT a leaked secret. Do not "fix" it, do not move it to env vars, do not flag it as a vulnerability. |
| `worker.js` | Deployed separately via the Cloudflare dashboard. Editing the local file changes nothing until manually redeployed. Do not assume local edits take effect. |
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

### The 14 overlays (full-screen layers, separate from pages)
`#auth-overlay` · `#secondsea-overlay` (The Ascension) · `#commonapp-overlay` · `#share-link-overlay` · `#shared-overlay` · `#explore-overlay` · `#insights-overlay` · `#chronicle-all-overlay` · `#compare-overlay` · `#timeline-overlay` · `#rarity-overlay` · `#quiz-overlay` · `#onboarding-overlay` · `#p2-detail-overlay`

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
h=open('index.html',encoding='utf-8').read()
b=re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',h,re.S)
open('/tmp/_check.js','w').write('\n;\n'.join(b))
" && node --check /tmp/_check.js && echo "JS SYNTAX OK"
```

### 2. Dangling handler audit (catches `onclick` → undefined function)
```bash
python3 - <<'EOF'
import re
h=open('index.html',encoding='utf-8').read()
js='\n'.join(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',h,re.S))
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
grep -c "arcanum-api-proxy.its-the-prithivi-show.workers.dev" index.html   # must be ≥1
grep -c "claude-sonnet-5" index.html                                       # must be 6
grep -c "id:'" index.html                                                  # catalog intact
```

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
4. **Multiple `<style>` blocks** (lines 32, 2252, 2686, 3354) — later blocks and inline scoped fixes can override earlier ones. Check cascade order before adding CSS.
5. **CSS specificity trap** — responsive `@media` queries live early (lines ~84–921), but `[data-mode="standard"]` overrides were added later (~1084+) with `!important`. Because `!important` beats non-`!important` regardless of media query, Planar-mode rules can override mobile breakpoints. **This is the root cause of a known mobile layout bug.** New mobile rules must be scoped and specific enough to win.
6. **Generic error handling** — `sendMsg()`'s `catch` swallows every exception into one message ("connection unstable"), whether the cause is a network failure, a bad URL, or an API error. This masked a real outage. An improvement would be surfacing `data.error.message`.
7. **Permissive Worker** — the proxy accepts any POST. The key stays safe server-side, but there is no rate limiting. Known and accepted for a student project.
8. **Sample reviews are AI-generated** — labeled as samples in the UI, disclosed on the About page. Not real student data. This is intentional and honestly disclosed; do not present them as real.

---

## 12. DEPLOYMENT

- **`index.html`** → commit + push to GitHub → **Netlify auto-deploys**. This is the only file that needs pushing for app changes.
- **`worker.js`** → **must be manually pasted into the Cloudflare dashboard and deployed.** Local edits have zero effect otherwise. The repo copy is a reference (and a visible artifact for judges — it demonstrates the secure key-proxy pattern).
- **Supabase schema** — already applied. Do not re-run schema SQL.

**Verifying a Worker deploy** — a POST with no `model` field returns the Worker's fallback default:
```bash
curl -s -X POST "https://arcanum-api-proxy.its-the-prithivi-show.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"max_tokens":25,"messages":[{"role":"user","content":"hi"}]}'
```
A **GET** to that URL returns `{"error":"Method not allowed. Use POST."}` — **that is correct behavior**, not a bug. The Worker is POST-only by design.

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

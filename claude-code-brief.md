# ARCANUM — Claude Code Working Brief

> **Paste this whole document into Claude Code before doing anything else.**

---

## 0. READ THIS FIRST — HOW I WANT YOU TO WORK

**You are working on a live, finished, deployed application. It works. Do not break it.**

This app is a **single 1.9 MB HTML file (12,109 lines)** that took months to build. It is currently deployed and functioning at https://arcanum-ec.netlify.app. It is my submission for the **2026 Congressional App Challenge (deadline Oct 26)**, and it is the centerpiece of my application to NCSSM. The stakes are real.

**Your rules of engagement:**

1. **REPORT BEFORE YOU ACT.** Do not make changes beyond the explicitly scoped task in §3. If you find bugs, problems, or improvement opportunities — **write them down and show me. Do not fix them without asking.** I will decide what gets fixed.
2. **Ask before anything ambiguous.** If a fix could be done two ways, ask me. Don't pick for me.
3. **Never refactor, reformat, prettify, reorganize, or "clean up" anything.** Not the CSS, not the JS, not the HTML. Not even a little. A reformat of a 12,000-line file produces a diff I cannot review, and I would have to throw it away.
4. **Never split the file into modules.** Single-file is a deliberate architectural decision, not an accident. I have to defend it to judges.
5. **Never delete or disable a feature** to fix a bug. Ask me first.
6. **Make the smallest possible change** that solves the problem. Surgical, not sweeping.
7. **Do not add dependencies, build steps, frameworks, or tooling.** There are none, on purpose.
8. **Verify before you finish.** After changes, confirm the JS still parses and no functions referenced by `onclick` handlers went missing.

**Before you start: `git commit` the current state so everything is revertible.**

---

## 1. FULL APP OVERVIEW — what you're working on

### What it is
**Arcanum** is a web app that helps high school students plan their extracurricular activities. It's a searchable catalog of **3,208 activities**, each rated on four dimensions, plus an **AI advisor** that builds personalized plans, plus a **tracker** that follows the student to application season. Built solo by a high school sophomore.

### Architecture (know this before touching anything)
- **One file:** `index.html`, ~1.9 MB, 12,109 lines. Contains ALL CSS (one `<style>` block), ALL HTML, and ALL JavaScript (inline `<script>` blocks).
- **No framework, no build step, no router, no dependencies, no package.json.** Vanilla HTML/CSS/JS.
- **Hosting:** Netlify, auto-deploys on push to GitHub.
- **Two external backends:**
  - **Cloudflare Worker** (`worker.js` in repo, deployed separately at `arcanum-api-proxy.its-the-prithivi-show.workers.dev`) — proxies AI calls so the Anthropic API key is never in the client. The key is an encrypted Cloudflare secret named `ARCANUM_ANTHROPIC_KEY`.
  - **Supabase** — optional accounts + cross-device sync. 4 tables: `profiles`, `user_state`, `submissions`, `ravens`. The anon key in the client is public by design; Row Level Security protects the data.
- **AI model:** `claude-sonnet-5` (6 references in `index.html`, 1 in `worker.js`).

### Core systems
| System | Key names |
|---|---|
| **Catalog** | `ECS_INLINE` (3,208-object array), `ECS`, `EC_MAP` (id→object, O(1) lookup), `renderMarketplace()` |
| **Navigation** | `nav(id)` shows one `<div class="page">`, hides the rest. 13 pages. Mobile uses `#page-menu` via `toggleDrawer()` |
| **Saved list** | Code variable `grimoire` — **user-facing "Spellbook" (game) / "Saved" (Planar)**. localStorage `arc-grimoire` |
| **Tracker** | Code variable `spellbook` — **user-facing "Grimoire" (game) / "Tracker" (Planar)**. localStorage `arc-spellbook` |
| **AI advisor** | `sendMsg()`, `buildJebSystem()`, `typeBubble()`, `chatHistory`, `API_URL`, 9 personas |
| **The Ascension** | `enterPhaseTwo()` / `exitPhaseTwo()`, `#secondsea-overlay`, `SS_SYSTEM` prompt, unlock flag `arc-p2-unlocked` |
| **Exports** | `openCommonApp()` (Common App entries), `shareGrimoire()` (URL-encoded share link), `printPlan()` |
| **Search** | `ecMatch()`, `_ecNorm()`, `_lev1()` (typo tolerance) |
| **Helpers** | `escH()` (XSS escape), `hashStr()`, `showNotif()` |

> ⚠️ **The `grimoire` / `spellbook` variable names are INVERTED relative to their user-facing labels.** This is known technical debt from a mid-project rename. **DO NOT "fix" this.** Renaming them would touch hundreds of references and break localStorage keys for existing users. Leave it alone.

### The dual-mode system (critical to understand before touching CSS)
The app has **two complete visual modes**, toggled by a `data-mode` attribute on the root `<html>` element:
- `data-mode="game"` — immersive: lore, map, pixel fonts (Press Start 2P), fantasy naming
- `data-mode="standard"` — clean "**Planar**" mode: plain language, serif fonts (Lora/Cormorant), no lore

Three mechanisms drive it:
- `.mode-hide` → hidden when `data-mode="standard"` (game-only content)
- `.std-only` → hidden when `data-mode="game"` (Planar-only content)
- `data-std="替代 text"` on an element → its innerHTML is swapped to the Planar wording when the mode flips (see the swap loop in the JS)

**Every CSS change must be checked in BOTH modes.** They share one stylesheet.

### The 14 overlays (full-screen layers)
`#auth-overlay`, `#secondsea-overlay`, `#commonapp-overlay`, `#share-link-overlay`, `#shared-overlay`, `#explore-overlay`, `#insights-overlay`, `#chronicle-all-overlay`, `#compare-overlay`, `#timeline-overlay`, `#rarity-overlay`, `#quiz-overlay`, `#onboarding-overlay`, `#p2-detail-overlay`

Several set `document.body.style.overflow='hidden'` while open and restore it on close.

---

## 2. THE BUG — mobile UI is broken

**Symptom:** the mobile layout is visibly broken. (I'll show you screenshots — ask me for them if I haven't provided them.)

### My leading diagnosis — verify this first
There is a **CSS specificity + `!important` conflict** that likely prevents the app from responding to mobile breakpoints in Planar mode.

- All the **responsive media queries** live early in the stylesheet — roughly **lines 84–921**:
  - `@media(max-width:900px)` → nav collapses to hamburger
  - `@media(max-width:720px)` → `.ec-detail-wrap`, `.jeb-layout` go single-column
  - `@media(max-width:600px)` → `.why-grid`, `.egg-grid`, `.jeb-spot-inner`, testimonial arrows
  - `@media(max-width:480px)` → `.ec-rating-chart-wrap`
- The **Planar-mode overrides** were added later, around **lines 1084–1200+**, and many use `!important`:
  ```css
  [data-mode="standard"] body{ font-family:'Lora',Georgia,serif; font-size:17px; line-height:1.75; }
  [data-mode="standard"] p,
  [data-mode="standard"] .feat-desc,
  [data-mode="standard"] .how-item-desc,
  [data-mode="standard"] .faq-a p,
  [data-mode="standard"] .page-banner-sub,
  [data-mode="standard"] .home-what-text { font-size:16px !important; line-height:1.8 !important; }
  [data-mode="standard"] .home-tagline{ font-size:18px !important; }
  [data-mode="standard"] .feat-title{ font-size:18px !important; }
  [data-mode="standard"] .faq-q{ font-size:16px !important; }
  ```
**Why this breaks mobile:**
1. `!important` beats a non-`!important` rule **regardless of media query** — media queries do not add specificity.
2. `[data-mode="standard"] p` has specificity (0,2,0) and beats a bare `p` (0,1,0) inside `@media`.
3. **Result:** in Planar mode, text sizes are effectively locked and cannot scale down on small screens. Desktop-tuned sizing is forced onto a phone → overflow, wrapping failures, blown-out layout.

**Likely correct fix (propose it to me before implementing):** add mobile-scoped Planar overrides *after* the existing rules, at matching-or-higher specificity with `!important` where required, e.g.:
```css
@media(max-width:600px){
  [data-mode="standard"] p, [data-mode="standard"] .feat-desc /* …etc… */ { font-size:15px !important; line-height:1.7 !important; }
  [data-mode="standard"] .home-tagline{ font-size:16px !important; }
}
```
**Do not simply strip the `!important` flags** without checking what they were overriding — they exist because game-mode base rules would otherwise win.

### Secondary suspects — investigate and report
1. **Game-mode homepage sections ported into Planar mode.** The testimonial carousel, featured ECs, "Different by Design" grid, page directory, and category showcase were originally game-mode-only and were later made visible in Planar. They were **never tested in Planar on mobile**.
2. **The `#home-extra` block** — shown/hidden via JS (`homeExtra.style.display`) on the home page; contains most of those ported sections.
3. **The new overlays on small viewports:** `#auth-overlay` (a full-page form), `#commonapp-overlay`, `#share-link-overlay`, `#shared-overlay`. Newer, less mobile-tested.
4. **The nav.** Breakpoint is `@media(max-width:900px)`. Desktop nav (`.nav-links`) now has ~12 items including a conditionally-shown `#ascension-nav`. Mobile menu is the `#page-menu` page, which has a matching `#menu-ascension` item.
5. **Long unbroken strings / fixed widths** anywhere causing horizontal scroll.

---

## 3. YOUR SCOPED TASK

### Phase 1 — INVESTIGATE AND REPORT (do this first, change nothing)
1. Read the file and confirm/refute my specificity diagnosis above.
2. Identify every distinct mobile layout problem you can find. Test/reason through **both** `data-mode="game"` and `data-mode="standard"` at ~375px, ~414px, and ~768px widths.
3. **Report back to me with:**
   - What's actually broken, and the root cause of each
   - Your proposed fix for each, with the exact CSS you'd add
   - Anything you're unsure about
4. **Wait for my approval before changing anything.**

### Phase 2 — FIX (only what I approve)
- **CSS / responsive changes only.**
- **Add** new rules; avoid rewriting existing ones unless I approve it.
- Keep changes grouped and clearly commented so I can find them later (e.g. `/* mobile fix: Planar text scaling */`).
- Re-verify both modes after each change.

---

## 4. HARD CONSTRAINTS — DO NOT TOUCH

**Breaking any of these breaks the live app or my ability to defend it to judges.**

| Never touch | Why |
|---|---|
| `const API_URL = 'https://arcanum-api-proxy.its-the-prithivi-show.workers.dev'` | Live Worker URL. A wrong URL silently kills the AI advisor. |
| `claude-sonnet-5` (6 refs in index.html, 1 in worker.js) | Current model. The previous one was deprecated and took the app down. |
| The `ECS_INLINE` array (3,208 objects, the bulk of the file) | The entire catalog. Do not reformat, sort, prettify, or "optimize" it. |
| Supabase URL + anon key in `ARC_CLOUD` config | Live credentials. Anon key is public **by design** — this is not a security bug, don't "fix" it. |
| `worker.js` | Deployed separately to Cloudflare. Changing the local file does nothing unless redeployed. |
| `grimoire` / `spellbook` variable names | Inverted vs. their labels on purpose (known debt). Renaming breaks localStorage for existing users. |
| localStorage key names (`arc-grimoire`, `arc-spellbook`, `arc-phase`, `arc-p2-unlocked`, `arc-profile`, `arc-contrast`, `arc-fragments`, etc.) | Renaming silently wipes existing users' saved data. |
| Any `.mode-hide` / `.std-only` / `data-std` attribute | The dual-mode system. Removing them breaks one mode. |
| The `escH()` calls | XSS protection at every user-input → innerHTML boundary. |
| `#ascension-nav` / `#menu-ascension` `display:none` defaults | Intentional — it's a locked feature revealed on unlock. Not a bug. |
| The `@media print` block | Scoped clean-PDF export for the master plan. |
| The `@media (prefers-reduced-motion: reduce)` block | Accessibility. |

**Also do not:**
- Reformat, re-indent, minify, or beautify **any** part of the file
- Convert inline styles to classes (or vice versa) as "cleanup"
- Add a build step, bundler, linter config, framework, or npm dependency
- Split into multiple files
- Remove features, sections, or pages
- Change copy/wording (it's written in my voice on purpose)
- "Modernize" the JS (it's intentionally ES5-flavored in places)
- Touch `.git` or push anything

---

## 5. WHAT I ALSO WANT FROM YOU — a full audit (REPORT ONLY, FIX NOTHING)

Separate from the mobile fix, I want your **holistic read on the app**. Explore it fully, then give me a written report. **Do not implement any of it.** I want to see the list and decide.

Please cover:

**A. Bugs & risks**
- Any actual bugs: JS errors, dead handlers, functions referenced but undefined, unreachable code, broken flows
- Anything that will break under real use (empty states, first-run, no-JS-state, error paths)
- Anything mode-specific that's broken in one mode but not the other
- Performance concerns at 3,208 items on a phone
- Anything that would embarrass me in front of a judge

**B. UX improvements**
- Where the experience is confusing, cluttered, or unclear
- The app is **feature-dense on purpose** — but tell me honestly where it's too much
- Anything that would make a first-time user bounce
- Accessibility gaps (focus states, tap targets, contrast, screen readers)

**C. Holistic overview**
- Your read on the app's capabilities as they stand
- What's genuinely strong
- What's the weakest link
- Rank everything you find: **critical → important → nice-to-have**

**Format:** a clear written report. Prioritized. Specific (file locations / function names). Honest — I'd rather hear it from you than from a judge.

---

## 6. SUCCESS CRITERIA

You're done when:
1. ✅ You've reported findings and I've approved a plan **before** you changed anything
2. ✅ Mobile layout works in **both** modes at phone widths
3. ✅ Desktop is **unchanged**
4. ✅ The JS still parses; no handler references a missing function
5. ✅ The AI advisor still works (URL + model untouched)
6. ✅ The diff is small, readable, and scoped to what I approved
7. ✅ I have your full audit report in hand

---

## 7. CONTEXT THAT MIGHT HELP

- The app has been verified for JS syntax and dangling `onclick` handlers repeatedly. **Those checks pass.** What was never possible to verify without a browser is *visual* correctness — which is exactly why the mobile bug survived.
- Recent changes that most likely caused this (in rough order): the Planar-mode font/readability pass (the `!important` block), porting game-homepage sections into Planar mode, and adding several new full-screen overlays.
- If something looks strange but deliberate — it probably is. **Ask before "fixing" it.**

**When in doubt: stop and ask. I would much rather answer a question than restore a backup.**

# ARCANUM — Privi's guide to adding real code yourself

No deadline pressure on this one — do it at your own pace. The point isn't speed, it's being
able to say truthfully "I wrote this part" instead of "Claude wrote all of it but I directed
everything." Both are honest and both are fine to say, but the first is a stronger line in an
application, and you've done this before with Plainscript.

<details>
<summary>📖 How this guide works, setup, and ground rules (click to expand)</summary>

## How this guide works

Every task has the same shape: **Goal** (what changes, in plain terms), **Find it** (the exact
text to Cmd+F for in `public/index.html`), **Example** (a closely related pattern that already
works somewhere in the file, so you can see the shape before writing your own), **Hint** (only
read if you're stuck), and **Check + Commit**.

Nothing here is made up to give you busywork — every task below is something that was actually
missing, actually broken, or actually incomplete when I handed this to you.

## Setup — every time you sit down

**A.** Terminal → `cd ~/Arcanum`.
**B.** Open the file in an editor you can save plain text with — VS Code is fine
(`open -a "Visual Studio Code" public/index.html`). Avoid an editor with built-in AI
autocomplete turned on for this file — if it writes the line for you, it's not yours to claim.
**C.** To see your change: open `public/index.html` directly in a browser (double-click it, or
`open public/index.html`). Everything works client-side except the AI advisor and the live
visitor stuff, which need the real deployed Worker — for anything you're doing below, the local
file is enough.
**D.** Before you start, run the syntax check so you know what "clean" looks like:
```sh
python3 -c "
import re
h=open('public/index.html',encoding='utf-8').read()
b=re.findall(r'<script(?![^>]*\b(?:src=|type=[\"\x27]application/ld\+json))[^>]*>(.*?)</script>',h,re.S)
open('/tmp/_check.js','w').write('\n;\n'.join(b))
" && node --check /tmp/_check.js && echo "JS SYNTAX OK"
```
(If this errors on something like `?.` with "Unexpected token", that's your local Node being
old, not your code — ignore it, it's a known thing, mentioned in `CLAUDE.md` §10.)
**E.** One change → save → refresh the browser tab → look → re-run the syntax check → still OK?
**F.** Save it:
```sh
git add public/index.html
git commit -m "describe this specific change"
git push origin main
```
**Made a mess?** `git checkout public/index.html` undoes everything since your last commit —
you can't break what's already pushed.
**Page blank or broken after a change?** Open the browser console (Cmd+Option+I → Console),
screenshot the red error line, and send it to me — I'll help you read it, not fix it for you.

## Ground rules (same as always, from CLAUDE.md)

- Never touch `ECS_INLINE` (the catalog), the pinned model string, `API_URL`, or the
  `grimoire`/`spellbook` variable names — see CLAUDE.md §3 if you forget why.
- Game mode is currently hidden from real users (your call, documented in CLAUDE.md §4) — but
  its code is very much alive, and it's now genuinely the *safest* place in the whole app to
  practice: nothing you touch there can be seen by a real visitor unless you unlock it yourself
  (type `sanctum` anywhere outside a text box).
- When your AI disclosure gets written, "with step-by-step guidance" is honest and fine to say
  for anything you needed a Hint for. Only "entirely alone" would be inaccurate if you used one.

</details>

---

# ✅ ALREADY DONE (by me, this session — for your disclosure's accuracy)

Everything currently in `public/index.html` and `CLAUDE.md` as of this guide's creation was
written by Claude, directed by you: the full accessibility pass (keyboard support, ARIA,
contrast), the performance pass (LCP/CLS fixes), ~10 mode-label bugs, hiding Game mode behind a
secret unlock, the Jebadias dialogue-hint change, removing the visitor-count pill, the new
Privacy/Terms/AI-Disclosure page and footer, the Planar background texture, and the Marketplace
layout bug fix. None of that is yours to claim as "I wrote the code" — it's accurately described
as "I directed every decision, reviewed everything, and made the safety calls," which is also a
real and valuable thing to say, just a different claim than "I wrote it."

Everything below this line is unclaimed. It's yours if you want it.

---

# 📋 WHAT'S LEFT

## Task 1 — Writing (no code, your words, your voice)

**Goal:** The About page doesn't have a personal "why I built this" / "who made this" section
yet the way Plainscript's README does. Judges respond to this — it's the thing that makes a
project a person's project instead of a spec someone executed.

**Find it:** Cmd+F for `THE PROBLEM` — that's the first card in the About page
(`id="page-about"`). Your new card goes right after the existing cards in that same grid.

**Example:** Look at the existing `THE PROBLEM` / `THE SOLUTION` cards right above it — same
`<div style="background:var(--card);border:1px solid var(--border);padding:20px">` wrapper, same
small label + paragraph structure.

**What to write:** Just talk it out loud to yourself or to me first, then I'll help you trim it
to length without changing what you said — same thing we did for Plainscript's Task 10. Cover
whatever's true for you: why extracurricular planning specifically, what you noticed that bugged
you, what you want a student using this to walk away with.

**Check + Commit:** Load it in the browser, read it back once as if you were a stranger. Commit
as `About: add "who made this" section`.

---

## Task 2 — Content (real judgment calls, bounded scope)

**Goal:** EC detail pages show a short "what admissions readers look for" tip, but it's keyed by
category, and **20 of the 40 real categories fall back to a generic tip** because nobody's
written one for them yet. Pick 4-6 you actually know something about (from your own research,
things friends have done, whatever) and write real ones.

**Find it:** Cmd+F for `var tmap=`. You'll see ~20 categories already have a one-sentence tip —
`'research': 'If it is mentor- or lab-based...'` etc. Missing ones (no entry at all right now):
`agriculture, architecture, astronomy, aviation, criminal justice, culinary, dance, debate,
design, fashion, gaming, international, linguistics, marine science, philosophy, politics,
public health, real estate, service, veterinary`.

**Example:** Every existing entry is the same shape: one sentence, specific, a little blunt,
telling the student what actually distinguishes a strong application in that category — not
generic encouragement. Read 3-4 of the existing ones before writing your own; match that voice.

**Hint:** A tip is bad if it could apply to literally any category ("work hard and be genuine").
A tip is good if it names a specific, checkable thing a strong application in THAT category has
that a weak one doesn't (the Research one's distinguishing test: can you name a real question
you investigated, or not).

**Check + Commit:** Open an EC with one of your newly-covered categories, confirm your tip shows
on its detail page. Commit as `EC tips: add N categories (list them)`.

---

## Task 3 — Real bug fix (CSS, small, scoped)

**Goal:** When "big text" accessibility mode is on (Settings → Accessibility), the whole page
zooms to 128%. At that zoom, the top nav bar's items can run out of room and wrap or get
clipped — found during this session's QA pass, never fixed (low priority, but real).

**Find it:** Cmd+F for `function applyBigText`. Right now it only does
`document.body.style.zoom = bigText ? '1.28' : '1.12';` — nothing else. There's no CSS hook for
"big text is currently on" because nothing sets a class or attribute for it.

**Example:** Look at how `applyContrast()` (right near `applyBigText`) sets a real attribute —
`document.documentElement.setAttribute('data-contrast', hiContrast?'high':'');` — which is what
lets `[data-contrast="high"]` CSS rules exist. You're doing the same pattern for big-text.

**Hint:** Two parts. (1) In `applyBigText()`, add a line setting
`document.documentElement.setAttribute('data-bigtext', bigText?'1':'')` right next to the zoom
line. (2) Add a new CSS rule — somewhere near the other `.nav-link` rules — scoped to
`html[data-bigtext="1"] .nav-link` that shrinks the nav's font-size or padding slightly so 14
items still fit at the larger effective zoom. You'll need to actually turn big-text on and look
at the nav to judge how much smaller it needs to be — there's no single right number, that's the
judgment call that makes this yours.

**Check + Commit:** Toggle big-text on/off a few times, confirm the nav never wraps/clips at
either setting, confirm it still looks normal with big-text off. Commit as
`Fix nav overflow at big-text zoom`.

---

## Task 4 — CSS tuning (tiny, safe, teaches you to read existing values)

**Goal:** I added a very subtle dot-grid texture to the Planar background this session (your
request). I picked values that seemed reasonable, but I'm not the one who has to look at it all
day — tune it to what actually looks good to you.

**Find it:** Cmd+F for `Planar background texture`. You'll see:
```css
html[data-mode="standard"] body{
  background-image: radial-gradient(circle, color-mix(in srgb, var(--text) 5%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**What the numbers mean:** `5%` is how visible the dots are (opacity, roughly) — higher is more
visible. `24px 24px` is the spacing between dots — smaller means denser/tighter. `1px` (both
places) is the dot's own size.

**Hint:** Change one number at a time, save, refresh, look in both the light and dark theme
(Settings → Dark mode toggle) before deciding — a value that looks right in dark can look wrong
in light, since `color-mix` blends toward `--text`, which flips between the two themes.

**Check + Commit:** Once you're happy with it in both themes, commit as
`Tune Planar background texture`.

---

## Task 5 — A real feature, in the now-safe Game mode sandbox

**Goal:** Add one new badge to the achievement system. This is Game-mode-only content, which
means it's currently invisible to every real visitor — the lowest-stakes place in the entire
app to write and ship actual logic, not just copy.

**Find it:** Cmd+F for `function renderBadges`, then scroll up slightly to find the `BADGES`
array right above it (search `id: 'spell_10'` to jump straight to an entry in that array).

**Example:** Every badge is `{ id, icon, name, desc, check }` where `check` is a function that
takes a stats object (`s`) and returns true/false — e.g.
`{ id:'spell_10', icon:'⭐', name:'Collector', desc:'Save 10 ECs to your Spellbook', check:s=>s.spellbook>=10 }`.

**Hint:** Look at `checkBadges()` (search for it) to see what fields actually exist on the stats
object you get (`s.spellbook`, `s.grimoire`, counts of things) — your `check` function can only
test things that are actually in there. Pick a milestone that doesn't already have a badge (e.g.
visiting a certain number of distinct categories, or a Quill submission getting approved — check
what data's actually trackable before committing to an idea).

**Check + Commit:** Type `sanctum` on the Home page (outside any text box) to unlock Game mode on
your machine, play with your own app until you trigger the badge, confirm it shows unlocked in
Settings → Chamber → Badges. Commit as `Game mode: add [badge name] badge`.

---

## When you're done with some or all of this

Tell me which ones you did, and I'll fold an honest, specific line into the AI disclosure — the
same way Plainscript's does. Something like: *"I wrote the About page's origin story, six EC
category tips, the nav overflow fix, and a new achievement badge myself, with step-by-step
guidance where I needed it; Claude wrote the rest, which I directed, reviewed, and made every
safety and product decision on."* That's a true, specific, strong sentence — stronger than a
blanket claim either way.

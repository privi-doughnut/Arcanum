# Arcanum

**A free extracurricular marketplace and planning tool for high school students.**

🔗 **Live:** https://arcanum.its-the-prithivi-show.workers.dev

Figuring out which extracurriculars are worth your time is mostly guesswork — the good information is scattered, paywalled, or comes from people selling something. Arcanum puts it in one place: a searchable catalog of real activities with honest ratings, an AI advisor that builds a plan around your actual situation, and a tracker that follows you from "maybe" to "done."

Built solo. Submitted to the **2026 Congressional App Challenge**.

---

## What it does

**📚 The catalog** — 3,208 real extracurriculars across 40 categories. Every one is rated on four dimensions (difficulty, time commitment, competitiveness, and an overall value score), tagged by impact level from Local to Global, and filterable and searchable.

**🔮 The advisor** — an AI advisor that interviews you about your goals, grade, and constraints, then writes a personalized strategic plan. It remembers context across sessions and can take in activities you found outside the app.

**📖 The tracker** — commit to activities, set milestones and deadlines, track status, and export the whole thing into Common App format when applications open.

**Two visual modes.** Arcanum ships a fantasy "game mode" and a clean editorial "Planar" mode, toggleable at any time. The fantasy layer makes an intimidating process approachable for younger students; the clean mode serves everyone else. Both expose identical functionality.

---

## Architecture

The entire frontend is **one HTML file** — `public/index.html`, about 1.9 MB — with no framework, no build step, no bundler, and no router. That is a deliberate choice, not a shortcut: it means the app has no dependency tree to rot, loads as a single request, and can be read end to end by anyone who opens it.

The backend is **one Cloudflare Worker** (`worker.js`) that:

- serves the static app via Static Assets,
- proxies AI calls to Anthropic so the API key never reaches the browser,
- tracks live and total visitors with a `Stats` Durable Object,
- rate-limits and guards the advisor with a `RateLimiter` Durable Object.

**Supabase** provides optional accounts and cross-device sync, protected by Row Level Security.

```
public/index.html   the entire frontend
worker.js           combined Worker: assets + AI proxy + Durable Objects
wrangler.jsonc      Worker config (assets, DO bindings, migrations)
```

## Security

- The Anthropic API key lives as an encrypted Cloudflare secret and is never exposed client-side.
- The Worker pins the model server-side, so no caller can request a pricier one.
- Per-IP rate limiting (15/min, 120/hr) plus input caps on message count, length, and `max_tokens`.
- Cross-origin browser requests to the advisor are rejected.
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) on every response.
- User-submitted content is escaped at every `innerHTML` boundary, and user-supplied URLs are scheme-checked.
- Only `./public` is served publicly, so repo source and history can't leak as static assets.

## Running it

The app is a static file — open `public/index.html` in a browser and everything works except the AI advisor and visitor counter, which need the Worker.

For the full stack:

```bash
npm install
npx wrangler dev      # local Worker + assets
npx wrangler deploy   # deploy (Workers Builds also auto-deploys on push to main)
```

---

*Ratings and reviews shown as samples are labeled as such in the app and disclosed on the About page.*

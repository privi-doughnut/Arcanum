# Arcanum

**Live app:** https://arcanum.its-the-prithivi-show.workers.dev

Arcanum helps high schoolers figure out which extracurriculars to do and how to actually go after them.

Right now that's insider knowledge. Students with connected parents or a great counselor get a roadmap. Everyone else guesses. Arcanum gives every student the same roadmap, for free.

## What it does

**The catalog.** 3,208 real activities, each rated on four dimensions. Filter, sort, and search (the search handles typos).

**The AI advisor (Jebadias).** Tell it your grade, goals, and interests and it gives you personalized guidance or a full strategic plan. Nine advisor personas unlock as you make progress.

**The tracker.** Commit to activities, track status, milestones, and deadlines, then export everything to Common App format with the character limits already handled.

Other stuff:

- Game mode (fantasy skin) and Planar mode (clean, minimal). Same features either way.
- Shareable plan links encoded in the URL, so nothing is stored on a server
- Sign-up flow (name, age, grade, goal) that personalizes the advisor's welcome
- Optional accounts with cross-device sync. Everything also works with no account, saved in your browser.
- Accessibility: high contrast, reduced motion, hover-to-read-aloud, keyboard shortcuts
- Print stylesheet for a clean PDF of your plan

## How it's built

- **Frontend:** one `index.html` file (in `public/`). Vanilla HTML, CSS, and JS. No framework, no bundler, no build step, no dependencies. That's on purpose.
- **Hosting + AI proxy:** a Cloudflare Worker (`worker.js`) serves the site and proxies calls to Anthropic's Claude API, so the API key never touches the browser.
- **Accounts/sync:** Supabase (optional).

## AI use

I built Arcanum with AI coding assistants (Claude) writing a lot of the code. I came up with the idea, designed the features and the look, made every product decision, tested and debugged it, and deployed it. The sample reviews in the catalog are AI-generated and labeled that way in the app.

## Author

Prithivi Vijayakumar ([@privi-doughnut](https://github.com/privi-doughnut)), high school sophomore, Charlotte NC.

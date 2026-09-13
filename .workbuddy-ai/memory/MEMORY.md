# RDRS Learning Portal — project notes

## What it is
Static, backend-free course platform: learner enters a name, watches 11 video
modules, unlocks a downloadable PDF certificate at 80% watched. Built to a fixed
spec — see `README.md` for the full contract.

## Conventions / constraints to preserve
- **No backend, no auth, no API routes, no database, no env vars.** Everything is
  client-side; `localStorage` (keys prefixed `rdrs.`) is the whole persistence
  layer. Any future change must keep the `dist/` output deployable to a plain
  static host.
- **Keep the dependency list minimal.** Currently: react, react-dom, tailwindcss,
  vite, @vitejs/plugin-react, jspdf, html2canvas-pro. No router — view switching is
  plain React state in `App.jsx`.
- **Tailwind is pinned to v3.4, deliberately.** v4 emits `oklch()` colours that
  plain `html2canvas` cannot parse. `html2canvas-pro` handles them, but the
  certificate is also written with flat hex colours as belt-and-braces.
- **All video IDs live only in `src/config/course.js`.** Never hardcode a video ID
  anywhere else — swapping in real footage must be a one-file edit.
- **`AGENT_HANDOFF.md` is the guide for whoever swaps in the real course content.**
  Keep it accurate: if `course.js` gains a field or the workflow changes, update it
  in the same change.
- **`scripts/check-course.mjs` verifies `course.js`** — shape checks plus two network
  checks that matter: YouTube **oEmbed** (200 only when a video may be embedded, so it
  catches the silent "plays in a tab, refuses to play in the app" failure) and
  **`lengthSeconds`** scraped from the watch page (real duration, no API key). Exits
  non-zero on error. Run it after any content edit.
- **`COMPLETION_THRESHOLD` is the single definition of the 80% rule.** UI copy
  interpolates it — never hardcode a percentage into new strings.
- **Module count is never hardcoded.** Everything derives from `COURSE_MODULES.length`,
  so adding or removing modules is safe. But summaries are free text and can go stale
  (m01's mentions "eleven modules").
- **`base: './'`** in `vite.config.js` so the build works from a sub-directory.
- **Attribution lives in `src/config/site.js`** and renders through
  `components/AuthorBadge.jsx`, which appears in both navbars. Keep it muted and
  secondary — it must never compete with the brand or the reset control.

## Architecture map
- `src/lib/storage.js` — defensive localStorage wrapper (corrupt values never crash).
- `src/lib/progress.js` — all completion maths; `durationFor()` is the single place
  the estimated-vs-real duration fallback is resolved.
- `src/lib/certificate.js` — PDF export + filename slugging.
- `src/components/YouTubePlayer.jsx` — IFrame API loader + watch-time poll loop.

## Watch-time model (do not regress this)
Wall-clock accumulation while `PLAYING`, **not** playhead position — that is what
makes seeking forward worthless. 1s poll, max 3s banked per tick, clamped to the
video's own duration. Per-video totals are keyed by module id in `rdrs.watched.v1`.

## Testing
There is a reusable CDP QA harness pattern (in-process Vite server + headless
Chrome over WebSocket). See the `sandboxed-web-app-build-qa` skill for the recipe
and its gotchas. Always run the harness from the **project root**, or Tailwind's
config won't resolve.

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

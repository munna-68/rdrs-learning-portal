# RDRS Learning Portal

A minimal, modern course platform for **Safeguarding Training for New Employees**.
A learner enters their name, watches 11 video modules, and unlocks a downloadable
PDF certificate once they've watched **80%** of the total course content.

There is no backend, no server, no database and no authentication. Everything runs
in the browser and persists in `localStorage`, so the built app is a plain folder
of static files that can be dropped on any static host.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build locally
```

## Deploying

`npm run build` emits a self-contained `dist/` folder (~1.1 MB total). Upload it
anywhere — Vercel, Netlify, GitHub Pages, S3, nginx. No environment variables, no
build-time configuration, no server-side code.

Assets are referenced with relative paths (`base: './'` in `vite.config.js`), so
the app also works when hosted from a sub-directory such as
`https://example.org/training/`.

---

## Swapping in the real course videos

**All video IDs live in exactly one file:** [`src/config/course.js`](src/config/course.js).

```js
{
  id: 'm02',
  title: 'What Is Safeguarding?',
  summary: 'Core definitions, ...',
  youtubeId: 'aqz-KE-bpKQ',   // <-- replace with the real video ID
  estimatedDuration: 600,     // <-- optional, in seconds
}
```

Replace each `youtubeId` with the 11-character ID from the real video's watch URL
(`https://www.youtube.com/watch?v=XXXXXXXXXXX`). Nothing else in the app needs to
change. You can also edit `title` and `summary` freely, and add or remove modules —
every screen, the progress maths and the certificate adapt automatically.

The IDs currently committed are public, embeddable placeholder videos. They do not
match the module topics; they exist so the player and watch-time tracking can be
exercised end to end.

### About `estimatedDuration`

This is only a fallback for the progress denominator. Until a learner opens a
module, the app has no way to know that video's real length, so it uses this
estimate to keep the overall percentage meaningful from the very first visit. The
moment the player loads, the true duration is read from the YouTube API, stored,
and the estimate is discarded. Set it to roughly the real length for the tidiest
first-run experience.

---

## How watch-time tracking works

The player is the **YouTube IFrame Player API**, not a plain `<iframe>` — a plain
embed gives JavaScript no handle on playback state or playhead position.

For each video:

- A **1-second poll** measures how much *wall-clock* time has elapsed since the
  previous poll.
- That time is banked **only while the player state is `PLAYING`**. Time spent
  paused, buffering, cued, or seeking is never counted.
- Because real elapsed time is measured rather than the playhead position,
  **dragging the scrubber forward earns nothing**. There is no reward for skipping.
- A single poll can bank at most 3 seconds, so a suspended tab or a sleeping laptop
  cannot dump minutes of credit into the total at once.
- Each video's total is **clamped to that video's own duration**, so a module can
  never exceed 100%.

Watched seconds are stored per module in `localStorage` (`rdrs.watched.v1`) and
survive a refresh.

**Overall completion** = sum of watched seconds across all 11 videos ÷ sum of all
11 durations. At **80%** the course is marked complete and the certificate unlocks.
Unlocking is a one-way door: once earned, a later, more precise duration reading
cannot take it back.

### Storage keys

| Key                    | Contents                                    |
| ---------------------- | ------------------------------------------- |
| `rdrs.learner.name`    | The learner's name                          |
| `rdrs.watched.v1`      | `{ [moduleId]: secondsWatched }`            |
| `rdrs.durations.v1`    | `{ [moduleId]: trueDurationSeconds }`       |
| `rdrs.completedAt.v1`  | ISO timestamp of first reaching 80%         |

"Switch user / reset" in the header clears all four and returns to the welcome
screen. It asks for a second click to confirm.

---

## The certificate

The certificate is authored as real DOM at landscape-A4 proportions
(1123 × 794 px at 96 dpi) in
[`src/components/CertificateTemplate.jsx`](src/components/CertificateTemplate.jsx).
It stays mounted off-screen so the exporter always finds a fully laid-out node.

Exporting is entirely client-side:

1. the off-screen certificate is rasterised to a canvas at 2× with `html2canvas-pro`,
2. the image is placed full-bleed on a single landscape A4 page with `jsPDF`,
3. `pdf.save()` triggers a normal browser download named `Jane-Doe-Certificate.pdf`.

`html2canvas-pro` is used rather than plain `html2canvas` because it understands
modern CSS colour spaces such as `oklch`. The certificate itself deliberately uses
flat hex colours, simple borders, no shadows or gradients, and system fonts, so the
PDF renders identically in every browser.

Both PDF libraries are ~600 kB combined and are only needed when a learner actually
clicks the download button, so they are pulled in with a dynamic `import()` and live
in separate chunks. The initial page load is ~55 kB gzipped.

---

## Project layout

```
src/
  config/course.js              ← the only place video IDs live
  config/site.js                ← attribution (author handle + GitHub link)
  lib/storage.js                ← localStorage wrapper (the entire "backend")
  lib/progress.js               ← all completion maths
  lib/certificate.js            ← client-side PDF export
  components/
    WelcomeScreen.jsx           ← name entry
    Dashboard.jsx               ← overall progress, certificate state, module list
    VideoView.jsx               ← player + per-video progress
    YouTubePlayer.jsx           ← IFrame API wrapper + watch-time polling
    CertificateTemplate.jsx     ← the printable certificate
    AuthorBadge.jsx             ← the muted GitHub link in the navbar
    ProgressBar.jsx
  App.jsx                       ← state, persistence wiring, view switching
  main.jsx
  index.css
```

Navigation between the dashboard and a module is plain React state — no router
dependency. Dependencies are React, Tailwind, `jspdf` and `html2canvas-pro`, and
nothing else.

---

## Notes and known limits

- Progress is per-browser. Two learners on the same machine share one profile unless
  they use "Switch user / reset"; the same learner on two machines has two separate
  records. This is inherent to a backend-free design.
- The placeholder videos are third-party YouTube content. If a video owner disables
  embedding, that module's player will show an error — swap the ID in the config.
- Clearing browser data or using private browsing wipes progress.

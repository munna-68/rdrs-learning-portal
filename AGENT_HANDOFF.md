# AGENT_HANDOFF.md

**Read this before you change anything in this repo.**

You are picking up a finished, working application. Your job is **content, not
code**: replace the eleven placeholder videos and their placeholder copy with the
real course material. Nothing about the app's behaviour needs to change, and
nothing about it should.

Budget: this is a **one-file edit** plus a verification run. If you find yourself
editing components or logic, stop and re-read this page — something has gone
wrong, or you have found a real bug worth reporting rather than working around.

---

## 1. What this repo is

**RDRS Learning Portal** — a static, backend-free course platform. A learner types
their name, watches eleven video modules, and unlocks a downloadable PDF
certificate once they have watched **80%** of the total course content.

- Vite + React + Tailwind. No server, no database, no auth, no env vars.
- All state lives in the browser's `localStorage`.
- `npm run build` produces a `dist/` folder you can drop on any static host.

The course is currently populated with **public placeholder videos** (Blender open
movies, a couple of well-known clips). They are real, embeddable videos so the
player and watch-time tracking work end to end — but they have nothing to do with
safeguarding. That is what you are replacing.

---

## 2. What you will be given

The human will hand you roughly this:

| Input | Example | What you do with it |
| --- | --- | --- |
| YouTube links, in order | `https://youtu.be/abc123XYZ_` | Extract the 11-character ID → `youtubeId` |
| Which link is module 1, 2, 3… | "the first one is the intro" | That order **is** the order of the array |
| A line or two about each module | "covers how to spot the signs" | Expand into a `summary` (see §7) |
| Possibly new titles | "call it Recognising Risk" | Use theirs verbatim in `title` |
| Possibly a new course title | "Safeguarding Essentials 2026" | → `COURSE_TITLE` (also appears on the certificate) |

**If something is missing, decide sensibly and say what you assumed.** Do not
stall. Specifically:

- **No title given** → keep the existing title if it still fits the video, otherwise
  write one in the house style (§7).
- **No description given** → write the summary yourself from the module title and
  what the video actually is. Use the video's real title (the check script prints
  it) as your only evidence of its content, and keep the summary generic enough
  to be true. **Flag it** so the human can correct it.
- **Fewer or more than eleven videos** → fine, see §9.

---

## 3. The only file you need to edit

```
src/config/course.js
```

This is the single source of truth for the course. Every screen reads from it, so
you never need to touch a component.

### Field reference

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | `'m01'`, `'m02'`, … **Unique.** Used as the key for saved progress, so **do not renumber or reuse an existing id** — that would silently hand one module's watch time to another. |
| `title` | yes | Shown in the dashboard list and as the module page heading. |
| `summary` | yes | One or two sentences. Shown as the intro paragraph on the module page. |
| `youtubeId` | yes | The 11-character ID. See §6. |
| `estimatedDuration` | yes | Length in **seconds**. See §8 — do not guess, the checker will tell you. |

**Array order is module order.** The first object is Module 1. The UI numbers them
from the array index, so moving an object moves the module.

### Worked example

```js
{
  id: 'm06',
  title: 'How to Report a Concern',
  summary:
    'The reporting pathway step by step — what to record, who to tell, and the timescales you must work to.',
  youtubeId: 'TLkA0RELQ1g',
  estimatedDuration: 654,
},
```

Also at the top of the file:

```js
export const BRAND_NAME = 'RDRS Learning Portal'          // navbar + certificate
export const COURSE_TITLE = 'Safeguarding Training for New Employees'  // welcome + certificate
export const COURSE_SUBTITLE = '...'                      // welcome screen only
export const COMPLETION_THRESHOLD = 0.8                   // 80%
```

Change `COURSE_TITLE` and the certificate changes with it — that is the one piece
of copy that appears on the downloadable PDF.

---

## 4. Step by step

1. **Read the current `src/config/course.js`** so you know what you are replacing.
2. **Map the human's list onto the modules.** Write the order down before you edit
   anything — link 1 → `m01`, link 2 → `m02`, and so on.
3. **Extract each video ID** (§6).
4. **Write each `title` and `summary`** (§7).
5. **Edit `src/config/course.js`.** Keep the existing formatting: two-space indent,
   trailing commas, summaries wrapped in single quotes on their own line when long.
6. **Fill in real durations** by running the checker (§8).
7. **Run the checker again** and get it to a clean pass (§9).
8. **Build** and confirm it compiles (§9).
9. **Report back** with what you changed and anything you assumed.

---

## 5. Do not touch

These are done, verified, and easy to break:

- `src/lib/progress.js` — the completion maths
- `src/lib/storage.js` — the `localStorage` layer and its key names
- `src/lib/certificate.js` — PDF export
- `src/components/YouTubePlayer.jsx` — the watch-time tracking
- `src/App.jsx` — state wiring

If you believe one of these is genuinely wrong, **report it rather than editing
it.** They were validated by driving the real production build in a real browser;
an unreviewed change here is much more likely to introduce a bug than to fix one.

---

## 6. Turning a YouTube link into an ID

`youtubeId` is the **11-character** string after `v=`. That is the only part you
need.

| Link shape | ID |
| --- | --- |
| `https://www.youtube.com/watch?v=aqz-KE-bpKQ` | `aqz-KE-bpKQ` |
| `https://youtu.be/aqz-KE-bpKQ` | `aqz-KE-bpKQ` |
| `https://www.youtube.com/embed/aqz-KE-bpKQ` | `aqz-KE-bpKQ` |
| `https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=42s&list=PL…` | `aqz-KE-bpKQ` |

**Discard everything else** — `&t=`, `&list=`, `&index=`, `&si=`, playlist IDs.
A link with a playlist attached will otherwise tempt you into pasting something
that is not an ID.

The ID is always exactly 11 characters from `A–Z a–z 0–9 - _`. If what you have is
not 11 characters, you have grabbed the wrong part — the checker will catch it.

> **Watch out:** a link can be valid but unplayable in an embed. The owner may have
> disabled embedding, or the video may be private, age-restricted, or region-locked.
> It will load in a normal browser tab and still refuse to play inside this app,
> with no useful error in the UI. **The checker detects this — always run it.**

---

## 7. Writing titles and summaries

`title` appears in the dashboard list and as the module heading. `summary` appears
only on the module page, directly under the heading. Both are learner-facing.

### House style

**Titles** — sentence case, no trailing full stop, 3–7 words, concrete.

> ✅ `Recognizing Signs of Harm` · `Confidentiality & Information Sharing`
> ❌ `Module 3: An Introduction To The Various Ways In Which Harm May Be Recognized.`

**Summaries** — one or two sentences. A noun phrase describing what the module
covers, not a promise about what the learner will feel. Plain, professional,
present tense. Aim for **120–220 characters**.

> ✅ `The reporting pathway step by step — what to record, who to tell, and the timescales you must work to.`
> ❌ `In this amazing module you will learn everything you need to know about reporting!` *(salesy, first/second person, vague)*
> ❌ `Reporting.` *(a stub — the card will look broken)*

Expand the human's one-liner into this shape. If they say *"covers how to spot the
signs"*, that becomes something like:

> `Physical, behavioural and environmental indicators of abuse or neglect, and how to distinguish a concern from a certainty.`

You are allowed to write this. You are **not** allowed to invent specific policy
detail, legal duties, names, phone numbers, or timescales that were not given to
you. Keep it descriptive of scope; leave the facts to the video.

---

## 8. Getting `estimatedDuration` right

This field is in **seconds**.

It is only a fallback: until a learner opens a module, the app has no way to know
that video's real length, so it uses this number to keep the overall progress bar
meaningful on the first visit. The moment the player loads, the true duration is
read from YouTube and the estimate is discarded.

So it does not need to be perfect — but a badly wrong estimate makes the first
visit confusing, so get it close.

**Do not eyeball it.** Run:

```bash
node scripts/check-course.mjs
```

It prints the real length of every video next to your estimate and flags anything
more than 10% out:

```
  ID   VIDEO ID      REAL    EST.    EMBED  TITLE
  m01  M7lc1UVf-VE   22:24   4:05    yes    YouTube Developers Live: Embedded
  ...
  estimatedDuration is off by more than 10% for these modules:
    m01:  245  ->  1344
```

Paste the suggested values in and re-run until it is quiet.

---

## 9. Verifying your work

### The checker

```bash
node scripts/check-course.mjs              # full check (needs network)
node scripts/check-course.mjs --offline    # config shape only, no requests
node scripts/check-course.mjs --json       # machine-readable
```

It catches, with a non-zero exit code on failure:

- malformed or mistyped video IDs
- the **same video pasted into two modules**
- videos that exist but **cannot be embedded** — the failure mode that is invisible
  in the UI
- deleted, private, or age-restricted videos
- duplicate module `id`s
- missing, stub, or overlong summaries and titles
- non-positive `estimatedDuration`
- `estimatedDuration` more than 10% from the real length (warning)

It also prints each video's **real YouTube title and channel**, which is the
fastest way to confirm you pasted the link you meant to. If the printed title has
nothing to do with the module, you have mismatched a link.

> It was tested by deliberately injecting four faults (a duplicate video, a
> malformed ID, a stub summary, and a zero duration). All four were caught, and
> the exit code was non-zero. You can trust a clean pass.

### The build

```bash
npm run build
```

Must complete with no errors. Then `npm run preview` and click through.

### In the browser

The checker cannot see rendering. After a clean pass, confirm by hand:

1. Open the app, enter a name, land on the dashboard.
2. **Every module shows its new title.** Count them — the list length should match
   your array.
3. **Open at least the first and last module.** The video plays. The heading and
   summary match. The progress bar starts at 0%.
4. **Let one video play for ~20 seconds.** The "watched" percentage should climb
   and survive a page refresh. If it does not, you have probably reused a module
   `id` and progress is landing on the wrong module.
5. **Check the certificate title.** Set `COMPLETION_THRESHOLD` aside and instead
   confirm `COURSE_TITLE` reads correctly on the welcome screen — that is the same
   string that prints on the PDF.

---

## 10. Gotchas

**Reusing a module `id` silently corrupts progress.** Saved watch time is keyed by
`id`, not by position. If you give a new module an `id` that a previous one used,
that module inherits the old video's watch time. When replacing the course
wholesale, either keep `m01`…`m11` mapped to the same slots, or clear
`rdrs.watched.v1` from `localStorage`.

**Changing the number of modules is safe.** Nothing hardcodes "11" — the dashboard
count, the module list, and the "Module X of Y" label all derive from the array
length. Just make sure the ids stay unique.

**But the copy might not be.** Summaries are free text and can go stale. Module 1's
summary currently ends *"…and how to get the most out of the eleven modules."* If
the count changes, fix that sentence.

**`COMPLETION_THRESHOLD` is defined once** (`src/config/course.js`) and the UI copy
reads from it. Changing it to, say, `0.6` correctly updates the welcome screen, the
locked-certificate panel, and the unlock logic together. Do not hardcode a
percentage into any new copy — interpolate the constant.

**Videos must be embeddable.** See §6. This is the single most common way a
content swap ships broken.

**The certificate is unaffected by module content** apart from `COURSE_TITLE`. It
shows the learner's name, the course title, and the completion date.

---

## 11. Definition of done

- [ ] Every `youtubeId` is a valid 11-character ID, and no two modules share one.
- [ ] `node scripts/check-course.mjs` exits clean (no errors).
- [ ] Every `estimatedDuration` is the real length in seconds.
- [ ] Every `title` and `summary` is real copy, not a placeholder or a stub.
- [ ] `COURSE_TITLE` reads correctly (it prints on the certificate).
- [ ] `npm run build` succeeds.
- [ ] You opened the app and confirmed the first and last module play.
- [ ] You have told the human what you assumed, and flagged any summary you wrote
      yourself from limited information.

---

## Appendix A — where things live

```
src/
  config/course.js          ← YOU EDIT THIS: modules, video IDs, titles, copy
  config/site.js            ← author attribution shown in the navbar
  lib/storage.js            ← localStorage wrapper (the entire "backend")
  lib/progress.js           ← all completion maths
  lib/certificate.js        ← client-side PDF export
  components/
    WelcomeScreen.jsx       ← name entry
    Dashboard.jsx           ← overall progress, certificate state, module list
    VideoView.jsx           ← player + per-video progress
    YouTubePlayer.jsx       ← IFrame API wrapper + watch-time polling
    CertificateTemplate.jsx ← the printable certificate
    AuthorBadge.jsx         ← GitHub link in the navbar
    ProgressBar.jsx
  App.jsx                   ← state, persistence wiring, view switching
scripts/
  check-course.mjs          ← the verifier described in §9
```

## Appendix B — how progress is stored

Keyed in `localStorage`, all prefixed `rdrs.`:

| Key | Contents |
| --- | --- |
| `rdrs.learner.name` | The learner's name |
| `rdrs.watched.v1` | `{ [moduleId]: secondsWatched }` |
| `rdrs.durations.v1` | `{ [moduleId]: trueDurationSeconds }` |
| `rdrs.completedAt.v1` | ISO timestamp of first reaching the threshold |

To test as a fresh learner, use **"Switch user / reset"** in the navbar (it clears
all four) or clear site data.

## Appendix C — how watch time is measured

Worth knowing before you conclude something is broken:

Watch time accrues as **real elapsed wall-clock seconds while the player state is
`PLAYING`** — not by watching the playhead position move. That is deliberate: it
means dragging the scrubber forward earns nothing, and neither does skipping.
Time spent paused, buffering, or seeking is never counted, a single poll can bank
at most 3 seconds, and each module's total is clamped to its own duration.

Consequence for testing: **a video that is paused will not advance progress.** If
you are verifying in a background tab, playback may be throttled and progress will
appear to stall. Bring the tab to the front.

#!/usr/bin/env node
/**
 * Verifies `src/config/course.js` — the file that holds every module and its
 * YouTube video ID.
 *
 * Run this after swapping in real course videos. It catches the mistakes that
 * are easy to make and expensive to find later:
 *
 *   - a malformed or mistyped video ID
 *   - the same video pasted into two modules
 *   - a video that exists but has embedding disabled (it will refuse to play
 *     inside the app, and nothing in the UI will explain why)
 *   - a video that has been deleted, made private, or is age-restricted
 *   - an `estimatedDuration` that is a long way from the real length
 *   - an empty or stub title / summary
 *
 * Usage:
 *   node scripts/check-course.mjs              # full check (needs network)
 *   node scripts/check-course.mjs --offline    # config shape only, no requests
 *   node scripts/check-course.mjs --json       # machine-readable output
 *
 * Exits non-zero if anything is broken, so it can gate a build.
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ARGS = new Set(process.argv.slice(2))
const OFFLINE = ARGS.has('--offline')
const AS_JSON = ARGS.has('--json')

const RED = '\u001b[31m'
const YELLOW = '\u001b[33m'
const GREEN = '\u001b[32m'
const DIM = '\u001b[2m'
const BOLD = '\u001b[1m'
const OFF = '\u001b[0m'
const tty = process.stdout.isTTY
const paint = (c, s) => (tty && !AS_JSON ? `${c}${s}${OFF}` : s)

const errors = []
const warnings = []
const notes = []
const rows = []

const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)
const note = (m) => notes.push(m)

const { COURSE_MODULES, COURSE_TITLE } = await import(`${ROOT}/src/config/course.js`)

// ---------------------------------------------------------------- shape checks

if (!Array.isArray(COURSE_MODULES) || COURSE_MODULES.length === 0) {
  console.error('COURSE_MODULES is missing or empty in src/config/course.js')
  process.exit(1)
}

const seenIds = new Set()
const seenVideoIds = new Map()

COURSE_MODULES.forEach((m, i) => {
  const at = `module ${i + 1} (${m?.id ?? 'no id'})`

  if (!m || typeof m !== 'object') return fail(`${at}: not an object`)
  if (!m.id) fail(`${at}: missing "id"`)
  else if (seenIds.has(m.id)) fail(`${at}: duplicate id "${m.id}"`)
  else seenIds.add(m.id)

  if (!m.title || !String(m.title).trim()) fail(`${at}: missing "title"`)
  else if (String(m.title).trim().length < 4) warn(`${at}: title looks like a stub`)

  const summary = String(m.summary ?? '').trim()
  if (!summary) fail(`${at}: missing "summary"`)
  else if (summary.length < 60) {
    warn(`${at}: summary is only ${summary.length} chars — aim for 120–220`)
  } else if (summary.length > 320) {
    warn(`${at}: summary is ${summary.length} chars — the card will get long`)
  }

  if (!m.youtubeId) fail(`${at}: missing "youtubeId"`)
  else if (!/^[A-Za-z0-9_-]{11}$/.test(m.youtubeId)) {
    fail(`${at}: "${m.youtubeId}" is not a valid 11-character YouTube ID`)
  } else if (seenVideoIds.has(m.youtubeId)) {
    fail(
      `${at}: same video as ${seenVideoIds.get(m.youtubeId)} ("${m.youtubeId}") — copy-paste error?`,
    )
  } else {
    seenVideoIds.set(m.youtubeId, m.id)
  }

  if (!Number.isFinite(m.estimatedDuration) || m.estimatedDuration <= 0) {
    fail(`${at}: "estimatedDuration" must be a positive number of seconds`)
  }
})

// ------------------------------------------------------------- network checks

async function probe(videoId) {
  const result = { videoId, embeddable: null, title: null, author: null, seconds: null }

  // oEmbed is the cheapest reliable signal: it returns 200 for videos that may
  // be embedded, and 400/401/404 for private, deleted, or embed-blocked ones.
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      { signal: AbortSignal.timeout(15000) },
    )
    result.embeddable = res.ok
    result.status = res.status
    if (res.ok) {
      const data = await res.json()
      result.title = data.title ?? null
      result.author = data.author_name ?? null
    }
  } catch (err) {
    result.embeddable = null
    result.error = err.message
  }

  // Real duration. No API key needed — the watch page carries it inline.
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      },
      signal: AbortSignal.timeout(20000),
    })
    const html = await res.text()
    const match = html.match(/"lengthSeconds":"(\d+)"/)
    if (match) result.seconds = Number(match[1])
  } catch {
    /* leave seconds null */
  }

  return result
}

const durationSuggestions = []

if (!OFFLINE) {
  for (const m of COURSE_MODULES) {
    if (!m?.youtubeId || !/^[A-Za-z0-9_-]{11}$/.test(m.youtubeId)) {
      rows.push({ module: m, probe: { embeddable: null, skipped: true } })
      continue
    }
    const result = await probe(m.youtubeId)
    rows.push({ module: m, probe: result })

    const at = `${m.id} "${m.title}"`

    if (result.embeddable === false) {
      fail(
        `${at}: video ${m.youtubeId} is NOT embeddable (HTTP ${result.status}). ` +
          `It will refuse to play inside the app.`,
      )
    } else if (result.embeddable === null) {
      warn(`${at}: could not reach YouTube to verify ${m.youtubeId} (${result.error ?? 'network'})`)
    }

    if (result.seconds && Number.isFinite(m.estimatedDuration)) {
      const drift = Math.abs(result.seconds - m.estimatedDuration) / result.seconds
      if (drift > 0.1) {
        durationSuggestions.push({ id: m.id, from: m.estimatedDuration, to: result.seconds })
      }
    }
  }
}

// ----------------------------------------------------------------- reporting

if (AS_JSON) {
  console.log(
    JSON.stringify(
      {
        courseTitle: COURSE_TITLE,
        moduleCount: COURSE_MODULES.length,
        errors,
        warnings,
        notes,
        modules: rows.map(({ module, probe }) => ({
          id: module.id,
          title: module.title,
          youtubeId: module.youtubeId,
          estimatedDuration: module.estimatedDuration,
          realDuration: probe.seconds ?? null,
          embeddable: probe.embeddable,
          youtubeTitle: probe.title ?? null,
          youtubeChannel: probe.author ?? null,
        })),
      },
      null,
      2,
    ),
  )
  process.exit(errors.length ? 1 : 0)
}

console.log(`\n${paint(BOLD, 'Course config check')}  ${paint(DIM, COURSE_TITLE ?? '')}`)
console.log(`${COURSE_MODULES.length} modules · ${OFFLINE ? 'offline (shape only)' : 'verifying against YouTube'}\n`)

if (!OFFLINE) {
  console.log(
    `  ${'ID'.padEnd(5)}${'VIDEO ID'.padEnd(14)}${'REAL'.padEnd(8)}${'EST.'.padEnd(8)}${'EMBED'.padEnd(7)}TITLE`,
  )
  console.log(`  ${DIM}${'-'.repeat(78)}${OFF}`)
  for (const { module: m, probe } of rows) {
    const real = probe.seconds ? `${Math.floor(probe.seconds / 60)}:${String(probe.seconds % 60).padStart(2, '0')}` : '—'
    const est = `${Math.floor(m.estimatedDuration / 60)}:${String(Math.round(m.estimatedDuration) % 60).padStart(2, '0')}`
    const embed = probe.skipped ? '?' : probe.embeddable === true ? paint(GREEN, 'yes') : probe.embeddable === false ? paint(RED, 'NO') : '?'
    const ytTitle = (probe.title ?? '').slice(0, 34)
    console.log(
      `  ${m.id.padEnd(5)}${m.youtubeId.padEnd(14)}${real.padEnd(8)}${est.padEnd(8)}${String(embed).padEnd(7)}${paint(DIM, ytTitle)}${OFF}`,
    )
  }
  console.log()
}

if (durationSuggestions.length) {
  console.log(paint(YELLOW, '  estimatedDuration is off by more than 10% for these modules:'))
  console.log(paint(DIM, '  (estimates are only a fallback, but accurate ones make the first visit nicer)'))
  for (const s of durationSuggestions) {
    console.log(`    ${s.id}:  ${s.from}  ->  ${s.to}`)
  }
  console.log()
}

if (notes.length) {
  notes.forEach((n) => console.log(`  ${paint(DIM, 'note')}  ${n}`))
  console.log()
}

if (warnings.length) {
  console.log(paint(YELLOW, `  ${warnings.length} warning(s):`))
  warnings.forEach((w) => console.log(`    ${paint(YELLOW, '!')} ${w}`))
  console.log()
}

if (errors.length) {
  console.log(paint(RED, `  ${errors.length} error(s):`))
  errors.forEach((e) => console.log(`    ${paint(RED, 'x')} ${e}`))
  console.log()
  console.log(paint(RED, '  FAILED\n'))
  process.exit(1)
}

console.log(paint(GREEN, `  OK — ${COURSE_MODULES.length} modules look good${warnings.length ? ` (${warnings.length} warning(s))` : ''}\n`))
process.exit(0)

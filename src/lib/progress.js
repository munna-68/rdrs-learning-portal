/**
 * All progress maths in one place.
 *
 * Completion model
 * ----------------
 *   per video : watched[videoId] / duration[videoId]     (capped at 1)
 *   overall   : sum(watched) / sum(durations)
 *
 * A video's duration is the real duration reported by the YouTube player once
 * that module has been opened at least once. Until then we fall back to the
 * `estimatedDuration` declared in the course config, so the overall bar is
 * meaningful on the very first visit instead of jumping around.
 */

import { COURSE_MODULES } from '../config/course'

export function durationFor(module, durations) {
  const real = durations[module.id]
  if (Number.isFinite(real) && real > 0) return real
  return module.estimatedDuration || 0
}

export function computeProgress(modules = COURSE_MODULES, watched = {}, durations = {}) {
  let watchedTotal = 0
  let durationTotal = 0
  const perModule = {}

  for (const module of modules) {
    const duration = durationFor(module, durations)
    const raw = watched[module.id] || 0
    // A video can never contribute more than its own duration — this is what
    // stops repeated seeking from pushing a single module past 100%.
    const capped = duration > 0 ? Math.min(raw, duration) : 0

    watchedTotal += capped
    durationTotal += duration
    perModule[module.id] = duration > 0 ? capped / duration : 0
  }

  const ratio = durationTotal > 0 ? watchedTotal / durationTotal : 0

  return {
    watchedTotal,
    durationTotal,
    ratio,
    /** 0–100, rounded to one decimal place. */
    percent: Math.round(ratio * 1000) / 10,
    perModule,
  }
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** "1 hr 24 min" / "42 min" / "3 min" — for summaries, not for ticking clocks. */
export function formatApproxDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h} hr ${m} min` : `${h} hr`
  if (m > 0) return `${m} min`
  return `${s} sec`
}

export function formatLongDate(iso) {
  const date = iso ? new Date(iso) : new Date()
  if (Number.isNaN(date.getTime())) return formatLongDate(null)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

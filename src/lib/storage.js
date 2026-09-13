/**
 * Thin, typed-ish wrapper around localStorage.
 *
 * Everything the app persists lives under the `rdrs.` prefix. There is no
 * backend, so this file *is* the persistence layer.
 *
 * Every read is defensive: a corrupt or hand-edited value must never crash the
 * app, it should simply fall back to an empty default.
 */

const PREFIX = 'rdrs.'

export const KEYS = {
  name: `${PREFIX}learner.name`,
  watched: `${PREFIX}watched.v1`, // { [videoId]: seconds }
  durations: `${PREFIX}durations.v1`, // { [videoId]: seconds }
  completedAt: `${PREFIX}completedAt.v1`, // ISO date string
}

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage full or blocked (private mode) — progress simply won't persist */
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function readJson(key, fallback) {
  const raw = safeGet(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback
    }
    // Keep only finite, non-negative numbers so a bad value can't poison maths.
    const clean = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) clean[k] = n
    }
    return clean
  } catch {
    return fallback
  }
}

export function loadName() {
  const raw = safeGet(KEYS.name)
  return raw && raw.trim() ? raw : ''
}

export function saveName(name) {
  safeSet(KEYS.name, name.trim())
}

export function loadWatched() {
  return readJson(KEYS.watched, {})
}

export function saveWatched(map) {
  safeSet(KEYS.watched, JSON.stringify(map))
}

export function loadDurations() {
  return readJson(KEYS.durations, {})
}

export function saveDurations(map) {
  safeSet(KEYS.durations, JSON.stringify(map))
}

export function loadCompletedAt() {
  const raw = safeGet(KEYS.completedAt)
  return raw && !Number.isNaN(Date.parse(raw)) ? raw : ''
}

export function saveCompletedAt(iso) {
  safeSet(KEYS.completedAt, iso)
}

/** Wipe every trace of the current learner and return to the welcome screen. */
export function clearLearner() {
  Object.values(KEYS).forEach(safeRemove)
}

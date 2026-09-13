import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COMPLETION_THRESHOLD, COURSE_MODULES, getModuleById } from './config/course'
import CertificateTemplate from './components/CertificateTemplate'
import Dashboard from './components/Dashboard'
import VideoView from './components/VideoView'
import WelcomeScreen from './components/WelcomeScreen'
import { CERTIFICATE_HEIGHT_PX, CERTIFICATE_WIDTH_PX, downloadCertificatePdf } from './lib/certificate'
import { computeProgress, durationFor } from './lib/progress'
import {
  clearLearner,
  loadCompletedAt,
  loadDurations,
  loadName,
  loadWatched,
  saveCompletedAt,
  saveDurations,
  saveName,
  saveWatched,
} from './lib/storage'

export default function App() {
  // ---- persisted state (localStorage is the entire "backend") -------------
  const [learnerName, setLearnerName] = useState(() => loadName())
  const [watched, setWatched] = useState(() => loadWatched())
  const [durations, setDurations] = useState(() => loadDurations())
  const [completedAt, setCompletedAt] = useState(() => loadCompletedAt())

  // ---- ephemeral UI state -------------------------------------------------
  const [activeModuleId, setActiveModuleId] = useState(null)

  // Mirrors of state for use inside long-lived callbacks / intervals.
  const watchedRef = useRef(watched)
  const durationsRef = useRef(durations)
  useEffect(() => {
    watchedRef.current = watched
  }, [watched])
  useEffect(() => {
    durationsRef.current = durations
  }, [durations])

  const progress = useMemo(
    () => computeProgress(COURSE_MODULES, watched, durations),
    [watched, durations],
  )

  // Reaching 80% is a one-way door: once the certificate is earned we never
  // take it back, even if a later, more accurate duration reading nudges the
  // percentage down a fraction of a point.
  const certificateReady = Boolean(completedAt) || progress.ratio >= COMPLETION_THRESHOLD

  // ---- mark the course complete the first time we cross the threshold -----
  const completionClaimedRef = useRef(Boolean(completedAt))
  useEffect(() => {
    if (progress.ratio < COMPLETION_THRESHOLD || completionClaimedRef.current) return
    completionClaimedRef.current = true
    const iso = new Date().toISOString()
    setCompletedAt(iso)
    saveCompletedAt(iso)
  }, [progress.ratio])

  // ---- watch-time accumulation -------------------------------------------
  const activeModule = activeModuleId ? getModuleById(activeModuleId) : null

  const handleWatchedTick = useCallback(
    (deltaSeconds) => {
      const moduleId = activeModuleId
      if (!moduleId) return
      const module = getModuleById(moduleId)
      if (!module) return

      const duration = durationFor(module, durationsRef.current)
      const current = watchedRef.current[moduleId] || 0
      // Clamp to this video's own duration — seeking around can never push a
      // single module past 100%, nor the course past its real total.
      const next = duration > 0 ? Math.min(current + deltaSeconds, duration) : current
      if (next - current < 0.05) return

      const map = { ...watchedRef.current, [moduleId]: next }
      watchedRef.current = map
      setWatched(map)
      saveWatched(map)
    },
    [activeModuleId],
  )

  const handleDuration = useCallback(
    (seconds) => {
      const moduleId = activeModuleId
      if (!moduleId || !Number.isFinite(seconds) || seconds <= 0) return
      const rounded = Math.round(seconds * 10) / 10
      if (durationsRef.current[moduleId] === rounded) return

      const map = { ...durationsRef.current, [moduleId]: rounded }
      durationsRef.current = map
      setDurations(map)
      saveDurations(map)
    },
    [activeModuleId],
  )

  // ---- learner lifecycle --------------------------------------------------
  const handleStart = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    saveName(trimmed)
    setLearnerName(trimmed)
  }, [])

  const handleReset = useCallback(() => {
    clearLearner()
    completionClaimedRef.current = false
    watchedRef.current = {}
    durationsRef.current = {}
    setWatched({})
    setDurations({})
    setCompletedAt('')
    setActiveModuleId(null)
    setLearnerName('')
  }, [])

  // ---- certificate --------------------------------------------------------
  const certificateRef = useRef(null)
  const handleDownloadCertificate = useCallback(async () => {
    await downloadCertificatePdf(certificateRef.current, learnerName)
  }, [learnerName])

  if (!learnerName) {
    return <WelcomeScreen onStart={handleStart} />
  }

  const activeIndex = activeModule
    ? COURSE_MODULES.findIndex((m) => m.id === activeModule.id)
    : -1

  const activeDuration = activeModule ? durationFor(activeModule, durations) : 0
  const activeWatched = activeModule
    ? Math.min(watched[activeModule.id] || 0, activeDuration)
    : 0

  return (
    <>
      {activeModule ? (
        <VideoView
          module={activeModule}
          index={activeIndex}
          watchedSeconds={activeWatched}
          durationSeconds={activeDuration}
          ratio={progress.perModule[activeModule.id] || 0}
          onWatchedTick={handleWatchedTick}
          onDuration={handleDuration}
          onBack={() => setActiveModuleId(null)}
          onOpenModule={setActiveModuleId}
        />
      ) : (
        <Dashboard
          learnerName={learnerName}
          progress={progress}
          completedAt={completedAt}
          certificateReady={certificateReady}
          onOpenModule={setActiveModuleId}
          onDownloadCertificate={handleDownloadCertificate}
          onReset={handleReset}
        />
      )}

      {/*
        The certificate lives permanently in the DOM, parked off-screen. Keeping
        it mounted (rather than rendering it on demand) means the PDF generator
        always finds a fully laid-out node, and there is no race between mount
        and capture.
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '-10000px',
          width: CERTIFICATE_WIDTH_PX,
          height: CERTIFICATE_HEIGHT_PX,
          pointerEvents: 'none',
        }}
      >
        <CertificateTemplate
          ref={certificateRef}
          learnerName={learnerName}
          completionDate={completedAt}
        />
      </div>
    </>
  )
}

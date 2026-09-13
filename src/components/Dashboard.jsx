import { useEffect, useRef, useState } from 'react'
import { BRAND_NAME, COURSE_MODULES } from '../config/course'
import { formatClock, formatLongDate } from '../lib/progress'
import ProgressBar from './ProgressBar'

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" strokeLinecap="round" />
    </svg>
  )
}

function SealIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" {...props}>
      <path
        d="M12 2.8l2.2 1.6 2.7-.3 1 2.5 2.4 1.3-.6 2.7.6 2.7-2.4 1.3-1 2.5-2.7-.3L12 21.2l-2.2-1.6-2.7.3-1-2.5-2.4-1.3.6-2.7-.6-2.7L6.1 9.4l1-2.5 2.7.3L12 2.8z"
        strokeLinejoin="round"
      />
      <path d="M9.2 12.2l2 2 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Dashboard({
  learnerName,
  progress,
  completedAt,
  certificateReady,
  onOpenModule,
  onDownloadCertificate,
  onReset,
}) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const resetTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const { perModule, percent, watchedTotal, durationTotal } = progress

  // The first module that isn't finished yet — this is what "Continue" opens.
  const nextModule =
    COURSE_MODULES.find((module) => (perModule[module.id] || 0) < 0.999) || COURSE_MODULES[0]
  const completedCount = COURSE_MODULES.filter((m) => (perModule[m.id] || 0) >= 0.999).length

  function handleResetClick() {
    if (!confirmingReset) {
      setConfirmingReset(true)
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setConfirmingReset(false), 6000)
      return
    }
    window.clearTimeout(resetTimer.current)
    setConfirmingReset(false)
    onReset()
  }

  async function handleDownload() {
    setDownloadError('')
    setGenerating(true)
    try {
      await onDownloadCertificate()
    } catch (error) {
      setDownloadError(
        'Sorry — the certificate could not be generated in this browser. Please try again.',
      )
      // eslint-disable-next-line no-console
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-white"
                aria-hidden="true"
              >
                <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
                <path d="M9.2 12.2l2 2 3.6-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{BRAND_NAME}</p>
              <p className="truncate text-xs text-slate-500">Signed in as {learnerName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetClick}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              confirmingReset
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
            }`}
          >
            {confirmingReset ? 'Tap again to confirm' : 'Switch user / reset'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label-caps">Your progress</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back, {learnerName.split(' ')[0]}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-accent-600">
                {percent}%
              </p>
              <p className="text-xs text-slate-400">of the course watched</p>
            </div>
          </div>

          <ProgressBar
            value={progress.ratio}
            className="mt-6"
            heightClass="h-2.5"
            label="Overall course completion"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {completedCount} of {COURSE_MODULES.length} modules complete
            </span>
            <span className="tabular-nums">
              {formatClock(watchedTotal)} watched of {formatClock(durationTotal)}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
            <button type="button" className="btn-primary" onClick={() => onOpenModule(nextModule.id)}>
              <PlayIcon className="h-4 w-4" />
              {completedCount === 0 ? 'Start first module' : 'Continue course'}
            </button>
            <p className="text-xs text-slate-400">
              Next up · {nextModule.title}
            </p>
          </div>
        </section>

        {/* ---- Certificate state ------------------------------------------- */}
        {certificateReady ? (
          <section className="card mt-6 overflow-hidden border-accent-200">
            <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <SealIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="label-caps text-accent-500">Certificate ready</p>
                  <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
                    You&rsquo;ve completed the course
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Download your certificate of completion
                    {completedAt ? ` — awarded ${formatLongDate(completedAt)}.` : '.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary shrink-0"
                onClick={handleDownload}
                disabled={generating}
              >
                {generating ? 'Preparing PDF…' : 'Download certificate'}
              </button>
            </div>
            {downloadError ? (
              <p className="border-t border-red-100 bg-red-50 px-6 py-3 text-xs font-medium text-red-600 sm:px-8">
                {downloadError}
              </p>
            ) : null}
          </section>
        ) : (
          <section className="card mt-6 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <LockIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="label-caps">Certificate locked</p>
                <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
                  Watch 80% to unlock your certificate
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  You&rsquo;re {percent}% of the way there — {Math.max(0, Math.round((80 - percent) * 10) / 10)}%
                  to go.
                </p>
                <ProgressBar value={progress.ratio / 0.8} className="mt-4 max-w-sm" />
              </div>
            </div>
          </section>
        )}

        {/* ---- Module list -------------------------------------------------- */}
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Course modules</h2>
            <p className="text-xs text-slate-400">{COURSE_MODULES.length} videos</p>
          </div>

          <ul className="space-y-2.5">
            {COURSE_MODULES.map((module, index) => {
              const ratio = perModule[module.id] || 0
              const isComplete = ratio >= 0.999
              const isStarted = ratio > 0

              return (
                <li key={module.id}>
                  <button
                    type="button"
                    onClick={() => onOpenModule(module.id)}
                    className="card group flex w-full items-center gap-4 p-4 text-left transition
                      hover:border-accent-200 hover:bg-accent-50/40 sm:p-5"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                        isComplete
                          ? 'bg-accent-600 text-white'
                          : isStarted
                            ? 'bg-accent-50 text-accent-600'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isComplete ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        String(index + 1).padStart(2, '0')
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {module.title}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium tabular-nums ${
                            isComplete ? 'text-accent-600' : 'text-slate-400'
                          }`}
                        >
                          {Math.round(ratio * 100)}%
                        </span>
                      </span>
                      <ProgressBar
                        value={ratio}
                        className="mt-2.5"
                        heightClass="h-1.5"
                        label={`${module.title} progress`}
                      />
                    </span>

                    <span className="hidden shrink-0 text-slate-300 transition group-hover:text-accent-500 sm:block">
                      <PlayIcon className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 pb-4">
          <p className="text-xs leading-relaxed text-slate-400">
            {BRAND_NAME} · {COURSE_MODULES.length} modules · progress is saved in this browser only.
          </p>
        </footer>
      </main>
    </div>
  )
}

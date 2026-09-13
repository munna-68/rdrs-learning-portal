import { COURSE_MODULES } from '../config/course'
import { formatApproxDuration, formatClock } from '../lib/progress'
import ProgressBar from './ProgressBar'
import YouTubePlayer from './YouTubePlayer'

function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function VideoView({
  module,
  index,
  watchedSeconds,
  durationSeconds,
  ratio,
  onWatchedTick,
  onDuration,
  onBack,
  onOpenModule,
}) {
  const previous = index > 0 ? COURSE_MODULES[index - 1] : null
  const next = index < COURSE_MODULES.length - 1 ? COURSE_MODULES[index + 1] : null
  const remaining = Math.max(0, durationSeconds - watchedSeconds)

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm
              font-medium text-slate-600 transition hover:bg-slate-200/60 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </button>
          <p className="ml-auto truncate text-xs text-slate-400">
            Module {index + 1} of {COURSE_MODULES.length}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
        <p className="label-caps">
          Module {String(index + 1).padStart(2, '0')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {module.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{module.summary}</p>

        <div className="mt-7">
          {/* Keyed on the module so switching modules builds a fresh player. */}
          <YouTubePlayer
            key={module.id}
            videoId={module.youtubeId}
            title={module.title}
            onWatchedTick={onWatchedTick}
            onDuration={onDuration}
          />
        </div>

        <section className="card mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="label-caps">This video</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                {Math.round(ratio * 100)}%
                <span className="ml-1.5 text-sm font-normal text-slate-400">watched</span>
              </p>
            </div>
            <p className="text-xs tabular-nums text-slate-400">
              {formatClock(watchedSeconds)} of {formatClock(durationSeconds)}
            </p>
          </div>

          <ProgressBar value={ratio} className="mt-4" heightClass="h-2" label="This video's progress" />

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            {ratio >= 0.999
              ? 'Nice — this module is complete.'
              : `${formatApproxDuration(remaining)} of playback left before this module counts as complete.`}{' '}
            Watch time is recorded only while the video is playing.
          </p>
        </section>

        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {previous ? (
            <button type="button" className="btn-secondary" onClick={() => onOpenModule(previous.id)}>
              Previous · {previous.title}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="btn-secondary" onClick={() => onOpenModule(next.id)}>
              Next · {next.title}
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={onBack}>
              Back to dashboard
            </button>
          )}
        </nav>
      </main>
    </div>
  )
}

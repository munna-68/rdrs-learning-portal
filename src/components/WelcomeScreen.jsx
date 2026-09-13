import { useEffect, useRef, useState } from 'react'
import { BRAND_NAME, COURSE_MODULES, COURSE_TITLE, COURSE_SUBTITLE } from '../config/course'

export default function WelcomeScreen({ onStart }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Please enter your full name to continue.')
      inputRef.current?.focus()
      return
    }
    onStart(trimmed)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
              <path d="M9.2 12.2l2 2 3.6-4" />
            </svg>
          </div>
          <p className="label-caps">{BRAND_NAME}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {COURSE_TITLE}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{COURSE_SUBTITLE}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8" noValidate>
          <label htmlFor="learner-name" className="block text-sm font-medium text-slate-700">
            Your full name
          </label>
          <p className="mt-1 text-xs text-slate-400">
            This is the name that will appear on your certificate.
          </p>

          <input
            id="learner-name"
            ref={inputRef}
            type="text"
            value={value}
            autoComplete="name"
            placeholder="e.g. Jane Doe"
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError('')
            }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'learner-name-error' : undefined}
            className={`mt-4 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900
              placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500
              focus:ring-offset-0 ${error ? 'border-red-300' : 'border-slate-200'}`}
          />

          {error ? (
            <p id="learner-name-error" className="mt-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary mt-6 w-full">
            Start Course
          </button>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
            No account, no password, no sign-up. Your name and your progress are stored only in this
            browser, and are never sent anywhere.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {COURSE_MODULES.length} modules · certificate unlocks at 80% completion
        </p>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

/**
 * A very small wrapper around the YouTube IFrame Player API.
 *
 * Why not a plain <iframe>? Because a plain embed gives us no JavaScript handle
 * on playback: we cannot ask "is it playing?" or "where is the playhead?". The
 * IFrame Player API gives us both, which is what real watch-time tracking needs.
 *
 * How watch time is measured
 * --------------------------
 * We do NOT use `getCurrentTime()` as the source of truth, because a learner
 * could drag the scrubber to the end and instantly "watch" the whole video.
 *
 * Instead we accumulate *wall-clock* seconds: on a 1-second poll we measure how
 * much real time has elapsed since the previous poll, and bank it only when the
 * player state is PLAYING. Seeking forward therefore earns nothing, and a
 * single tick is capped (see MAX_TICK_SECONDS) so a suspended tab or a laptop
 * waking from sleep can't dump minutes of credit into the total at once.
 *
 * The parent is responsible for the final clamp against the video's duration.
 */

const POLL_INTERVAL_MS = 1000

/**
 * Largest amount of time a single poll may bank. Protects against throttled
 * timers in a background tab, and against the machine sleeping mid-video.
 */
const MAX_TICK_SECONDS = 3

const API_SRC = 'https://www.youtube.com/iframe_api'

let apiPromise = null

/** Load the IFrame API exactly once per page, no matter how many players mount. */
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    // The API calls this global when it is ready. Chain rather than clobber, in
    // case something else on the page also wants to know.
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous()
      resolve(window.YT)
    }

    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    document.head.appendChild(script)
  })

  return apiPromise
}

export default function YouTubePlayer({ videoId, title, onWatchedTick, onDuration }) {
  const wrapperRef = useRef(null)
  const playerRef = useRef(null)

  // Kept in refs so the long-lived player event handlers and the polling
  // interval always see the newest callbacks without being torn down.
  const callbacksRef = useRef({ onWatchedTick, onDuration })
  const isPlayingRef = useRef(false)
  const lastTickRef = useRef(0)

  useEffect(() => {
    callbacksRef.current = { onWatchedTick, onDuration }
  }, [onWatchedTick, onDuration])

  useEffect(() => {
    let disposed = false
    const wrapper = wrapperRef.current
    if (!wrapper) return undefined

    lastTickRef.current = performance.now()
    isPlayingRef.current = false

    // YT.Player replaces the element it is handed, so give it a fresh child.
    const mount = document.createElement('div')
    mount.style.width = '100%'
    mount.style.height = '100%'
    wrapper.innerHTML = ''
    wrapper.appendChild(mount)

    loadYouTubeIframeApi().then((YT) => {
      if (disposed || !YT || !YT.Player) return

      const origin =
        window.location.protocol === 'http:' || window.location.protocol === 'https:'
          ? window.location.origin
          : undefined

      playerRef.current = new YT.Player(mount, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          ...(origin ? { origin } : {}),
        },
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration()
            if (Number.isFinite(duration) && duration > 0) {
              callbacksRef.current.onDuration(duration)
            }
          },
          onStateChange: (event) => {
            const playing = event.data === YT.PlayerState.PLAYING
            isPlayingRef.current = playing
            // Reset the stopwatch on every transition so time spent paused,
            // buffering, cued or seeking is never credited.
            lastTickRef.current = performance.now()

            if (event.data === YT.PlayerState.ENDED) {
              const duration = event.target.getDuration()
              if (Number.isFinite(duration) && duration > 0) {
                callbacksRef.current.onDuration(duration)
              }
            }
          },
        },
      })
    })

    const intervalId = window.setInterval(() => {
      const now = performance.now()
      const elapsedSeconds = (now - lastTickRef.current) / 1000
      lastTickRef.current = now

      if (!isPlayingRef.current) return

      const delta = Math.min(elapsedSeconds, MAX_TICK_SECONDS)
      if (delta > 0) callbacksRef.current.onWatchedTick(delta)
    }, POLL_INTERVAL_MS)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      isPlayingRef.current = false

      const player = playerRef.current
      playerRef.current = null
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy()
        } catch {
          /* the iframe may already be gone */
        }
      }
      if (wrapper) wrapper.innerHTML = ''
    }
  }, [videoId])

  return (
    <div
      ref={wrapperRef}
      title={title}
      className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900"
    />
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Camera, CameraOff, Hand, ScanFace, ShieldCheck, Square, X } from 'lucide-react'
import { useUI } from '../../store/ui'
import { cn } from '../../lib/utils'

type Mode = 'hand' | 'head'
type Status = 'idle' | 'loading' | 'active' | 'error'

const ROUTES = ['/', '/about', '/projects', '/skills', '/services', '/blog', '/gallery', '/contact']

/**
 * Optional, consent-based gesture navigation.
 *
 * Frames are processed locally with MediaPipe Tasks Vision (WASM). Nothing is
 * recorded, uploaded or stored. The camera is released the moment the session
 * stops, and every gesture has a keyboard/pointer equivalent.
 */
export function GestureController() {
  const open = useUI((s) => s.gestureOpen)
  const toggle = useUI((s) => s.toggleGestures)
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('hand')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gesture, setGesture] = useState<string>('—')
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const lastSeenRef = useRef<{ x: number; t: number } | null>(null)
  const cooldownRef = useRef(0)
  const holdRef = useRef<{ dir: string; since: number } | null>(null)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    detectorRef.current?.close?.()
    detectorRef.current = null
    lastSeenRef.current = null
    holdRef.current = null
    setStatus('idle')
    setGesture('—')
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!open) stop()
    return () => stop()
  }, [open, stop])

  const move = (direction: 'next' | 'prev' | 'top') => {
    if (Date.now() < cooldownRef.current) return
    cooldownRef.current = Date.now() + 1400
    if (direction === 'top') {
      document.getElementById('window-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
      setGesture('Open palm · scroll to top')
      return
    }
    const path = window.location.pathname
    const index = ROUTES.findIndex((route) => (route === '/' ? path === '/' : path.startsWith(route)))
    const nextIndex = direction === 'next' ? Math.min(ROUTES.length - 1, index + 1) : Math.max(0, index - 1)
    setGesture(`${direction === 'next' ? 'Swipe right' : 'Swipe left'} · ${ROUTES[nextIndex]}`)
    navigate(ROUTES[nextIndex])
  }

  const start = async () => {
    setStatus('loading')
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not expose a camera API.')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const vision: any = await import('@mediapipe/tasks-vision')
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      )

      if (mode === 'hand') {
        detectorRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      } else {
        detectorRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
      }

      setStatus('active')
      lastRef.current = 0
      loop()
    } catch (err) {
      stop()
      setStatus('error')
      setError(
        err instanceof Error
          ? `${err.message} Check camera permission and your network connection, then try again.`
          : 'Gesture navigation could not start.'
      )
    }
  }

  const loop = () => {
    const video = videoRef.current
    const detector = detectorRef.current
    if (!video || !detector) return

    const tick = () => {
      if (!streamRef.current) return
      const now = performance.now()
      if (now - lastRef.current > 55 && video.readyState >= 2) {
        lastRef.current = now
        try {
          if (mode === 'hand') {
            const result = detector.detectForVideo(video, now)
            const hand = result?.landmarks?.[0]
            if (hand) {
              const wrist = hand[0]
              const tips = [8, 12, 16, 20]
              const pips = [6, 10, 14, 18]
              const extended = tips.filter((tip, i) => hand[tip].y < hand[pips[i]].y).length
              const spread = Math.abs(hand[20].x - hand[4].x)

              if (extended >= 4 && spread > 0.18) {
                holdRef.current = null
                lastSeenRef.current = null
                setProgress(0)
                move('top')
              } else if (extended <= 1) {
                setGesture('Fist · session paused')
                setProgress(0)
                lastSeenRef.current = null
              } else {
                const previous = lastSeenRef.current
                if (previous) {
                  const dx = wrist.x - previous.x
                  const dt = now - previous.t
                  if (Math.abs(dx) > 0.075 && dt < 700) {
                    lastSeenRef.current = null
                    setProgress(0)
                    move(dx > 0 ? 'next' : 'prev')
                  } else {
                    lastSeenRef.current = { x: wrist.x, t: now }
                  }
                } else {
                  lastSeenRef.current = { x: wrist.x, t: now }
                }
                if (Date.now() >= cooldownRef.current) setGesture(`Tracking hand · x ${wrist.x.toFixed(2)}`)
                setProgress(Math.min(100, Math.abs(wrist.x - 0.5) * 160))
              }
            } else {
              lastSeenRef.current = null
              setProgress(0)
              if (Date.now() >= cooldownRef.current) setGesture('Show your hand to the camera')
            }
          } else {
            const result = detector.detectForVideo(video, now)
            const face = result?.faceLandmarks?.[0]
            if (face) {
              const nose = face[1]
              const left = face[234]
              const right = face[454]
              const width = Math.abs(right.x - left.x) || 1
              const offset = (nose.x - Math.min(left.x, right.x)) / width
              const dir = offset < 0.32 ? 'prev' : offset > 0.68 ? 'next' : null
              if (dir) {
                const hold = holdRef.current
                if (hold?.dir === dir) {
                  const elapsed = Date.now() - hold.since
                  setProgress(Math.min(100, (elapsed / 900) * 100))
                  if (elapsed > 900) {
                    holdRef.current = null
                    setProgress(0)
                    move(dir)
                  }
                } else {
                  holdRef.current = { dir, since: Date.now() }
                }
                setGesture(`Head ${dir === 'prev' ? 'left' : 'right'} · hold to navigate`)
              } else {
                holdRef.current = null
                setProgress(0)
                setGesture('Centre your head')
              }
            } else {
              holdRef.current = null
              setProgress(0)
              setGesture('Face the camera')
            }
          }
        } catch {
          // Frame-level errors are non-fatal; keep the session alive.
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Gesture navigation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              stop()
              toggle(false)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-[var(--stroke-strong)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--stroke)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                  <Hand className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-[13px] font-semibold text-fg">Gesture navigation</h2>
                  <p className="text-[10px] text-[var(--fg-faint)]">Optional · local · instant stop</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stop()
                  toggle(false)
                }}
                className="rounded p-1.5 text-muted hover:bg-white/[0.06] hover:text-fg"
                aria-label="Close gesture navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--stroke)] bg-black/60">
                <video
                  ref={videoRef}
                  className="h-full w-full scale-x-[-1] object-cover"
                  playsInline
                  muted
                  aria-label="Camera preview"
                />
                {status !== 'active' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                    {status === 'loading' ? (
                      <>
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                        <p className="text-[11px] text-muted">Requesting camera and loading the local model…</p>
                      </>
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-[var(--fg-faint)]" />
                        <p className="text-[11.5px] text-muted">
                          Camera is off. Start a session to enable gesture control.
                        </p>
                      </>
                    )}
                  </div>
                )}
                {status === 'active' && (
                  <>
                    <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> PROCESSING LOCALLY
                    </div>
                    <div className="absolute inset-x-2 bottom-2">
                      <div className="mb-1 flex items-center justify-between text-[9px] text-white/70">
                        <span>{gesture}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)] transition-[width] duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {status !== 'active' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('hand')}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                      mode === 'hand' ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--stroke)] hover:border-[var(--stroke-strong)]'
                    )}
                  >
                    <Hand className="h-4 w-4" />
                    <span>
                      <span className="block text-[11.5px] font-medium text-fg">Hand</span>
                      <span className="block text-[9.5px] text-[var(--fg-faint)]">Swipe to navigate</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setMode('head')}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                      mode === 'head' ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--stroke)] hover:border-[var(--stroke-strong)]'
                    )}
                  >
                    <ScanFace className="h-4 w-4" />
                    <span>
                      <span className="block text-[11.5px] font-medium text-fg">Head</span>
                      <span className="block text-[9.5px] text-[var(--fg-faint)]">Tilt and hold</span>
                    </span>
                  </button>
                </div>
              )}

              <ul className="space-y-1.5 rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5 text-[10.5px] leading-relaxed text-muted">
                <li className="flex gap-1.5">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  Frames are processed in this browser with WebAssembly. Nothing is recorded or uploaded, and there is no face
                  identification or biometric storage.
                </li>
                <li>
                  <strong className="text-fg">Hand mode:</strong> swipe right for the next page, swipe left for the previous one,
                  open palm to scroll to the top, fist to pause tracking.
                </li>
                <li>
                  <strong className="text-fg">Head mode:</strong> tilt your head left or right and hold for ~1 second.
                </li>
                <li>Every gesture has a keyboard and pointer equivalent. The site is fully usable without a camera.</li>
              </ul>

              {error && (
                <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-200">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                {status === 'active' ? (
                  <button
                    onClick={stop}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/15 text-[12.5px] font-medium text-rose-300 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/25"
                  >
                    <Square className="h-3.5 w-3.5" /> Stop & release camera
                  </button>
                ) : (
                  <button
                    onClick={start}
                    disabled={status === 'loading'}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[image:linear-gradient(100deg,var(--accent),#22d3ee)] text-[12.5px] font-semibold text-[#05060c] disabled:opacity-60"
                  >
                    <Camera className="h-4 w-4" /> Start camera session
                  </button>
                )}
                <button
                  onClick={() => {
                    stop()
                    toggle(false)
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--stroke)] px-3 text-[12px] text-muted hover:text-fg"
                >
                  <CameraOff className="h-3.5 w-3.5" /> Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

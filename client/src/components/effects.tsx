import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useUI } from '../store/ui'
import { cn } from '../lib/utils'

/* ── Wallpaper ──────────────────────────────────────────────── */

export function Wallpaper({ className }: { className?: string }) {
  const wallpaper = useUI((s) => s.wallpaper)
  const reduceMotion = useUI((s) => s.reduceMotion)
  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 -z-10', className)}>
      <div className={cn('absolute inset-0 wp-' + wallpaper, !reduceMotion && 'animate-drift')} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_30%,rgba(0,0,0,0.35)_100%)] dark:opacity-100 opacity-0" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'120\' height=\'120\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}

/* ── Reveal on scroll ───────────────────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  once = true,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}) {
  const reduceMotion = useUI((s) => s.reduceMotion)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '-40px' })

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Typing text ────────────────────────────────────────────── */

export function TypingText({
  words,
  className,
  typingSpeed = 70,
  deletingSpeed = 35,
  pause = 1700,
}: {
  words: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pause?: number
}) {
  const reduceMotion = useUI((s) => s.reduceMotion)
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduceMotion || words.length === 0) return
    const current = words[index % words.length]
    if (!deleting && text === current) {
      const timer = window.setTimeout(() => setDeleting(true), pause)
      return () => window.clearTimeout(timer)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setIndex((i) => (i + 1) % words.length)
      return
    }
    const timer = window.setTimeout(
      () => setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)),
      deleting ? deletingSpeed : typingSpeed
    )
    return () => window.clearTimeout(timer)
  }, [text, deleting, index, words, reduceMotion, typingSpeed, deletingSpeed, pause])

  return (
    <span className={cn('caret', className)} aria-live="polite">
      {reduceMotion ? words[0] : text}
    </span>
  )
}

/* ── Spotlight cursor glow ──────────────────────────────────── */

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useUI((s) => s.reduceMotion)

  useEffect(() => {
    if (reduceMotion) return
    const media = window.matchMedia('(pointer: fine)')
    if (!media.matches) return
    let frame = 0
    const onMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.background = `radial-gradient(420px circle at ${event.clientX}px ${event.clientY}px, color-mix(in srgb, var(--accent) 9%, transparent), transparent 65%)`
        }
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [reduceMotion])

  if (reduceMotion) return null
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden lg:block" />
}

/* ── Grid backdrop ──────────────────────────────────────────── */

export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 bg-[linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]',
        className
      )}
    />
  )
}

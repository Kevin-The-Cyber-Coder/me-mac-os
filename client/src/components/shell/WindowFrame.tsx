import { forwardRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw, X, Minus } from 'lucide-react'
import { useUI } from '../../store/ui'
import { cn } from '../../lib/utils'

const TITLES: Record<string, string> = {
  '/': 'Desktop',
  '/about': 'About — Mukeshimana Kevin',
  '/projects': 'Projects',
  '/skills': 'Skills & Stack',
  '/services': 'Services',
  '/blog': 'Journal',
  '/gallery': 'Gallery',
  '/contact': 'Contact',
  '/arena-ai': 'ARENA AI',
  '/github': 'GitHub Command Center',
  '/terminal': 'Terminal',
  '/universe': '3D Universe',
  '/login': 'Administrator Sign In',
  '/admin': 'Command Center',
}

export function titleFor(pathname: string) {
  if (pathname.startsWith('/projects/')) return 'Project — Case Study'
  if (pathname.startsWith('/blog/')) return 'Journal — Article'
  if (pathname.startsWith('/admin')) return 'Command Center'
  return TITLES[pathname] || 'Kevin The Cyber Coder'
}

interface WindowFrameProps {
  children: ReactNode
  toolbar?: ReactNode
  bare?: boolean
}

export const WindowFrame = forwardRef<HTMLDivElement, WindowFrameProps>(function WindowFrame(
  { children, toolbar, bare },
  scrollRef
) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theater, toggleTheater, minimized, setMinimized } = useUI()

  return (
    <section
      aria-label="Portfolio window"
      className={cn(
        'relative flex h-full flex-col overflow-hidden border border-[var(--stroke-strong)] bg-[var(--panel)] backdrop-blur-2xl window-shadow',
        theater ? 'rounded-none border-x-0' : 'rounded-xl sm:rounded-2xl'
      )}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-3">
        <div className="group flex items-center gap-1.5">
          <button
            onClick={() => navigate('/')}
            className="grid h-3 w-3 place-items-center rounded-full bg-[#ff5f57] text-[#5c0a06] transition-transform hover:scale-110"
            aria-label="Close window and return to desktop"
            title="Close"
          >
            <X className="h-2 w-2 opacity-0 group-hover:opacity-100" strokeWidth={4} />
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="grid h-3 w-3 place-items-center rounded-full bg-[#febc2e] text-[#5c3a00] transition-transform hover:scale-110"
            aria-label="Minimise window"
            title="Minimise"
          >
            <Minus className="h-2 w-2 opacity-0 group-hover:opacity-100" strokeWidth={4} />
          </button>
          <button
            onClick={toggleTheater}
            className="grid h-3 w-3 place-items-center rounded-full bg-[#28c840] text-[#0a4d16] transition-transform hover:scale-110"
            aria-label={theater ? 'Exit full width' : 'Expand to full width'}
            title="Maximise"
          >
            <Maximize2 className="h-2 w-2 opacity-0 group-hover:opacity-100" strokeWidth={4} />
          </button>
        </div>

        <div className="ml-2 flex items-center gap-0.5">
          <button
            onClick={() => navigate(-1)}
            className="rounded p-1 text-muted transition-colors hover:bg-white/[0.07] hover:text-fg"
            aria-label="Go back"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded p-1 text-muted transition-colors hover:bg-white/[0.07] hover:text-fg"
            aria-label="Go forward"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <h2 className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-center text-[11.5px] font-medium text-[var(--fg-muted)]">
          {titleFor(location.pathname)}
        </h2>

        <div className="ml-auto flex items-center gap-1">
          {toolbar}
          <button
            onClick={toggleTheater}
            className="rounded p-1 text-muted transition-colors hover:bg-white/[0.07] hover:text-fg"
            aria-label={theater ? 'Restore window' : 'Maximise window'}
          >
            {theater ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        id="window-scroll"
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', bare ? '' : 'px-4 py-5 sm:px-6 sm:py-7 lg:px-9')}
      >
        {children}
      </div>

      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="glass-strong absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[11.5px] text-fg shadow-xl"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore window
        </button>
      )}
    </section>
  )
})

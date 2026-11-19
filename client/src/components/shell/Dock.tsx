import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bot,
  Boxes,
  Briefcase,
  FolderKanban,
  Github,
  Home,
  Image,
  Layers,
  Mail,
  Music2,
  PenLine,
  Settings,
  SquareTerminal,
  User,
} from 'lucide-react'
import { useUI } from '../../store/ui'
import { useAuth } from '../../store/auth'
import { useMusic } from '../../store/music'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui'

const ITEMS = [
  { label: 'Home', to: '/', icon: Home, tone: 'from-sky-400 to-blue-600' },
  { label: 'About', to: '/about', icon: User, tone: 'from-violet-400 to-purple-600' },
  { label: 'Projects', to: '/projects', icon: FolderKanban, tone: 'from-amber-400 to-orange-600' },
  { label: 'Skills', to: '/skills', icon: Layers, tone: 'from-emerald-400 to-teal-600' },
  { label: 'Services', to: '/services', icon: Briefcase, tone: 'from-pink-400 to-rose-600' },
  { label: 'Blog', to: '/blog', icon: PenLine, tone: 'from-cyan-400 to-sky-600' },
  { label: 'Gallery', to: '/gallery', icon: Image, tone: 'from-fuchsia-400 to-pink-600' },
  { label: 'Contact', to: '/contact', icon: Mail, tone: 'from-indigo-400 to-blue-700' },
  { label: 'ARENA AI', to: '/arena-ai', icon: Bot, tone: 'from-violet-500 to-cyan-500' },
  { label: 'GitHub', to: '/github', icon: Github, tone: 'from-slate-500 to-slate-800' },
  { label: 'Terminal', to: '/terminal', icon: SquareTerminal, tone: 'from-emerald-500 to-slate-800' },
  { label: 'Universe', to: '/universe', icon: Boxes, tone: 'from-purple-500 to-indigo-800' },
]

export function Dock() {
  const location = useLocation()
  const [mouseX, setMouseX] = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const { toggleMusic, musicOpen } = useUI()
  const admin = useAuth((s) => s.admin)
  const playing = useMusic((s) => s.playing)

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <nav
      aria-label="Dock"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] flex justify-center px-2 pb-[max(10px,env(safe-area-inset-bottom))]"
    >
      <div
        onMouseMove={(e) => setMouseX(e.clientX)}
        onMouseLeave={() => setMouseX(null)}
        className="pointer-events-auto no-scrollbar flex max-w-[min(96vw,780px)] items-end gap-1 overflow-x-auto rounded-2xl border border-[var(--stroke-strong)] bg-[var(--dock)] px-2 pb-1.5 pt-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:gap-1.5 sm:px-3"
      >
        {ITEMS.map((item, index) => {
          const ref = itemRefs.current[index]
          let scale = 1
          if (ref && mouseX !== null) {
            const rect = ref.getBoundingClientRect()
            const center = rect.left + rect.width / 2
            const distance = Math.abs(mouseX - center)
            scale = 1 + Math.max(0, 1 - distance / 150) * 0.32
          }
          const active = isActive(item.to)
          return (
            <div
              key={item.to}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="relative flex flex-col items-center"
              style={{ width: 44 }}
            >
              <Tooltip label={item.label}>
                <motion.div animate={{ scale, y: scale > 1.1 ? -5 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative grid h-10 w-10 place-items-center rounded-[11px] bg-gradient-to-br text-white shadow-lg ring-1 ring-white/20 transition-shadow sm:h-11 sm:w-11',
                      item.tone,
                      active && 'ring-2 ring-white/60'
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.9} />
                    {item.to === '/arena-ai' && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[var(--bg)]" />
                    )}
                  </Link>
                </motion.div>
              </Tooltip>
              <span
                className={cn(
                  'mt-1 h-1 w-1 rounded-full transition-colors',
                  active ? 'bg-[var(--accent)]' : 'bg-transparent'
                )}
              />
            </div>
          )
        })}

        <span className="mx-0.5 h-10 w-px self-center bg-[var(--stroke)]" />

        <div className="relative flex flex-col items-center" style={{ width: 44 }}>
          <Tooltip label="Music">
            <button
              onClick={() => toggleMusic()}
              aria-label="Music player"
              className={cn(
                'grid h-10 w-10 place-items-center rounded-[11px] bg-gradient-to-br from-rose-400 to-purple-700 text-white shadow-lg ring-1 ring-white/20 sm:h-11 sm:w-11',
                (musicOpen || playing) && 'ring-2 ring-white/60'
              )}
            >
              <Music2 className={cn('h-5 w-5', playing && 'animate-pulse')} strokeWidth={1.9} />
            </button>
          </Tooltip>
          <span className={cn('mt-1 h-1 w-1 rounded-full', musicOpen ? 'bg-[var(--accent)]' : 'bg-transparent')} />
        </div>

        <div className="relative flex flex-col items-center" style={{ width: 44 }}>
          <Tooltip label={admin ? 'Command center' : 'Admin'}>
            <Link
              to={admin ? '/admin' : '/login'}
              aria-label={admin ? 'Admin command center' : 'Admin sign in'}
              className={cn(
                'grid h-10 w-10 place-items-center rounded-[11px] bg-gradient-to-br from-slate-500 to-slate-800 text-white shadow-lg ring-1 ring-white/20 sm:h-11 sm:w-11',
                location.pathname.startsWith('/admin') && 'ring-2 ring-white/60'
              )}
            >
              <Settings className="h-5 w-5" strokeWidth={1.9} />
            </Link>
          </Tooltip>
          <span className={cn('mt-1 h-1 w-1 rounded-full', location.pathname.startsWith('/admin') ? 'bg-[var(--accent)]' : 'bg-transparent')} />
        </div>
      </div>
    </nav>
  )
}

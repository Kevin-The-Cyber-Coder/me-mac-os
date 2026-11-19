import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Apple,
  Bell,
  Command,
  Github,
  Hand,
  Info,
  LogOut,
  Menu,
  Moon,
  Music2,
  Search,
  Settings,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react'
import { useUI } from '../../store/ui'
import { useAuth } from '../../store/auth'
import { useNotifications } from '../../store/notifications'
import { useMusic } from '../../store/music'
import { applyTheme, cn } from '../../lib/utils'
import { toast } from '../../lib/toast'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Projects', to: '/projects' },
  { label: 'Skills', to: '/skills' },
  { label: 'Services', to: '/services' },
  { label: 'Blog', to: '/blog' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
]

export function MenuBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clock, setClock] = useState(new Date())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme, togglePalette, toggleNotifications, toggleGestures, toggleMusic, reduceMotion, setReduceMotion, notificationsOpen } =
    useUI()
  const unread = useNotifications((s) => s.unread)
  const admin = useAuth((s) => s.admin)
  const logout = useAuth((s) => s.logout)
  const playing = useMusic((s) => s.playing)
  const muted = useMusic((s) => s.muted)
  const toggleMute = useMusic((s) => s.toggleMute)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setMobileOpen(false), [location.pathname])

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next, useUI.getState().accent, reduceMotion)
  }

  const dateLabel = clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeLabel = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const menus: Record<string, { label: string; action?: () => void; to?: string; divider?: boolean }[]> = {
    File: [
      { label: 'New conversation', action: () => navigate('/arena-ai') },
      { label: 'Download résumé', to: '/resume/Mukeshimana-Kevin-CV.pdf' },
      { divider: true, label: '' },
      { label: 'Admin sign in', to: '/login' },
    ],
    View: [
      { label: 'Toggle theme', action: cycleTheme },
      { label: 'Command palette', action: () => togglePalette(true) },
      { label: 'Reduce motion', action: () => setReduceMotion(!reduceMotion) },
      { label: 'Full screen', action: () => document.documentElement.requestFullscreen?.().catch(() => undefined) },
    ],
    Go: NAV.slice(0, 6).map((item) => ({ label: item.label, to: item.to })),
    Tools: [
      { label: 'ARENA AI', to: '/arena-ai' },
      { label: 'GitHub Command Center', to: '/github' },
      { label: 'Terminal', to: '/terminal' },
      { label: '3D Universe', to: '/universe' },
      { label: 'Gesture navigation', action: () => toggleGestures(true) },
    ],
    Help: [
      { label: 'About this system', to: '/about' },
      { label: 'Contact Kevin', to: '/contact' },
      { label: 'Keyboard shortcuts', action: () => togglePalette(true) },
    ],
  }

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 top-0 z-[90] h-8 select-none border-b border-[var(--stroke)] bg-[var(--dock)] text-[12px] backdrop-blur-2xl"
      role="banner"
    >
      <div className="mx-auto flex h-full max-w-[1800px] items-center gap-1 px-2.5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 font-semibold text-fg transition-colors hover:bg-white/[0.08]"
          aria-label="Kevin The Cyber Coder — home"
        >
          <Apple className="h-3.5 w-3.5" />
          <span className="hidden font-display sm:inline">Kevin</span>
        </button>

        <div className="hidden items-center gap-0.5 lg:flex">
          {Object.keys(menus).map((key) => (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === key ? null : key)}
                className={cn(
                  'rounded px-2 py-0.5 transition-colors hover:bg-white/[0.08]',
                  openMenu === key ? 'bg-white/[0.1] text-fg' : 'text-muted hover:text-fg'
                )}
                aria-expanded={openMenu === key}
                aria-haspopup="menu"
              >
                {key}
              </button>
              <AnimatePresence>
                {openMenu === key && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                    role="menu"
                    className="glass-strong absolute left-0 top-[calc(100%+5px)] min-w-[220px] overflow-hidden rounded-xl p-1.5 shadow-2xl"
                  >
                    {menus[key].map((item, index) =>
                      item.divider ? (
                        <div key={index} className="my-1 h-px bg-[var(--stroke)]" />
                      ) : item.to ? (
                        <Link
                          key={item.label}
                          to={item.to}
                          role="menuitem"
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] text-fg transition-colors hover:bg-[var(--accent-soft)]"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={item.label}
                          role="menuitem"
                          onClick={() => {
                            item.action?.()
                            setOpenMenu(null)
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-fg transition-colors hover:bg-[var(--accent-soft)]"
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="ml-1 hidden items-center gap-2 font-mono text-[10.5px] text-[var(--fg-faint)] xl:flex">
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-emerald-400" />
            online
          </span>
          <span className="text-[var(--stroke-strong)]">/</span>
          <span>kevin@arena</span>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => togglePalette(true)}
            className="hidden items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-muted transition-colors hover:bg-white/[0.08] hover:text-fg sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3 w-3" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded border border-[var(--stroke)] px-1 font-mono text-[9.5px] md:inline">⌘K</kbd>
          </button>

          <button
            onClick={() => toggleGestures(true)}
            className="rounded p-1.5 text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            aria-label="Gesture navigation"
            title="Gesture navigation"
          >
            <Hand className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => toggleMusic()}
            className={cn(
              'rounded p-1.5 transition-colors hover:bg-white/[0.08]',
              playing ? 'text-[color-mix(in_srgb,var(--accent)_85%,white)]' : 'text-muted hover:text-fg'
            )}
            aria-label="Music player"
            title="Music player"
          >
            <Music2 className={cn('h-3.5 w-3.5', playing && 'animate-pulse')} />
          </button>

          <button
            onClick={toggleMute}
            className="hidden rounded p-1.5 text-muted transition-colors hover:bg-white/[0.08] hover:text-fg sm:block"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={cycleTheme}
            className="rounded p-1.5 text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => toggleNotifications()}
            className={cn(
              'relative rounded p-1.5 transition-colors hover:bg-white/[0.08]',
              notificationsOpen ? 'text-fg' : 'text-muted hover:text-fg'
            )}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <Bell className="h-3.5 w-3.5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-3 min-w-3 place-items-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {admin ? (
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'account' ? null : 'account')}
                className="ml-0.5 flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-white/[0.08]"
                aria-label="Account menu"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[image:linear-gradient(120deg,var(--accent),#22d3ee)] text-[8px] font-bold text-[#05060c]">
                  {admin.name.slice(0, 1)}
                </span>
                <span className="hidden max-w-[90px] truncate md:inline">{admin.name}</span>
              </button>
              <AnimatePresence>
                {openMenu === 'account' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="glass-strong absolute right-0 top-[calc(100%+6px)] w-56 rounded-xl p-1.5 shadow-2xl"
                  >
                    <div className="border-b border-[var(--stroke)] px-2.5 pb-2 pt-1">
                      <p className="truncate text-[12px] font-medium text-fg">{admin.name}</p>
                      <p className="truncate text-[10.5px] text-muted">{admin.email}</p>
                      <p className="mt-1 font-mono text-[9.5px] uppercase tracking-widest text-[var(--fg-faint)]">{admin.role}</p>
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setOpenMenu(null)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-fg hover:bg-[var(--accent-soft)]"
                    >
                      <Settings className="h-3.5 w-3.5" /> Command center
                    </Link>
                    <Link
                      to="/admin?module=settings"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-fg hover:bg-[var(--accent-soft)]"
                    >
                      <Info className="h-3.5 w-3.5" /> System settings
                    </Link>
                    <button
                      onClick={async () => {
                        setOpenMenu(null)
                        await logout()
                        toast('Signed out of the command center')
                        navigate('/')
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-rose-300 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 hidden items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted transition-colors hover:bg-white/[0.08] hover:text-fg md:flex"
            >
              <Command className="h-3 w-3" /> Admin
            </Link>
          )}

          <span className="ml-1.5 hidden font-mono text-[10.5px] tabular-nums text-[var(--fg-muted)] sm:inline">
            {dateLabel} {timeLabel}
          </span>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-0.5 rounded p-1.5 text-muted hover:bg-white/[0.08] hover:text-fg lg:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-strong overflow-hidden border-t border-[var(--stroke)] lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="grid grid-cols-2 gap-1 p-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-lg px-3 py-2 text-[12.5px]',
                    location.pathname === item.to ? 'bg-[var(--accent-soft)] text-fg' : 'text-muted hover:bg-white/[0.06]'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/arena-ai" className="rounded-lg px-3 py-2 text-[12.5px] text-muted hover:bg-white/[0.06]">
                ARENA AI
              </Link>
              <Link to="/github" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] text-muted hover:bg-white/[0.06]">
                <Github className="h-3.5 w-3.5" /> GitHub
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Command,
  Copy,
  Download,
  FolderOpen,
  Github,
  Hand,
  Info,
  Keyboard,
  Laptop,
  LogOut,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  PlugZap,
  Power,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sun,
  Terminal as TerminalIcon,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useLaunch } from './launch'
import { APPS } from './apps'
import { AppleLogo } from './mac-icons'
import { useOS } from '../store/os'
import { useUI, type Theme } from '../store/ui'
import { useDesktop } from '../store/desktop'
import { useAuth } from '../store/auth'
import { useSite } from '../store/site'
import { applyTheme, cn } from '../lib/utils'

type Panel = 'wifi' | 'battery' | 'clock' | 'forcequit' | null

interface MenuItem {
  label?: string
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: () => void
  divider?: boolean
  checked?: boolean
  disabled?: boolean
}

function MenuPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.985 }}
      transition={{ duration: 0.13 }}
      className={cn(
        'glass-strong absolute top-[calc(100%+3px)] overflow-hidden rounded-[10px] border border-[var(--stroke-strong)] p-1.5 shadow-2xl',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function MenuBar() {
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const focusedId = useOS((state) => state.focusedId)
  const closeWindow = useOS((state) => state.closeWindow)
  const closeAll = useOS((state) => state.closeAll)
  const minimizeWindow = useOS((state) => state.minimizeWindow)
  const toggleMaximize = useOS((state) => state.toggleMaximize)
  const cycleWindows = useOS((state) => state.cycleWindows)
  const minimizeAll = useOS((state) => state.minimizeAll)
  const focusWindow = useOS((state) => state.focusWindow)
  const { theme, setTheme, reduceMotion, setReduceMotion, togglePalette, toggleControlCenter, controlCenterOpen, toggleNotifications, toggleGestures } = useUI()
  const { dockAutohide, setDockAutohide, showIcons, setShowIcons, showWidgets, setShowWidgets } = useDesktop()
  const admin = useAuth((state) => state.admin)
  const logout = useAuth((state) => state.logout)
  const profile = useSite((state) => state.profile)

  const [clock, setClock] = useState(new Date())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null)
  const [network, setNetwork] = useState<{ online: boolean; type: string; downlink?: number; rtt?: number }>({ online: true, type: 'unknown' })
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 10_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const update = () => setNetwork({ online: navigator.onLine, type: 'unknown' })
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection
    if (connection) {
      setNetwork({
        online: navigator.onLine,
        type: connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        rtt: connection.rtt,
      })
    }
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{
        level: number
        charging: boolean
        addEventListener: (type: string, listener: () => void) => void
        removeEventListener: (type: string, listener: () => void) => void
      }>
    }
    let cleanup: (() => void) | undefined
    nav
      .getBattery?.()
      .then((manager) => {
        const sync = () => setBattery({ level: manager.level, charging: manager.charging })
        sync()
        manager.addEventListener('levelchange', sync)
        manager.addEventListener('chargingchange', sync)
        cleanup = () => {
          manager.removeEventListener('levelchange', sync)
          manager.removeEventListener('chargingchange', sync)
        }
      })
      .catch(() => setBattery(null))
    return () => {
      cleanup?.()
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
        setPanel(null)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setPanel(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const focused = windows.find((win) => win.id === focusedId)
  const activeApp = focused ? APPS[focused.appId as keyof typeof APPS] : APPS.finder

  const setThemeMode = (mode: Theme) => {
    setTheme(mode)
    applyTheme(mode, useUI.getState().accent, reduceMotion)
  }

  const copySelection = () => {
    try {
      document.execCommand('copy')
    } catch {
      /* clipboard may be blocked */
    }
  }

  const downloadResume = () => {
    const link = document.createElement('a')
    link.href = profile?.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf'
    link.download = 'Mukeshimana-Kevin-CV.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'Open Finder', icon: FolderOpen, hint: '⌘N', action: () => launch('finder') },
      { label: 'Open ARENA AI', icon: Info, action: () => launch('arena') },
      { label: 'Download Résumé', icon: Download, action: downloadResume },
      { divider: true },
      { label: 'Close Window', hint: '⌘W', icon: Minimize, disabled: !focused, action: () => focused && closeWindow(focused.id) },
      { label: 'Close All Windows', hint: '⌥⌘W', disabled: !windows.length, action: closeAll },
    ],
    Edit: [
      { label: 'Copy Selection', hint: '⌘C', icon: Copy, action: copySelection },
      { label: 'Spotlight Search…', hint: '⌘K', icon: Search, action: () => togglePalette(true) },
      { divider: true },
      { label: 'Keyboard Shortcuts', icon: Keyboard, action: () => launch('shortcuts') },
    ],
    View: [
      { label: 'Dark Appearance', icon: Moon, checked: theme === 'dark', action: () => setThemeMode('dark') },
      { label: 'Light Appearance', icon: Sun, checked: theme === 'light', action: () => setThemeMode('light') },
      { label: 'Match System', icon: Monitor, checked: theme === 'system', action: () => setThemeMode('system') },
      { divider: true },
      { label: 'Reduce Motion', checked: reduceMotion, action: () => setReduceMotion(!reduceMotion) },
      { label: 'Hide Dock', checked: dockAutohide, action: () => setDockAutohide(!dockAutohide) },
      { label: 'Show Desktop Icons', checked: showIcons, action: () => setShowIcons(!showIcons) },
      { label: 'Show Widgets', checked: showWidgets, action: () => setShowWidgets(!showWidgets) },
      { divider: true },
      { label: 'Enter Full Screen', icon: Maximize, action: () => document.documentElement.requestFullscreen?.().catch(() => undefined) },
      { label: 'Change Wallpaper…', icon: Monitor, action: () => launch('settings', { section: 'wallpaper' }) },
    ],
    Go: [
      { label: 'Home', icon: FolderOpen, action: () => launch('finder') },
      { label: 'Projects', action: () => launch('projects') },
      { label: 'Journal', action: () => launch('blog') },
      { label: 'Gallery', action: () => launch('gallery') },
      { label: 'Contact', action: () => launch('contact') },
      { divider: true },
      { label: 'ARENA AI', action: () => launch('arena') },
      { label: 'GitHub Command Center', icon: Github, action: () => launch('github') },
      { label: 'Terminal', icon: TerminalIcon, action: () => launch('terminal') },
      { label: 'Universe', action: () => launch('universe') },
      { label: 'System Settings', icon: Settings2, action: () => launch('settings') },
    ],
    Window: [
      { label: 'Minimize', hint: '⌘M', icon: Minimize, disabled: !focused, action: () => focused && minimizeWindow(focused.id) },
      { label: 'Zoom', icon: Maximize, disabled: !focused, action: () => focused && toggleMaximize(focused.id) },
      { label: 'Cycle Windows', hint: '⌃`', action: () => cycleWindows(1) },
      { divider: true },
      { label: 'Bring All to Front', action: () => windows.forEach((win) => focusWindow(win.id)) },
      { label: 'Show Desktop', action: minimizeAll },
    ],
    Help: [
      { label: 'Keyboard Shortcuts', icon: Keyboard, action: () => launch('shortcuts') },
      { label: 'About Kevin', icon: UserRound, action: () => launch('about') },
      { label: 'Contact Kevin', action: () => launch('contact') },
      { label: 'ARENA AI Help', action: () => launch('arena') },
      { divider: true },
      { label: 'About This Mac', icon: Laptop, action: () => launch('settings', { section: 'about' }) },
    ],
  }

  const systemMenu: MenuItem[] = [
    { label: 'About This Mac', icon: Laptop, action: () => launch('settings', { section: 'about' }) },
    { label: 'System Settings…', icon: Settings2, action: () => launch('settings') },
    { label: 'Welcome to ARENA OS', action: () => launch('welcome') },
    { label: 'Notification Center', icon: SlidersHorizontal, action: () => toggleNotifications(true) },
    { divider: true },
    { label: 'Force Quit…', hint: '⌥⌘⎋', icon: X, action: () => setPanel('forcequit') },
    { divider: true },
    { label: 'Restart ARENA OS', icon: RotateCcw, action: () => window.location.reload() },
    { label: 'Close All Apps', icon: Power, action: closeAll },
    ...(admin
      ? [{ label: 'Sign Out of Admin', icon: LogOut, action: () => void logout() }]
      : [{ label: 'Admin Sign In', icon: Command, action: () => window.location.assign('/login') }]),
  ]

  const dateLabel = clock
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(',', '')
  const timeLabel = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const batteryIcon = !battery
    ? PlugZap
    : battery.charging
      ? BatteryCharging
      : battery.level < 0.15
        ? BatteryLow
        : battery.level < 0.55
          ? Battery
          : BatteryMedium

  const BatteryIcon = batteryIcon

  const calendarDays = (() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const first = new Date(year, month, 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  })()

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 top-0 z-[120] h-[30px] select-none border-b border-white/[0.08] bg-[#05060c]/45 text-[12px] backdrop-blur-2xl backdrop-saturate-150"
      role="banner"
    >
      <div className="flex h-full items-center gap-0.5 px-2">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'system' ? null : 'system')}
          className={cn(
            'mr-0.5 grid h-5 w-6 place-items-center rounded-[5px] text-white/90 transition-colors hover:bg-white/[0.14]',
            openMenu === 'system' && 'bg-white/[0.14]'
          )}
          aria-label="Apple menu"
          aria-expanded={openMenu === 'system'}
        >
          <AppleLogo className="h-[15px] w-[15px]" />
        </button>

        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'system' ? null : 'system')}
          className={cn(
            'rounded px-2 py-[3px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.1]',
            openMenu === 'system' && 'bg-white/[0.1]'
          )}
        >
          {activeApp.label}
        </button>

        <div className="flex items-center gap-0.5">
          {Object.keys(menus).map((key) => (
            <div key={key} className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === key ? null : key)}
                onMouseEnter={() => {
                  if (openMenu && openMenu !== 'system') setOpenMenu(key)
                }}
                className={cn(
                  'rounded px-2 py-[3px] text-[11.5px] transition-colors',
                  openMenu === key ? 'bg-white/[0.14] text-white' : 'text-white/80 hover:bg-white/[0.1]'
                )}
                aria-expanded={openMenu === key}
                aria-haspopup="menu"
              >
                {key}
              </button>
              <AnimatePresence>
                {openMenu === key && (
                  <MenuPanel className="left-0 w-[242px]">
                    {menus[key].map((item, index) =>
                      item.divider ? (
                        <div key={`divider-${index}`} className="my-1 h-px bg-white/10" />
                      ) : (
                        <button
                          key={item.label}
                          type="button"
                          disabled={item.disabled}
                          onClick={() => {
                            item.action?.()
                            setOpenMenu(null)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[5px] text-left text-[12px] text-white transition-colors hover:bg-[var(--accent)]',
                            item.disabled && 'cursor-default text-white/30 hover:bg-transparent'
                          )}
                        >
                          {item.icon ? <item.icon className="h-3.5 w-3.5 shrink-0 opacity-80" /> : <span className="w-3.5" />}
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.checked && <Check className="h-3 w-3" />}
                          {item.hint && <span className="font-mono text-[9.5px] text-white/45">{item.hint}</span>}
                        </button>
                      )
                    )}
                  </MenuPanel>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5" onMouseEnter={() => openMenu && setOpenMenu(null)}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === 'wifi' ? null : 'wifi')}
              className={cn('menubar-status', panel === 'wifi' && 'bg-white/[0.16] text-white')}
              aria-label={network.online ? 'Network connected' : 'Network offline'}
              title={network.online ? 'Wi-Fi connected' : 'Offline'}
            >
              {network.online ? <Wifi className="h-[15px] w-[15px]" /> : <WifiOff className="h-[15px] w-[15px]" />}
            </button>
            <AnimatePresence>
              {panel === 'wifi' && (
                <MenuPanel className="right-0 w-[286px] p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white">
                      {network.online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-fg">Network</p>
                      <p className="text-[10.5px] text-muted">{network.online ? 'Connected' : 'No internet connection'}</p>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1.5 border-t border-[var(--stroke)] pt-2.5 text-[10.5px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--fg-faint)]">Status</dt>
                      <dd className="text-fg">{network.online ? 'Online' : 'Offline'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--fg-faint)]">Connection</dt>
                      <dd className="font-mono text-fg">{network.type}</dd>
                    </div>
                    {network.downlink != null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-[var(--fg-faint)]">Downlink</dt>
                        <dd className="font-mono text-fg">{network.downlink} Mb/s</dd>
                      </div>
                    )}
                    {network.rtt != null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-[var(--fg-faint)]">Latency</dt>
                        <dd className="font-mono text-fg">{network.rtt} ms</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--fg-faint)]">Host</dt>
                      <dd className="max-w-[150px] truncate font-mono text-fg">{window.location.hostname}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null)
                      launch('settings', { section: 'network' })
                    }}
                    className="mt-3 w-full rounded-md border border-[var(--stroke)] py-1.5 text-[11px] text-fg hover:bg-white/[0.06]"
                  >
                    Network settings…
                  </button>
                  <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-[var(--fg-faint)]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" /> Status is read from the browser. Hardware radio control is not
                    exposed to web apps.
                  </p>
                </MenuPanel>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === 'battery' ? null : 'battery')}
              className={cn('menubar-status gap-1', panel === 'battery' && 'bg-white/[0.16] text-white')}
              aria-label="Battery status"
              title="Battery"
            >
              <BatteryIcon className="h-[17px] w-[17px]" />
              {battery && <span className="font-mono text-[9.5px] text-white/80">{Math.round(battery.level * 100)}%</span>}
            </button>
            <AnimatePresence>
              {panel === 'battery' && (
                <MenuPanel className="right-0 w-[252px] p-3">
                  <div className="flex items-center gap-2">
                    <BatteryIcon className="h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="text-[12px] font-semibold text-fg">
                        {battery ? `${Math.round(battery.level * 100)}%` : 'Power source'}
                      </p>
                      <p className="text-[10.5px] text-muted">
                        {battery ? (battery.charging ? 'Charging' : 'On battery') : 'Battery API unavailable in this browser'}
                      </p>
                    </div>
                  </div>
                  {battery && (
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)]"
                        style={{ width: `${Math.round(battery.level * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--fg-faint)]">
                    Reported by the browser Battery Status API when available. No estimate is fabricated when the API is
                    missing.
                  </p>
                </MenuPanel>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => toggleControlCenter()}
            className={cn('menubar-status', controlCenterOpen && 'bg-white/[0.18] text-white')}
            aria-label="Control Center"
            title="Control Center"
            aria-expanded={controlCenterOpen}
          >
            <SlidersHorizontal className="h-[15px] w-[15px]" />
          </button>

          <button
            type="button"
            onClick={() => togglePalette(true)}
            className="menubar-status"
            aria-label="Spotlight search"
            title="Spotlight search (⌘K)"
          >
            <Search className="h-[15px] w-[15px]" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === 'clock' ? null : 'clock')}
              className={cn(
                'ml-0.5 rounded px-1.5 py-[3px] text-[11px] tabular-nums text-white/90 transition-colors hover:bg-white/[0.1]',
                panel === 'clock' && 'bg-white/[0.16] text-white'
              )}
              aria-label="Date and time"
            >
              <span className="hidden lg:inline">{dateLabel} </span>
              {timeLabel}
            </button>
            <AnimatePresence>
              {panel === 'clock' && (
                <MenuPanel className="right-0 w-[290px] p-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="rounded p-1 text-muted hover:bg-white/10 hover:text-fg"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <p className="font-display text-[12.5px] font-semibold text-fg">
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="rounded p-1 text-muted hover:bg-white/10 hover:text-fg"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <span key={`${day}-${index}`} className="py-1 font-mono text-[8.5px] uppercase text-[var(--fg-faint)]">
                        {day}
                      </span>
                    ))}
                    {calendarDays.map((date) => {
                      const today = date.toDateString() === new Date().toDateString()
                      const muted = date.getMonth() !== calendarMonth.getMonth()
                      return (
                        <span
                          key={date.toISOString()}
                          className={cn(
                            'grid h-7 place-items-center rounded-full text-[10.5px]',
                            muted ? 'text-[var(--fg-faint)]/50' : 'text-[var(--fg-muted)]',
                            today && 'bg-[var(--accent)] font-semibold text-white'
                          )}
                        >
                          {date.getDate()}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-2 border-t border-[var(--stroke)] pt-2 text-[10.5px]">
                    <p className="font-medium text-fg">
                      {clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="font-mono text-[var(--fg-faint)]">{clock.toLocaleTimeString()}</p>
                  </div>
                </MenuPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openMenu === 'system' && (
          <MenuPanel className="left-2 top-[29px] w-[262px]">
            {systemMenu.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="my-1 h-px bg-white/10" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action?.()
                    setOpenMenu(null)
                  }}
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[5px] text-left text-[12px] text-white transition-colors hover:bg-[var(--accent)]"
                >
                  {item.icon ? <item.icon className="h-3.5 w-3.5 opacity-80" /> : <span className="w-3.5" />}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="font-mono text-[9.5px] text-white/45">{item.hint}</span>}
                </button>
              )
            )}
          </MenuPanel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'forcequit' && (
          <MenuPanel className="left-1/2 top-[38px] w-[360px] -translate-x-1/2 p-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-[12.5px] font-semibold text-fg">Force Quit</p>
              <button type="button" onClick={() => setPanel(null)} className="rounded p-1 text-muted hover:text-fg" aria-label="Close">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 max-h-[240px] space-y-1 overflow-y-auto">
              {windows.length === 0 && <p className="py-6 text-center text-[11px] text-muted">No applications are open.</p>}
              {windows.map((win) => {
                const app = APPS[win.appId as keyof typeof APPS]
                return (
                  <div key={win.id} className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] px-2 py-1.5">
                    {app && <app.icon className="h-4 w-4 text-muted" />}
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-fg">{win.title}</span>
                    <button
                      type="button"
                      onClick={() => closeWindow(win.id)}
                      className="rounded border border-rose-500/30 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/10"
                    >
                      Quit
                    </button>
                  </div>
                )
              })}
            </div>
          </MenuPanel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'forcequit' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10 bg-black/30"
            onClick={() => setPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

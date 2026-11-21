import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Battery,
  BatteryCharging,
  Bot,
  ChevronLeft,
  Command,
  FolderOpen,
  Loader2,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { APPS, ALL_APPS, DOCK_APPS, BARE_APPS, findAppForPath, type AppId } from './apps'
import { AppWindow } from './AppWindow'
import { MenuBar } from './MenuBar'
import { DesktopIcons } from './DesktopIcons'
import { DesktopWidgets } from './DesktopWidgets'
import { Dock } from './Dock'
import { Spotlight } from './Spotlight'
import { ControlCenter } from './ControlCenter'
import { NotificationCenter } from './NotificationCenter'
import { AudioEngine } from './AudioEngine'
import { WallpaperLayer } from './wallpapers'
import { useLaunch } from './launch'
import { WindowParamsContext } from './window-context'
import { useOS } from '../store/os'
import { useUI } from '../store/ui'
import { useDesktop } from '../store/desktop'
import { useSite } from '../store/site'
import { useMusic } from '../store/music'
import { GestureController } from '../components/gestures/GestureController'
import { api } from '../lib/api'
import { applyTheme, cn } from '../lib/utils'

function useBattery() {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null)
  useEffect(() => {
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
    return () => cleanup?.()
  }, [])
  return battery
}

function MobileStatusBar() {
  const battery = useBattery()
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 15_000)
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  const BatteryIcon = battery?.charging ? BatteryCharging : Battery

  return (
    <div className="absolute inset-x-0 top-0 z-[30] flex h-[30px] items-center justify-between px-3.5 text-white sm:px-4">
      <span className="font-mono text-[11px] font-semibold tabular-nums">
        {clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </span>
      <span className="flex items-center gap-1.5">
        {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        <BatteryIcon className="h-4 w-4" />
        <span className="font-mono text-[9.5px] tabular-nums">{battery ? `${Math.round(battery.level * 100)}%` : ''}</span>
      </span>
    </div>
  )
}

function MobileAppSheet({
  appId,
  windowId,
  title,
  params,
  onBack,
  onClose,
}: {
  appId: AppId
  windowId: string
  title: string
  params: Record<string, string>
  onBack: () => void
  onClose: () => void
}) {
  const app = APPS[appId]
  const Component = app.component
  const bare = BARE_APPS.has(appId)

  return (
    <motion.div
      key={windowId}
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className="absolute inset-x-0 bottom-0 top-[30px] z-[40] flex flex-col overflow-hidden rounded-t-[20px] border-x border-t border-white/15 bg-[var(--panel-strong)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)]"
      role="dialog"
      aria-label={title}
    >
      <header className="flex h-[46px] shrink-0 items-center gap-2 border-b border-[var(--stroke)] px-2.5 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[12px] font-medium text-[var(--accent)]"
          aria-label="Back to home"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="pointer-events-none absolute left-1/2 flex max-w-[52%] -translate-x-1/2 items-center gap-1.5">
          <app.icon className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
          <span className="truncate text-[11.5px] font-medium text-fg">{title.replace(/ — .*/, '')}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-[var(--fg-muted)]"
          aria-label="Close app"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      <div className={cn('min-h-0 flex-1', bare ? 'overflow-hidden' : 'overflow-y-auto px-4 py-4')}>
        <WindowParamsContext.Provider value={params}>
          <Suspense
            fallback={
              <div className="grid h-full min-h-[200px] place-items-center text-[11.5px] text-muted">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Opening {app.label}…
                </span>
              </div>
            }
          >
            <Component params={params} windowId={windowId} />
          </Suspense>
        </WindowParamsContext.Provider>
      </div>
    </motion.div>
  )
}

function MobileHome() {
  const profile = useSite((state) => state.profile)
  const stats = useSite((state) => state.stats)
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const restoreWindow = useOS((state) => state.restoreWindow)
  const focusWindow = useOS((state) => state.focusWindow)

  const openApp = (appId: AppId) => {
    const appWindows = windows.filter((win) => win.appId === appId)
    const minimized = appWindows.find((win) => win.minimized)
    if (minimized) return restoreWindow(minimized.id)
    if (appWindows.length) return focusWindow([...appWindows].sort((a, b) => b.z - a.z)[0].id)
    launch(appId)
  }

  const dockApps: AppId[] = ['finder', 'projects', 'arena', 'music', 'settings']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-x-0 bottom-0 top-[30px] z-[20] overflow-y-auto pb-[92px]"
    >
      <div className="px-4 pt-3">
        <p className="text-[11px] text-white/60">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight text-white drop-shadow">
          Hello, Kevin
        </h1>
      </div>

      <button
        type="button"
        onClick={() => launch('arena')}
        className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-white/15 bg-black/30 p-3 text-left text-white backdrop-blur-xl"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] text-[#05060c]">
          <Bot className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] font-semibold">Ask ARENA AI</span>
          <span className="block truncate text-[10px] text-white/55">
            Projects, stack, availability — answered from portfolio data
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/50" />
      </button>

      <div className="mx-4 mt-2.5 grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-black/25 p-3 text-white backdrop-blur-xl">
        {[
          { label: 'projects', value: stats?.projects ?? 0 },
          { label: 'articles', value: stats?.posts ?? 0 },
          { label: 'skills', value: stats?.skills ?? 0 },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-display text-[19px] font-semibold leading-none">{item.value}</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 px-3">
        {ALL_APPS.map((app) => {
          const running = windows.some((win) => win.appId === app.id)
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-1 active:bg-white/10"
            >
              <span
                className={cn(
                  'relative grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-gradient-to-br text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.9)] ring-1 ring-white/25',
                  app.tone
                )}
              >
                <app.icon className="h-6 w-6" strokeWidth={1.7} />
                {running && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />}
              </span>
              <span className="line-clamp-2 max-w-[72px] text-center text-[9.5px] font-medium leading-tight text-white drop-shadow">
                {app.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-5 px-4 pb-4 text-center text-[9px] leading-relaxed text-white/40">
        {profile?.location || 'Remote · Worldwide'} · {profile?.availability?.label || 'Available for select projects'}
      </p>

      <div className="fixed inset-x-2 bottom-[max(8px,env(safe-area-inset-bottom))] z-[50] flex items-center justify-around rounded-[22px] border border-white/15 bg-[color-mix(in_srgb,var(--dock)_82%,transparent)] px-1.5 py-2 backdrop-blur-2xl">
        {dockApps.map((appId) => {
          const app = APPS[appId]
          const running = windows.some((win) => win.appId === appId)
          return (
            <button
              key={appId}
              type="button"
              onClick={() => openApp(appId)}
              className="relative grid h-[46px] w-[46px] place-items-center rounded-[13px] bg-gradient-to-br text-white ring-1 ring-white/20"
              aria-label={app.label}
            >
              <span className={cn('absolute inset-0 rounded-[13px] bg-gradient-to-br', app.tone)} />
              <app.icon className="relative h-5 w-5" strokeWidth={1.8} />
              {running && <span className="absolute -bottom-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => launch('trash')}
          className="relative grid h-[46px] w-[46px] place-items-center rounded-[13px] border border-white/20 bg-white/10 text-white"
          aria-label="Trash"
        >
          <TrashIcon />
        </button>
      </div>
    </motion.div>
  )
}

function TrashIcon() {
  return <APPS.trash.icon className="h-5 w-5" strokeWidth={1.7} />
}

export function DesktopEnvironment() {
  const location = useLocation()
  const navigate = useNavigate()
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const focusedId = useOS((state) => state.focusedId)
  const closeWindow = useOS((state) => state.closeWindow)
  const minimizeWindow = useOS((state) => state.minimizeWindow)
  const cycleWindows = useOS((state) => state.cycleWindows)
  const clampAll = useOS((state) => state.clampAll)

  const theme = useUI((state) => state.theme)
  const accent = useUI((state) => state.accent)
  const reduceMotion = useUI((state) => state.reduceMotion)
  const wallpaper = useUI((state) => state.wallpaper)
  const togglePalette = useUI((state) => state.togglePalette)
  const toggleNotifications = useUI((state) => state.toggleNotifications)
  const toggleControlCenter = useUI((state) => state.toggleControlCenter)
  const closeOverlays = useUI((state) => state.closeOverlays)

  const brightness = useDesktop((state) => state.brightness)
  const contrast = useDesktop((state) => state.contrast)
  const showIcons = useDesktop((state) => state.showIcons)
  const focusMode = useDesktop((state) => state.focusMode)
  const setTracks = useMusic((state) => state.setTracks)
  const loadSite = useSite((state) => state.load)

  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
  )
  const [announcement, setAnnouncement] = useState('')
  const openedPath = useRef<string | null>(null)
  /** Paths that have actually owned a window; guards against a same-render race on deep links. */
  const seenPaths = useRef<Set<string>>(new Set())

  // Screen-reader status for window changes; equal strings do not re-announce.
  useEffect(() => {
    if (!windows.length) {
      setAnnouncement('Desktop')
      return
    }
    const focused = windows.find((win) => win.id === focusedId)
    setAnnouncement(focused ? `${focused.title} window is active` : `${windows.length} windows open`)
  }, [windows, focusedId])

  useEffect(() => {
    void loadSite()
  }, [loadSite])

  useEffect(() => {
    let alive = true
    api
      .get('/music', { params: { limit: 100 } })
      .then(({ data }) => {
        if (alive && Array.isArray(data.items)) setTracks(data.items)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [setTracks])

  useEffect(() => {
    applyTheme(theme, accent, reduceMotion)
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      if (useUI.getState().theme === 'system') applyTheme('system', useUI.getState().accent, useUI.getState().reduceMotion)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, accent, reduceMotion])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 860px)')
    const onChange = () => {
      setMobile(media.matches)
      useOS.getState().clampAll()
    }
    media.addEventListener('change', onChange)
    window.addEventListener('resize', clampAll)
    return () => {
      media.removeEventListener('change', onChange)
      window.removeEventListener('resize', clampAll)
    }
  }, [clampAll])

  // URL → window. The desktop itself lives at "/", so a root visit opens nothing.
  useEffect(() => {
    const path = location.pathname
    if (path === '/') {
      openedPath.current = null
      return
    }
    const match = findAppForPath(path)
    const app = APPS[match.appId]
    if (!app) return
    const existing = useOS.getState().windows.find((win) => win.path === path)
    if (existing) {
      // Already open with its own params (deep-link sections, slugs). Focus it
      // instead of reopening and replacing those params with empty ones.
      useOS.getState().focusWindow(existing.id)
      openedPath.current = path
      return
    }
    const params = { ...match.params }
    useOS.getState().openWindow({
      id: app.windowId(params),
      appId: app.id,
      title: app.title(params),
      path: app.path(params),
      params,
      width: app.width,
      height: app.height,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
    })
    openedPath.current = path
  }, [location.pathname])

  // Window → URL. Closing the window that owns the current URL returns to the desktop.
  useEffect(() => {
    const path = location.pathname
    if (path === '/' || openedPath.current !== path) return
    if (windows.some((win) => win.path === path)) {
      // The window exists, so a later close should return to the desktop.
      seenPaths.current.add(path)
      return
    }
    // On a deep link the opener effect runs in the same commit; wait until a
    // window for this path has existed before treating its absence as a close.
    if (!seenPaths.current.has(path)) return
    seenPaths.current.delete(path)
    openedPath.current = null
    navigate('/', { replace: true })
  }, [windows, location.pathname, navigate])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable)
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (mod && key === 'k') {
        event.preventDefault()
        togglePalette()
        return
      }
      if (event.key === 'Escape') {
        closeOverlays()
        return
      }
      if (typing) return
      if (mod && key === 'w') {
        const state = useOS.getState()
        const focused = state.windows.find((win) => win.id === state.focusedId)
        if (focused) {
          event.preventDefault()
          state.closeWindow(focused.id)
        }
        return
      }
      if (mod && key === 'm') {
        const state = useOS.getState()
        const focused = state.windows.find((win) => win.id === state.focusedId)
        if (focused) {
          event.preventDefault()
          state.minimizeWindow(focused.id)
        }
        return
      }
      if (mod && key === ',') {
        event.preventDefault()
        launch('settings')
        return
      }
      if (mod && key === '`') {
        event.preventDefault()
        cycleWindows(1)
        return
      }
      if (mod && event.shiftKey && key === 'c') {
        event.preventDefault()
        toggleControlCenter()
        return
      }
      if (mod && event.shiftKey && key === 'n') {
        event.preventDefault()
        toggleNotifications()
        return
      }
      if (mod && event.shiftKey && key === 'd') {
        event.preventDefault()
        useOS.getState().showDesktop()
        return
      }
      if (mod && /^[1-9]$/.test(event.key)) {
        const appId = DOCK_APPS[Number(event.key) - 1]
        if (appId) {
          event.preventDefault()
          launch(appId)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeOverlays, cycleWindows, launch, toggleControlCenter, toggleNotifications, togglePalette])

  const visibleWindows = useMemo(() => windows.filter((win) => !win.minimized), [windows])
  const activeWindow =
    visibleWindows.find((win) => win.id === focusedId) || visibleWindows[visibleWindows.length - 1] || null

  const goHome = () => {
    if (activeWindow) minimizeWindow(activeWindow.id)
    if (location.pathname !== '/') navigate('/')
  }

  const closeMobile = () => {
    if (activeWindow) closeWindow(activeWindow.id)
    if (location.pathname !== '/') navigate('/')
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#05070f] text-fg"
      style={{ filter: `contrast(${contrast})` }}
    >
      <WallpaperLayer id={wallpaper} dim={focusMode} />

      {mobile ? (
        <>
          <MobileStatusBar />
          <AnimatePresence mode="wait">
            {activeWindow ? (
              <MobileAppSheet
                key={activeWindow.id}
                appId={activeWindow.appId as AppId}
                windowId={activeWindow.id}
                title={activeWindow.title}
                params={activeWindow.params}
                onBack={goHome}
                onClose={closeMobile}
              />
            ) : (
              <MobileHome key="home" />
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          <MenuBar />
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
          {showIcons && <DesktopIcons />}
          {!focusMode && <DesktopWidgets />}

          <main className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
            <AnimatePresence>
              {windows.map((win) => (
                <AppWindow key={win.id} win={win} focused={win.id === focusedId} />
              ))}
            </AnimatePresence>
          </main>

          <Dock />
        </>
      )}

      <Spotlight />
      <ControlCenter />
      <NotificationCenter />
      <GestureController />
      <AudioEngine />

      <div
        className="pointer-events-none fixed inset-0 z-[300] bg-black transition-opacity"
        style={{ opacity: Math.max(0, 1 - brightness) }}
        aria-hidden
      />
    </div>
  )
}

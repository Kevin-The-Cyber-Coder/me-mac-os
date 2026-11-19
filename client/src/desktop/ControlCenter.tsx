import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Bluetooth,
  ChevronLeft,
  Hand,
  Laptop,
  Moon,
  Music2,
  Pause,
  Play,
  SkipForward,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useUI } from '../store/ui'
import { useDesktop } from '../store/desktop'
import { useMusic, useCurrentTrack } from '../store/music'
import { useLaunch } from './launch'
import { applyTheme, cn } from '../lib/utils'

export function ControlCenter() {
  const open = useUI((state) => state.controlCenterOpen)
  const toggleCC = useUI((state) => state.toggleControlCenter)
  const toggleNotifications = useUI((state) => state.toggleNotifications)
  const theme = useUI((state) => state.theme)
  const setTheme = useUI((state) => state.setTheme)
  const reduceMotion = useUI((state) => state.reduceMotion)
  const setReduceMotion = useUI((state) => state.setReduceMotion)
  const toggleGestures = useUI((state) => state.toggleGestures)
  const { brightness, setBrightness, focusMode, setFocusMode } = useDesktop()
  const { volume, muted, setVolume, toggleMute, playing, toggle, next } = useMusic()
  const track = useCurrentTrack()
  const launch = useLaunch()
  const [view, setView] = useState<'main' | 'network'>('main')
  const [online, setOnline] = useState(navigator.onLine)
  const [connection, setConnection] = useState('unknown')

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection
    setConnection(conn?.effectiveType || 'unknown')
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  useEffect(() => {
    if (!open) setView('main')
  }, [open])

  const cycleTheme = () => {
    const nextMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextMode)
    applyTheme(nextMode, useUI.getState().accent, reduceMotion)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-transparent"
            onMouseDown={() => toggleCC(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed right-2 top-[34px] z-[145] w-[min(348px,calc(100vw-1rem))] rounded-[18px] border border-white/15 bg-[color-mix(in_srgb,var(--panel-strong)_88%,transparent)] p-2 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
            role="dialog"
            aria-label="Control Center"
          >
            {view === 'network' ? (
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView('main')}
                    className="rounded p-1 text-muted hover:bg-white/10 hover:text-fg"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-[13px] font-semibold text-fg">Network</p>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-white">
                    {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-fg">{online ? 'Connected' : 'Offline'}</p>
                    <p className="text-[10.5px] text-muted">Browser network · {connection}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-2 px-1 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-[var(--fg-faint)]">Host</dt>
                    <dd className="font-mono text-fg">{window.location.hostname}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--fg-faint)]">Wi-Fi radio</dt>
                    <dd className="text-muted">Managed by your OS</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--fg-faint)]">Bluetooth</dt>
                    <dd className="text-muted">Not available to web apps</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    toggleCC(false)
                    launch('settings', { section: 'network' })
                  }}
                  className="mt-3 w-full rounded-lg border border-[var(--stroke)] py-2 text-[11.5px] text-fg hover:bg-white/[0.06]"
                >
                  Open Network Settings
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_0.85fr] gap-2">
                  <div className="rounded-[13px] bg-white/[0.07] p-2">
                    <button
                      type="button"
                      onClick={() => setView('network')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left hover:bg-white/[0.05]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0a84ff] text-white">
                        {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium text-fg">Wi-Fi</span>
                        <span className="block truncate text-[9.5px] text-muted">{online ? `Connected · ${connection}` : 'Offline'}</span>
                      </span>
                    </button>
                    <div className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 opacity-55">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white">
                        <Bluetooth className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium text-fg">Bluetooth</span>
                        <span className="block truncate text-[9.5px] text-muted">Unavailable in browser</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleCC(false)
                        toggleGestures(true)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left hover:bg-white/[0.05]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white">
                        <Hand className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium text-fg">Gestures</span>
                        <span className="block truncate text-[9.5px] text-muted">Optional camera control</span>
                      </span>
                    </button>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setFocusMode(!focusMode)}
                      className={cn(
                        'flex items-center gap-2 rounded-[13px] p-2 text-left transition-colors',
                        focusMode ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.07] text-fg hover:bg-white/[0.1]'
                      )}
                      aria-pressed={focusMode}
                    >
                      <span className={cn('grid h-7 w-7 place-items-center rounded-full', focusMode ? 'bg-white/20' : 'bg-indigo-500 text-white')}>
                        <Moon className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        <span className="block text-[11.5px] font-medium">Focus</span>
                        <span className={cn('block text-[9.5px]', focusMode ? 'text-white/75' : 'text-muted')}>
                          {focusMode ? 'On' : 'Off'}
                        </span>
                      </span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={cycleTheme}
                        className="flex flex-col items-center justify-center gap-1 rounded-[13px] bg-white/[0.07] p-1.5 text-fg hover:bg-white/[0.1]"
                        aria-label="Toggle appearance"
                      >
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="text-[8.5px] text-muted">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleCC(false)
                          toggleNotifications(true)
                        }}
                        className="flex flex-col items-center justify-center gap-1 rounded-[13px] bg-white/[0.07] p-1.5 text-fg hover:bg-white/[0.1]"
                        aria-label="Notifications"
                      >
                        <Bell className="h-4 w-4" />
                        <span className="text-[8.5px] text-muted">Alerts</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-[13px] bg-white/[0.07] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium text-fg">Display</span>
                    <span className="font-mono text-[9px] text-[var(--fg-faint)]">{Math.round(brightness * 100)}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Sun className="h-3 w-3 text-[var(--fg-faint)]" />
                    <input
                      type="range"
                      min={0.35}
                      max={1.2}
                      step={0.01}
                      value={brightness}
                      onChange={(event) => setBrightness(Number(event.target.value))}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent)]"
                      aria-label="Display brightness"
                    />
                  </div>
                </div>

                <div className="mt-2 rounded-[13px] bg-white/[0.07] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium text-fg">Sound</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleCC(false)
                        launch('settings', { section: 'sound' })
                      }}
                      className="text-[9px] text-[var(--fg-faint)] hover:text-fg"
                    >
                      Settings
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button type="button" onClick={toggleMute} className="text-[var(--fg-faint)] hover:text-fg" aria-label="Mute">
                      {muted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={muted ? 0 : volume}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent)]"
                      aria-label="Sound volume"
                    />
                    <span className="w-6 text-right font-mono text-[9px] text-[var(--fg-faint)]">
                      {Math.round((muted ? 0 : volume) * 100)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2.5 rounded-[13px] bg-white/[0.07] p-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
                    <Music2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-fg">{track?.title || 'ARENA Sound'}</p>
                    <p className="truncate text-[9px] text-[var(--fg-faint)]">{track?.artist || 'Nothing playing'}</p>
                  </div>
                  <button type="button" onClick={toggle} className="rounded p-1 text-fg hover:text-[var(--accent)]" aria-label={playing ? 'Pause' : 'Play'}>
                    {playing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </button>
                  <button type="button" onClick={next} className="rounded p-1 text-fg hover:text-[var(--accent)]" aria-label="Next track">
                    <SkipForward className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[9.5px] transition-colors',
                      reduceMotion ? 'bg-[var(--accent-soft)] text-fg' : 'text-[var(--fg-faint)] hover:text-fg'
                    )}
                    aria-pressed={reduceMotion}
                  >
                    <SlidersHorizontal className="h-2.5 w-2.5" /> reduce motion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleCC(false)
                      launch('settings')
                    }}
                    className="flex items-center gap-1.5 text-[9.5px] text-[var(--fg-faint)] hover:text-fg"
                  >
                    <Laptop className="h-2.5 w-2.5" /> System Settings
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

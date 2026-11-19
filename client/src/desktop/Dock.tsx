import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { APPS, DOCK_APPS } from './apps'
import { useLaunch } from './launch'
import { useOS } from '../store/os'
import { useDesktop } from '../store/desktop'
import { cn } from '../lib/utils'

export function Dock({ mobile = false }: { mobile?: boolean }) {
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const focusedId = useOS((state) => state.focusedId)
  const focusWindow = useOS((state) => state.focusWindow)
  const restoreWindow = useOS((state) => state.restoreWindow)
  const { dockSize, dockMagnify, dockAutohide } = useDesktop()
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [hoverDock, setHoverDock] = useState(false)
  const [showMinimized, setShowMinimized] = useState(false)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const minimized = windows.filter((win) => win.minimized)
  const size = mobile ? 46 : dockSize
  const magnification = mobile ? false : dockMagnify

  const runningIds = useMemo(() => new Set(windows.map((win) => win.appId)), [windows])

  const activate = (appId: (typeof DOCK_APPS)[number]) => {
    const appWindows = windows.filter((win) => win.appId === appId)
    const minimizedWindow = appWindows.find((win) => win.minimized)
    if (minimizedWindow) {
      restoreWindow(minimizedWindow.id)
      return
    }
    if (appWindows.length) {
      const top = appWindows.sort((a, b) => b.z - a.z)[0]
      focusWindow(top.id)
      return
    }
    launch(appId)
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center px-2 pb-[max(7px,env(safe-area-inset-bottom))]',
        mobile && 'pb-1.5'
      )}
      onMouseEnter={() => setHoverDock(true)}
      onMouseLeave={() => {
        setHoverDock(false)
        setMouseX(null)
      }}
    >
      {minimized.length > 0 && (
        <div className={cn('pointer-events-auto mb-1.5', mobile && 'hidden')}>
          <button
            type="button"
            onClick={() => setShowMinimized((value) => !value)}
            className="glass-strong flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] text-[var(--fg-muted)] shadow-lg"
          >
            <ChevronUp className={cn('h-3 w-3 transition-transform', showMinimized && 'rotate-180')} />
            {minimized.length} minimized
          </button>
          {showMinimized && (
            <div className="glass-strong mt-1 flex max-w-[80vw] flex-wrap justify-center gap-1 rounded-xl p-1.5 shadow-2xl">
              {minimized.map((win) => {
                const app = APPS[win.appId as keyof typeof APPS]
                return (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => {
                      restoreWindow(win.id)
                      setShowMinimized(false)
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-2 py-1 text-[10px] text-fg hover:bg-white/[0.06]"
                  >
                    {app && <app.icon className="h-3 w-3" />}
                    <span className="max-w-[150px] truncate">{win.title}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <motion.nav
        aria-label="Dock"
        animate={
          dockAutohide && !hoverDock && !mobile
            ? { y: size + 26, opacity: 0.4 }
            : { y: 0, opacity: 1 }
        }
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onMouseMove={(event) => magnification && setMouseX(event.clientX)}
        className={cn(
          'pointer-events-auto no-scrollbar flex max-w-[min(97vw,920px)] items-end gap-1 overflow-x-auto rounded-[20px] border border-white/20 bg-[var(--dock)] px-2 pb-1.5 pt-1.5 shadow-[0_22px_70px_-18px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:gap-1.5 sm:px-2.5',
          mobile && 'max-w-[100vw] gap-1 rounded-none border-x-0 px-1.5'
        )}
      >
        {DOCK_APPS.map((appId, index) => {
          const app = APPS[appId]
          const Icon = app.icon
          const ref = itemRefs.current[index]
          let scale = 1
          let lift = 0
          if (ref && mouseX !== null && magnification) {
            const rect = ref.getBoundingClientRect()
            const center = rect.left + rect.width / 2
            const distance = Math.abs(mouseX - center)
            const influence = Math.max(0, 1 - distance / 170)
            scale = 1 + influence * 0.52
            lift = influence * 15
          }
          const running = runningIds.has(appId)
          const active = windows.some((win) => win.appId === appId && win.id === focusedId)
          return (
            <div
              key={appId}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="relative flex shrink-0 flex-col items-center"
              style={{ width: size + 6 }}
              onMouseEnter={() => setHovered(appId)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === appId && !mobile && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="pointer-events-none absolute bottom-[calc(100%+11px)] whitespace-nowrap rounded-md border border-white/20 bg-[#0b1020]/85 px-2 py-0.5 text-[10.5px] font-medium text-white shadow-xl backdrop-blur"
                >
                  {app.label}
                </motion.div>
              )}
              <motion.button
                type="button"
                onClick={() => activate(appId)}
                animate={{ scale, y: -lift }}
                transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.5 }}
                style={{ width: size, height: size }}
                className={cn(
                  'relative grid place-items-center rounded-[13px] bg-gradient-to-br text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.9)] ring-1 ring-white/25 transition-shadow hover:ring-white/50',
                  app.tone,
                  active && 'ring-2 ring-white/70'
                )}
                aria-label={app.label}
                title={app.label}
              >
                <Icon style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.85} />
                {appId === 'arena' && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0e1a]" />
                )}
              </motion.button>
              <span
                className={cn(
                  'mt-[3px] h-1 w-1 rounded-full transition-colors',
                  running ? 'bg-white/85' : 'bg-transparent'
                )}
              />
            </div>
          )
        })}

        <span className="mx-0.5 h-10 w-px shrink-0 self-center bg-white/15" />

        <div
          className="relative flex shrink-0 flex-col items-center"
          style={{ width: size + 6 }}
          onMouseEnter={() => setHovered('settings')}
          onMouseLeave={() => setHovered(null)}
        >
          {hovered === 'settings' && !mobile && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none absolute bottom-[calc(100%+11px)] whitespace-nowrap rounded-md border border-white/20 bg-[#0b1020]/85 px-2 py-0.5 text-[10.5px] text-white shadow-xl backdrop-blur"
            >
              System Settings
            </motion.div>
          )}
          <motion.button
            type="button"
            onClick={() => activate('settings')}
            animate={
              magnification && itemRefs.current[DOCK_APPS.length] && mouseX !== null
                ? (() => {
                    const rect = itemRefs.current[DOCK_APPS.length]!.getBoundingClientRect()
                    const influence = Math.max(0, 1 - Math.abs(mouseX - (rect.left + rect.width / 2)) / 170)
                    return { scale: 1 + influence * 0.52, y: -influence * 15 }
                  })()
                : { scale: 1, y: 0 }
            }
            style={{ width: size, height: size }}
            className={cn(
              'grid place-items-center rounded-[13px] bg-gradient-to-br text-white shadow-lg ring-1 ring-white/25',
              APPS.settings.tone,
              runningIds.has('settings') && 'ring-2 ring-white/60'
            )}
            aria-label="System Settings"
            title="System Settings"
          >
            <APPS.settings.icon style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.85} />
          </motion.button>
          <span
            className={cn('mt-[3px] h-1 w-1 rounded-full', runningIds.has('settings') ? 'bg-white/85' : 'bg-transparent')}
          />
        </div>

        <div
          className="relative flex shrink-0 flex-col items-center"
          style={{ width: size + 6 }}
          onMouseEnter={() => setHovered('trash')}
          onMouseLeave={() => setHovered(null)}
        >
          {hovered === 'trash' && !mobile && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none absolute bottom-[calc(100%+11px)] whitespace-nowrap rounded-md border border-white/20 bg-[#0b1020]/85 px-2 py-0.5 text-[10.5px] text-white shadow-xl backdrop-blur"
            >
              Trash
            </motion.div>
          )}
          <motion.button
            type="button"
            onClick={() => activate('trash')}
            style={{ width: size, height: size }}
            className="grid place-items-center rounded-[13px] border border-white/20 bg-white/[0.08] text-white/85 shadow-lg backdrop-blur hover:bg-white/[0.14]"
            aria-label="Trash"
            title="Trash"
          >
            <APPS.trash.icon style={{ width: size * 0.44, height: size * 0.44 }} strokeWidth={1.7} />
          </motion.button>
          <span
            className={cn('mt-[3px] h-1 w-1 rounded-full', runningIds.has('trash') ? 'bg-white/85' : 'bg-transparent')}
          />
        </div>
      </motion.nav>
    </div>
  )
}

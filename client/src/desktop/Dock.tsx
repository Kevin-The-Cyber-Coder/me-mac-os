import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { APPS, DOCK_APPS, type AppId } from './apps'
import { useLaunch } from './launch'
import { useOS } from '../store/os'
import { useDesktop } from '../store/desktop'
import { MAC_DOCK_ICONS } from './mac-icons'
import { cn } from '../lib/utils'

const DOCK_ITEMS: AppId[] = [...DOCK_APPS, 'settings', 'trash']

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
  const [focusIndex, setFocusIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const frameRef = useRef<number | null>(null)
  const pointerX = useRef(0)

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    },
    []
  )

  // Pointer moves fire faster than the display; sample once per frame.
  const onDockMove = (event: ReactMouseEvent<HTMLElement>) => {
    if (!magnification) return
    pointerX.current = event.clientX
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      setMouseX(pointerX.current)
    })
  }

  const minimized = windows.filter((win) => win.minimized)
  const size = mobile ? 46 : dockSize
  const magnification = mobile ? false : dockMagnify

  const runningIds = useMemo(() => new Set(windows.map((win) => win.appId)), [windows])

  const activate = (appId: AppId) => {
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
        'pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center px-2 pb-[max(8px,env(safe-area-inset-bottom))]',
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
            ? { y: size + 26, opacity: 0.35 }
            : { y: 0, opacity: 1 }
        }
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onMouseMove={onDockMove}
        className={cn(
          'pointer-events-auto no-scrollbar flex max-w-[min(97vw,940px)] items-end gap-[3px] overflow-x-auto rounded-[22px] border border-white/25 bg-white/[0.16] px-2 pb-[5px] pt-2 shadow-[0_24px_70px_-18px_rgba(2,6,23,0.85),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-2xl backdrop-saturate-150 sm:gap-1.5 sm:px-2.5',
          mobile && 'max-w-[100vw] gap-1 rounded-none border-x-0 px-1.5'
        )}
      >
        {DOCK_ITEMS.map((appId, index) => {
          const app = APPS[appId]
          const MacIcon = MAC_DOCK_ICONS[appId]
          const Icon = app.icon
          const ref = itemRefs.current[index]
          let scale = 1
          let lift = 0
          if (ref && mouseX !== null && magnification) {
            const rect = ref.getBoundingClientRect()
            const center = rect.left + rect.width / 2
            const distance = Math.abs(mouseX - center)
            const influence = Math.max(0, 1 - distance / 170)
            scale = 1 + influence * 0.55
            lift = influence * 16
          }
          const running = runningIds.has(appId)
          const active = windows.some((win) => win.appId === appId && win.id === focusedId)
          return (
            <Fragment key={appId}>
              {appId === 'trash' && <span className="mx-1 h-9 w-px shrink-0 self-center bg-white/30" />}
              <div
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
                    className="pointer-events-none absolute bottom-[calc(100%+10px)] whitespace-nowrap rounded-md border border-white/25 bg-[#0b1020]/85 px-2 py-0.5 text-[10.5px] font-medium text-white shadow-xl backdrop-blur"
                  >
                    {app.label}
                  </motion.div>
                )}
                <motion.button
                  type="button"
                  ref={(node) => {
                    buttonRefs.current[index] = node
                  }}
                  onClick={() => activate(appId)}
                  onFocus={() => setFocusIndex(index)}
                  onKeyDown={(event) => {
                    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
                    event.preventDefault()
                    const last = DOCK_ITEMS.length - 1
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? last
                          : event.key === 'ArrowRight'
                            ? Math.min(last, index + 1)
                            : Math.max(0, index - 1)
                    setFocusIndex(next)
                    const target = buttonRefs.current[next]
                    target?.focus()
                    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                  }}
                  tabIndex={index === focusIndex ? 0 : -1}
                  animate={{ scale, y: -lift }}
                  transition={{ type: 'spring', stiffness: 430, damping: 24, mass: 0.5 }}
                  style={{ width: size, height: size }}
                  className={cn(
                    'relative grid place-items-center rounded-[16px] transition-[filter,box-shadow] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
                    active && 'ring-2 ring-white/60 ring-offset-0'
                  )}
                  aria-label={running ? `${app.label}, running` : app.label}
                  aria-current={active ? 'true' : undefined}
                  title={app.label}
                >
                  {MacIcon ? (
                    <MacIcon className="h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]" />
                  ) : (
                    <span
                      className={cn(
                        'grid h-full w-full place-items-center rounded-[13px] bg-gradient-to-br text-white ring-1 ring-white/25',
                        app.tone
                      )}
                    >
                      <Icon style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.85} />
                    </span>
                  )}
                  {appId === 'arena' && (
                    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0e1a]" />
                  )}
                </motion.button>
                <span
                  className={cn(
                    'mt-[2px] h-1 w-1 rounded-full transition-colors',
                    running ? 'bg-white/85' : 'bg-transparent'
                  )}
                />
              </div>
            </Fragment>
          )
        })}
      </motion.nav>
    </div>
  )
}

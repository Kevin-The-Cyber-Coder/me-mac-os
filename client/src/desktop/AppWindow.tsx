import { Suspense, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { APPS, BARE_APPS, type AppId } from './apps'
import { WindowParamsContext } from './window-context'
import { useOS, type OSWindow, type WindowRect } from '../store/os'
import { cn } from '../lib/utils'

const BARE = BARE_APPS

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLES: { dir: Handle; className: string }[] = [
  { dir: 'n', className: 'left-3 right-3 -top-1 h-2 cursor-ns-resize' },
  { dir: 's', className: 'left-3 right-3 -bottom-1 h-2 cursor-ns-resize' },
  { dir: 'e', className: 'top-3 bottom-3 -right-1 w-2 cursor-ew-resize' },
  { dir: 'w', className: 'top-3 bottom-3 -left-1 w-2 cursor-ew-resize' },
  { dir: 'ne', className: '-right-1.5 -top-1.5 h-4 w-4 cursor-nesw-resize' },
  { dir: 'nw', className: '-left-1.5 -top-1.5 h-4 w-4 cursor-nwse-resize' },
  { dir: 'se', className: '-bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize' },
  { dir: 'sw', className: '-bottom-1.5 -left-1.5 h-4 w-4 cursor-nesw-resize' },
]

export function AppWindow({ win, focused }: { win: OSWindow; focused: boolean }) {
  const app = APPS[win.appId as keyof typeof APPS]
  const focusWindow = useOS((s) => s.focusWindow)
  const closeWindow = useOS((s) => s.closeWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const setRect = useOS((s) => s.setRect)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const gesture = useRef<{
    pointerId: number
    startX: number
    startY: number
    rect: WindowRect
    handle?: Handle
  } | null>(null)

  if (!app) return null

  const Component = app.component

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return
    event.preventDefault()
    focusWindow(win.id)
    if (win.maximized) return
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect: win.rect,
    }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const beginResize = (event: ReactPointerEvent<HTMLDivElement>, handle: Handle) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    focusWindow(win.id)
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect: win.rect,
      handle,
    }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setResizing(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    const minW = app.minWidth
    const minH = app.minHeight
    const area = { top: 30, left: 0, right: window.innerWidth, bottom: window.innerHeight - 8 }

    if (!current.handle) {
      const x = Math.min(
        Math.max(current.rect.x + dx, -current.rect.w + 140),
        area.right - 140
      )
      const y = Math.min(
        Math.max(current.rect.y + dy, area.top),
        area.bottom - 44
      )
      setRect(win.id, { ...current.rect, x, y })
      return
    }

    let { x, y, w, h } = current.rect
    const dir = current.handle
    if (dir.includes('e')) w = current.rect.w + dx
    if (dir.includes('s')) h = current.rect.h + dy
    if (dir.includes('w')) {
      w = current.rect.w - dx
      x = current.rect.x + dx
    }
    if (dir.includes('n')) {
      h = current.rect.h - dy
      y = current.rect.y + dy
    }
    if (w < minW) {
      if (dir.includes('w')) x -= minW - w
      w = minW
    }
    if (h < minH) {
      if (dir.includes('n')) y -= minH - h
      h = minH
    }
    x = Math.max(-w + 140, x)
    y = Math.max(area.top, y)
    w = Math.min(w, area.right - Math.max(0, x) + (x < 0 ? -x : 0))
    h = Math.min(h, area.bottom - Math.max(area.top, y))
    setRect(win.id, { x, y, w, h })
  }

  const endGesture = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gesture.current || gesture.current.pointerId !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    setResizing(false)
  }

  return (
    <motion.section
      role="dialog"
      aria-label={win.title}
      aria-modal={false}
      initial={{ opacity: 0, scale: 0.965, y: 14 }}
      animate={
        win.minimized
          ? { opacity: 0, scale: 0.78, y: 220 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.92, y: 40 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
      onPointerDown={() => focusWindow(win.id)}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      className={cn(
        'pointer-events-auto absolute flex flex-col overflow-hidden border border-[var(--stroke-strong)] bg-[var(--panel-strong)] backdrop-blur-2xl',
        win.maximized ? 'rounded-none' : 'rounded-[13px]',
        focused ? 'window-shadow window-focused' : 'window-shadow-soft',
        win.minimized && 'pointer-events-none'
      )}
      style={{
        left: win.rect.x,
        top: win.rect.y,
        width: win.rect.w,
        height: win.rect.h,
        zIndex: win.z,
      }}
    >
      <header
        onPointerDown={beginDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
        className={cn(
          'group relative flex h-[38px] shrink-0 select-none items-center gap-2 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-3',
          dragging ? 'cursor-grabbing' : 'cursor-default'
        )}
      >
        <div className="flex items-center gap-[7px]">
          <button
            type="button"
            onClick={() => closeWindow(win.id)}
            className="traffic-light bg-[#ff5f57] text-[#5c0a06] hover:brightness-110"
            aria-label={`Close ${win.title}`}
            title="Close"
          >
            <X className="h-[7px] w-[7px] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={4} />
          </button>
          <button
            type="button"
            onClick={() => minimizeWindow(win.id)}
            className="traffic-light bg-[#febc2e] text-[#5c3a00] hover:brightness-110"
            aria-label={`Minimize ${win.title}`}
            title="Minimize"
          >
            <Minus className="h-[7px] w-[7px] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={4} />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximize(win.id)}
            className="traffic-light bg-[#28c840] text-[#0a4d16] hover:brightness-110"
            aria-label={win.maximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
            title={win.maximized ? 'Restore' : 'Maximize'}
          >
            {win.maximized ? (
              <Minimize2 className="h-[7px] w-[7px] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={4} />
            ) : (
              <Maximize2 className="h-[7px] w-[7px] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={4} />
            )}
          </button>
        </div>

        <div className="pointer-events-none absolute left-1/2 flex max-w-[58%] -translate-x-1/2 items-center gap-1.5">
          <app.icon className="h-3.5 w-3.5 shrink-0 text-[var(--fg-faint)]" />
          <h2 className="truncate text-[12px] font-medium text-[var(--fg-muted)]">{win.title}</h2>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)] sm:inline">
            {app.subtitle}
          </span>
        </div>
      </header>

      <div
        className={cn(
          'relative min-h-0 flex-1',
          BARE.has(win.appId as AppId) ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6'
        )}
      >
        <WindowParamsContext.Provider value={win.params}>
          <Suspense
            fallback={
              <div className="grid h-full min-h-[180px] place-items-center">
                <div className="flex items-center gap-2 text-[11.5px] text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Opening {app.label}…
                </div>
              </div>
            }
          >
            <Component params={win.params} windowId={win.id} />
          </Suspense>
        </WindowParamsContext.Provider>
      </div>

      {!win.maximized &&
        HANDLES.map((handle) => (
          <div
            key={handle.dir}
            onPointerDown={(event) => beginResize(event, handle.dir)}
            className={cn('absolute z-10', handle.className)}
            aria-hidden
          />
        ))}

      <AnimatePresence>
        {resizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-1.5 right-2 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/80"
          >
            {Math.round(win.rect.w)} × {Math.round(win.rect.h)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

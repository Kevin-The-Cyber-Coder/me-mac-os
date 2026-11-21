import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  FolderOpen,
  Grid2X2,
  Image as ImageIcon,
  RotateCcw,
  Settings2,
  SquareTerminal,
  Undo2,
} from 'lucide-react'
import { APPS, DESKTOP_APPS, type AppId } from './apps'
import { useLaunch } from './launch'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { useDesktop, type IconSize } from '../store/desktop'
import { useOS } from '../store/os'
import { MAC_ICONS } from './mac-icons'
import { cn } from '../lib/utils'

const CELL: Record<IconSize, { w: number; h: number; tile: number; label: string }> = {
  small: { w: 100, h: 106, tile: 58, label: 'text-[10.5px]' },
  medium: { w: 116, h: 122, tile: 68, label: 'text-[11.5px]' },
  large: { w: 128, h: 136, tile: 76, label: 'text-[12px]' },
}

const COLUMNS = 3

export function DesktopIcons() {
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const minimizeAllWindows = useOS((state) => state.minimizeAll)
  const { iconPositions, hiddenIcons, discardedIcons, autoArrange, iconSize, setIconPosition, setAutoArrange, clearIconPositions, hideIcon, restoreIcons, setShowIcons } =
    useDesktop()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [drag, setDrag] = useState<{ id: AppId; x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; appId?: AppId } | null>(null)
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const dragRef = useRef(drag)
  dragRef.current = drag
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    let frame: number | null = null
    const sync = () => {
      frame = null
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    }
    const onResize = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(sync)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])

  const cell = CELL[iconSize]
  const visible = useMemo(
    () => DESKTOP_APPS.filter((id) => !hiddenIcons.includes(id) && !discardedIcons.includes(id)),
    [hiddenIcons, discardedIcons]
  )
  const rowCount = Math.max(1, Math.ceil(visible.length / COLUMNS))
  // Keep all icons on screen on short displays by tightening the row rhythm.
  const rowStep = Math.min(cell.h, Math.max(cell.h * 0.72, (viewport.h - 178) / rowCount))
  const rightMargin = 22

  const positionFor = useCallback(
    (id: AppId, index: number) => {
      const stored = iconPositions[id]
      if (stored && !autoArrange) {
        return {
          x: Math.min(Math.max(stored.x, 6), viewport.w - cell.w - 6),
          y: Math.min(Math.max(stored.y, 34), viewport.h - cell.h - 96),
        }
      }
      const column = index < 9 ? index % COLUMNS : (index - 9) % 2
      const row = index < 9 ? Math.floor(index / COLUMNS) : 3 + Math.floor((index - 9) / 2)
      return {
        x: viewport.w - rightMargin - cell.w - (COLUMNS - 1 - column) * cell.w,
        y: 46 + row * rowStep,
      }
    },
    [autoArrange, cell.h, cell.w, iconPositions, rightMargin, rowStep, viewport.h, viewport.w]
  )

  // Positions only change when the grid inputs change, not while dragging.
  const layout = useMemo(
    () => visible.map((id, index) => ({ id, index, ...positionFor(id, index) })),
    [positionFor, visible]
  )

  const desktopMenu: ContextMenuItem[] = [
    {
      label: 'Arrange Icons',
      icon: Grid2X2,
      action: () => {
        setAutoArrange(true)
        clearIconPositions()
      },
    },
    { label: 'Reset Icon Positions', icon: RotateCcw, action: () => { clearIconPositions(); setAutoArrange(true) } },
    ...(hiddenIcons.length ? [{ label: 'Restore Desktop Icons', icon: Undo2, action: restoreIcons }] : []),
    { divider: true },
    {
      label: 'Change Wallpaper…',
      icon: ImageIcon,
      action: () => launch('settings', { section: 'wallpaper' }),
    },
    { label: 'Open Finder', icon: FolderOpen, action: () => launch('finder') },
    { label: 'Open Terminal', icon: SquareTerminal, action: () => launch('terminal') },
    { label: 'System Settings…', icon: Settings2, action: () => launch('settings') },
    { divider: true },
    { label: 'Hide Desktop Icons', action: () => setShowIcons(false) },
    { label: 'Show Desktop', action: minimizeAllWindows },
  ]

  const iconMenu: ContextMenuItem[] = menu?.appId
    ? [
        { label: 'Open', action: () => launch(menu.appId as AppId) },
        {
          label: 'Open in Finder',
          icon: FolderOpen,
          action: () => launch('finder'),
        },
        {
          label: 'Change Wallpaper…',
          icon: ImageIcon,
          action: () => launch('settings', { section: 'wallpaper' }),
        },
        { divider: true },
        { label: 'Remove from Desktop', danger: true, action: () => hideIcon(menu.appId as AppId) },
      ]
    : desktopMenu

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, id: AppId, x: number, y: number) => {
    if (event.button !== 0) return
    setSelected(id)
    setDrag({ id, x, y, startX: event.clientX, startY: event.clientY, moved: false })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current
    if (!current) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    const x = Math.min(Math.max(current.x + dx, 6), viewport.w - cell.w - 6)
    const y = Math.min(Math.max(current.y + dy, 34), viewport.h - cell.h - 96)
    const next = { ...current, x, y, moved: true }
    setDrag(next)
  }

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current
    if (!current) return
    if (current.moved) {
      setIconPosition(current.id, { x: current.x, y: current.y })
      setAutoArrange(false)
    }
    setDrag(null)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const running = useMemo(() => new Set(windows.map((win) => win.appId)), [windows])

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-[30px] z-[4]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null)
      }}
      onContextMenu={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY })
      }}
    >
      {layout.map(({ id, index, x, y }) => {
        const app = APPS[id]
        const base = { x, y }
        const active = drag?.id === id ? { x: drag.x, y: drag.y } : base
        const MacIcon = MAC_ICONS[id]
        return (
          <button
            key={id}
            type="button"
            ref={(node) => {
              itemRefs.current[id] = node
            }}
            onPointerDown={(event) => startDrag(event, id, base.x, base.y)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => setDrag(null)}
            onDoubleClick={() => launch(id)}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setSelected(id)
              setMenu({ x: event.clientX, y: event.clientY, appId: id })
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                launch(id)
                return
              }
              const columns = index < 9 ? COLUMNS : 2
              let nextIndex = index
              if (event.key === 'ArrowRight') nextIndex = Math.min(visible.length - 1, index + 1)
              else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1)
              else if (event.key === 'ArrowDown') nextIndex = Math.min(visible.length - 1, index + columns)
              else if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - columns)
              else if (event.key === 'Home') nextIndex = 0
              else if (event.key === 'End') nextIndex = visible.length - 1
              else return
              event.preventDefault()
              const nextId = visible[nextIndex]
              if (!nextId) return
              setSelected(nextId)
              itemRefs.current[nextId]?.focus()
            }}
            onFocus={() => setSelected(id)}
            tabIndex={selected === id || (!selected && index === 0) ? 0 : -1}
            aria-label={`${app.label} — double click to open`}
            className={cn(
              'group absolute flex flex-col items-center gap-[3px] rounded-[7px] px-1 pb-1 pt-0.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
              drag?.id === id ? 'cursor-grabbing' : 'cursor-default',
              selected === id && 'bg-white/[0.14] ring-1 ring-white/25'
            )}
            style={{ left: active.x, top: active.y, width: cell.w }}
          >
            <span
              className="relative grid place-items-center transition-[transform,filter] duration-200 ease-out group-hover:-translate-y-[3px] group-hover:scale-[1.06] group-focus-visible:-translate-y-[2px] group-active:scale-[0.98]"
              style={{ width: cell.tile, height: cell.tile }}
            >
              {MacIcon ? (
                <MacIcon className="h-full w-full drop-shadow-[0_5px_9px_rgba(0,0,0,0.42)]" />
              ) : (
                <span
                  className={cn(
                    'grid h-full w-full place-items-center rounded-[14px] bg-gradient-to-br text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.75)] ring-1 ring-white/25',
                    app.tone
                  )}
                >
                  <app.icon style={{ width: cell.tile * 0.48, height: cell.tile * 0.48 }} strokeWidth={1.8} />
                </span>
              )}
              {running.has(id) && (
                <span className="absolute -bottom-[3px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
              )}
            </span>
            <span
              className={cn(
                'line-clamp-2 max-w-full px-0.5 font-semibold leading-[1.25] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]',
                cell.label,
                selected === id && 'rounded-[4px] bg-[#0a6fe8] px-1.5 text-white drop-shadow-none'
              )}
            >
              {app.label}
            </span>
          </button>
        )
      })}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={iconMenu}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

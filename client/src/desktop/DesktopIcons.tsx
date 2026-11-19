import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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
import { cn } from '../lib/utils'

const CELL: Record<IconSize, { w: number; h: number; tile: number; label: string }> = {
  small: { w: 80, h: 78, tile: 44, label: 'text-[10px]' },
  medium: { w: 94, h: 92, tile: 54, label: 'text-[11px]' },
  large: { w: 108, h: 104, tile: 64, label: 'text-[11.5px]' },
}

export function DesktopIcons() {
  const launch = useLaunch()
  const windows = useOS((state) => state.windows)
  const minimizeAllWindows = useOS((state) => state.minimizeAll)
  const { iconPositions, hiddenIcons, discardedIcons, autoArrange, iconSize, setIconPosition, setAutoArrange, clearIconPositions, hideIcon, arrangeIcons, restoreIcons, setShowIcons } =
    useDesktop()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [drag, setDrag] = useState<{ id: AppId; x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; appId?: AppId } | null>(null)
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const dragRef = useRef(drag)
  dragRef.current = drag

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cell = CELL[iconSize]
  const rows = Math.max(1, Math.floor((viewport.h - 150) / cell.h))
  const visible = DESKTOP_APPS.filter((id) => !hiddenIcons.includes(id) && !discardedIcons.includes(id))

  const positionFor = useCallback(
    (id: AppId, index: number) => {
      const stored = iconPositions[id]
      if (stored && !autoArrange) {
        return {
          x: Math.min(Math.max(stored.x, 6), viewport.w - cell.w - 6),
          y: Math.min(Math.max(stored.y, 36), viewport.h - cell.h - 100),
        }
      }
      const col = Math.floor(index / rows)
      const row = index % rows
      return {
        x: viewport.w - 14 - cell.w - col * cell.w,
        y: 44 + row * cell.h,
      }
    },
    [autoArrange, cell.h, cell.w, iconPositions, rows, viewport.h, viewport.w]
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
    const y = Math.min(Math.max(current.y + dy, 36), viewport.h - cell.h - 100)
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

  const running = new Set(windows.map((win) => win.appId))

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-[38px] z-[4]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null)
      }}
      onContextMenu={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY })
      }}
    >
      {visible.map((id, index) => {
        const app = APPS[id]
        const base = positionFor(id, index)
        const active = drag?.id === id ? { x: drag.x, y: drag.y } : base
        const Icon = app.icon
        return (
          <button
            key={id}
            type="button"
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
              }
            }}
            aria-label={`${app.label} — double click to open`}
            className={cn(
              'group absolute flex w-[94px] flex-col items-center gap-1 rounded-lg px-1 pb-1 pt-1.5 text-center outline-none transition-colors',
              drag?.id === id ? 'cursor-grabbing' : 'cursor-default',
              selected === id && 'bg-white/[0.12] ring-1 ring-white/20'
            )}
            style={{ left: active.x, top: active.y, width: cell.w }}
          >
            <span
              className={cn(
                'relative grid place-items-center rounded-[13px] bg-gradient-to-br text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] ring-1 ring-white/25 transition-transform group-hover:scale-[1.04]',
                app.tone
              )}
              style={{ width: cell.tile, height: cell.tile }}
            >
              <Icon style={{ width: cell.tile * 0.48, height: cell.tile * 0.48 }} strokeWidth={1.8} />
              {running.has(id) && (
                <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow" />
              )}
            </span>
            <span
              className={cn(
                'line-clamp-2 max-w-full px-0.5 font-medium leading-tight text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
                cell.label,
                selected === id && 'rounded bg-[var(--accent)] px-1 text-white'
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

import { useMemo, useState } from 'react'
import { Info, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import { APPS, DESKTOP_APPS } from './apps'
import { useDesktop } from '../store/desktop'
import { useLaunch } from './launch'
import { cn } from '../lib/utils'

export default function TrashApp() {
  const { hiddenIcons, discardedIcons, restoreIcon, restoreIcons, emptyTrash } = useDesktop()
  const launch = useLaunch()
  const [selected, setSelected] = useState<string | null>(null)

  const items = useMemo(
    () =>
      hiddenIcons
        .map((id) => DESKTOP_APPS.find((appId) => appId === id))
        .filter((id): id is (typeof DESKTOP_APPS)[number] => Boolean(id)),
    [hiddenIcons]
  )

  const discarded = useMemo(
    () =>
      discardedIcons
        .map((id) => DESKTOP_APPS.find((appId) => appId === id))
        .filter((id): id is (typeof DESKTOP_APPS)[number] => Boolean(id)),
    [discardedIcons]
  )

  return (
    <div className="flex h-full min-h-0 flex-col text-fg">
      <div className="flex h-[42px] shrink-0 items-center gap-2 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-3">
        <p className="text-[12px] font-semibold text-fg">Trash</p>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
          desktop shortcuts
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              restoreIcons()
              setSelected(null)
            }}
            disabled={items.length === 0 && discarded.length === 0}
            className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10px] text-fg hover:bg-white/[0.06] disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" /> Put all back
          </button>
          <button
            type="button"
            onClick={() => {
              emptyTrash()
              setSelected(null)
            }}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-md border border-rose-500/30 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" /> Empty
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="grid h-full min-h-[220px] place-items-center text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--stroke)] bg-white/[0.04] text-[var(--fg-faint)]">
                <Trash2 className="h-7 w-7" strokeWidth={1.4} />
              </span>
              <p className="mt-3 text-[13px] font-medium text-fg">Trash is empty</p>
              <p className="mx-auto mt-1 max-w-[320px] text-[11px] leading-relaxed text-muted">
                Items you remove from the desktop are listed here. Removing a shortcut never deletes portfolio content
                from the database.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => launch('finder')}
                  className="rounded-md border border-[var(--stroke)] px-2.5 py-1 text-[10.5px] text-fg transition-colors hover:bg-white/[0.07]"
                >
                  Open Finder
                </button>
                {discarded.length > 0 && (
                  <button
                    type="button"
                    onClick={() => restoreIcons()}
                    className="rounded-md border border-[var(--stroke)] px-2.5 py-1 text-[10.5px] text-fg transition-colors hover:bg-white/[0.07]"
                  >
                    Restore {discarded.length} hidden shortcut{discarded.length === 1 ? '' : 's'}
                  </button>
                )}
              </div>
              {discarded.length > 0 && (
                <p className="mt-2 font-mono text-[9px] text-[var(--fg-faint)]">
                  {discarded.length} shortcut{discarded.length === 1 ? '' : 's'} permanently hidden
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-1">
            <div className="grid grid-cols-[1.5fr_1fr_90px_80px] gap-2 border-b border-[var(--stroke)] px-2 pb-1 font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)]">
              <span>Name</span>
              <span>Description</span>
              <span>State</span>
              <span className="text-right">Action</span>
            </div>
            {items.map((appId) => {
              const app = APPS[appId]
              return (
                <div
                  key={appId}
                  className={cn(
                    'grid grid-cols-[1.5fr_1fr_90px_80px] items-center gap-2 rounded-md px-2 py-2 text-[11px]',
                    selected === appId ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/[0.05]'
                  )}
                  onClick={() => setSelected(appId)}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br text-white', app.tone)}>
                      <app.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-fg">{app.label}</span>
                      <span className="block truncate font-mono text-[8.5px] text-[var(--fg-faint)]">{appId}</span>
                    </span>
                  </div>
                  <span className="truncate text-[10px] text-[var(--fg-faint)]">{app.subtitle}</span>
                  <span className="rounded border border-[var(--stroke)] px-1 py-px text-center font-mono text-[8px] uppercase text-[var(--fg-faint)]">
                    in trash
                  </span>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        restoreIcon(appId)
                        setSelected(null)
                      }}
                      className="rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-fg hover:bg-white/[0.08]"
                    >
                      Put back
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {discarded.length > 0 && (
          <div className="mt-4 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-fg">
              <Info className="h-3 w-3 text-[var(--fg-faint)]" /> Permanently removed shortcuts
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              {discarded.map((appId) => APPS[appId].label).join(', ')} — these remain hidden from the desktop. Use “Put all
              back” to restore every shortcut.
            </p>
          </div>
        )}
      </div>

      <div className="flex h-[26px] shrink-0 items-center justify-between border-t border-[var(--stroke)] bg-[var(--panel-soft)] px-3 font-mono text-[8.5px] text-[var(--fg-faint)]">
        <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          onClick={() => launch('finder')}
          className="hover:text-fg"
        >
          Trash lives on the desktop — open Finder
        </button>
        <span>database content is untouched</span>
      </div>
    </div>
  )
}

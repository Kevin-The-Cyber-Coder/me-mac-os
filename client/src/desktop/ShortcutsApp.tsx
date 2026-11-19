import { useMemo, useState } from 'react'
import {
  Bell,
  Command,
  Keyboard,
  LayoutGrid,
  Minus,
  Monitor,
  Search,
  Settings2,
  SlidersHorizontal,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import { useUI } from '../store/ui'
import { useOS } from '../store/os'
import { useLaunch } from './launch'
import { cn } from '../lib/utils'

interface Shortcut {
  keys: string[]
  label: string
  description: string
  group: string
  icon: typeof Command
  run: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

export default function ShortcutsApp() {
  const togglePalette = useUI((state) => state.togglePalette)
  const toggleControlCenter = useUI((state) => state.toggleControlCenter)
  const toggleNotifications = useUI((state) => state.toggleNotifications)
  const launch = useLaunch()
  const [query, setQuery] = useState('')

  const shortcuts: Shortcut[] = useMemo(() => {
    const mod = isMac ? '⌘' : 'Ctrl'
    const os = useOS.getState()
    return [
      {
        keys: [mod, 'K'],
        label: 'Spotlight Search',
        description: 'Search apps, projects, articles, skills, services, gallery and GitHub.',
        group: 'Essentials',
        icon: Search,
        run: () => togglePalette(true),
      },
      {
        keys: [mod, ','],
        label: 'System Settings',
        description: 'Open appearance, wallpaper, dock, privacy and the rest of the system preferences.',
        group: 'Essentials',
        icon: Settings2,
        run: () => launch('settings'),
      },
      {
        keys: [mod, 'W'],
        label: 'Close Window',
        description: 'Close the focused window. The desktop stays exactly where it is.',
        group: 'Windows',
        icon: X,
        run: () => {
          const focused = os.windows.find((win) => win.id === os.focusedId)
          if (focused) os.closeWindow(focused.id)
        },
      },
      {
        keys: [mod, 'M'],
        label: 'Minimize Window',
        description: 'Send the focused window to the minimized tray above the dock.',
        group: 'Windows',
        icon: Minus,
        run: () => {
          const focused = os.windows.find((win) => win.id === os.focusedId)
          if (focused) os.minimizeWindow(focused.id)
        },
      },
      {
        keys: [mod, 'Shift', 'D'],
        label: 'Show Desktop',
        description: 'Minimize every open window without closing anything.',
        group: 'Windows',
        icon: Monitor,
        run: () => os.showDesktop(),
      },
      {
        keys: [mod, '`'],
        label: 'Cycle Windows',
        description: 'Move focus to the previous window in the z-order.',
        group: 'Windows',
        icon: LayoutGrid,
        run: () => os.cycleWindows(1),
      },
      {
        keys: [mod, 'Shift', 'C'],
        label: 'Control Center',
        description: 'Open the tile panel for Wi-Fi status, focus, sound, display and appearance.',
        group: 'System',
        icon: SlidersHorizontal,
        run: () => toggleControlCenter(),
      },
      {
        keys: [mod, 'Shift', 'N'],
        label: 'Notification Center',
        description: 'See session alerts and quick system actions.',
        group: 'System',
        icon: Bell,
        run: () => toggleNotifications(),
      },
      {
        keys: [mod, '1'],
        label: 'Open Finder',
        description: 'Jump to the Finder home dashboard.',
        group: 'Apps',
        icon: Square,
        run: () => launch('finder'),
      },
      {
        keys: [mod, '2'],
        label: 'Open ARENA AI',
        description: 'Open the portfolio assistant in a new window.',
        group: 'Apps',
        icon: Command,
        run: () => launch('arena'),
      },
      {
        keys: [mod, '3'],
        label: 'Open Terminal',
        description: 'Inspect the portfolio from the command line.',
        group: 'Apps',
        icon: Terminal,
        run: () => launch('terminal'),
      },
      {
        keys: [mod, '4'],
        label: 'Open Music',
        description: 'Open ARENA Sound and the track library.',
        group: 'Apps',
        icon: Keyboard,
        run: () => launch('music'),
      },
      {
        keys: ['Esc'],
        label: 'Dismiss Overlays',
        description: 'Close Spotlight, Control Center, Notification Center or a context menu.',
        group: 'Essentials',
        icon: X,
        run: () => {
          useUI.getState().closeOverlays()
        },
      },
    ]
  }, [launch, toggleControlCenter, toggleNotifications, togglePalette])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return shortcuts
    return shortcuts.filter((item) =>
      `${item.label} ${item.description} ${item.group} ${item.keys.join(' ')}`.toLowerCase().includes(q)
    )
  }, [query, shortcuts])

  const groups = useMemo(() => {
    const map = new Map<string, Shortcut[]>()
    filtered.forEach((item) => map.set(item.group, [...(map.get(item.group) || []), item]))
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="flex h-full min-h-0 flex-col text-fg">
      <div className="flex h-[42px] shrink-0 items-center gap-2 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-3">
        <Keyboard className="h-4 w-4 text-[var(--fg-muted)]" />
        <p className="text-[12px] font-semibold text-fg">Keyboard Shortcuts</p>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--fg-faint)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter shortcuts"
            aria-label="Filter shortcuts"
            className="h-6 w-[170px] rounded-md border border-[var(--stroke)] bg-white/[0.05] pl-6 pr-2 text-[11px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--stroke))]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {groups.length === 0 && (
          <p className="py-12 text-center text-[11.5px] text-muted">No shortcut matches “{query}”.</p>
        )}
        {groups.map(([group, items]) => (
          <section key={group} className="mb-3">
            <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">{group}</p>
            <div className="overflow-hidden rounded-lg border border-[var(--stroke)]">
              {items.map((item) => (
                <button
                  key={`${group}-${item.label}`}
                  type="button"
                  onClick={item.run}
                  className="flex w-full items-center gap-2.5 border-b border-[var(--stroke)] px-3 py-2 text-left last:border-0 hover:bg-white/[0.05]"
                  title={`Run: ${item.label}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[var(--fg-muted)]">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-fg">{item.label}</span>
                    <span className="block truncate text-[10px] text-[var(--fg-faint)]">{item.description}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key) => (
                      <kbd
                        key={key}
                        className={cn(
                          'min-w-[20px] rounded border border-[var(--stroke-strong)] bg-white/[0.06] px-1.5 py-0.5 text-center font-mono text-[9px] text-[var(--fg-muted)]',
                          key.length > 1 && 'px-1.5'
                        )}
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
        <p className="pb-2 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
          Click any shortcut to run it · {isMac ? 'Mac' : 'Windows / Linux'} modifier detected
        </p>
      </div>
    </div>
  )
}

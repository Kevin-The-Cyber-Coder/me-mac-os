import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Boxes,
  Command,
  FolderKanban,
  Github,
  Home,
  Image,
  Layers,
  Mail,
  Moon,
  Music2,
  PenLine,
  Search,
  Settings,
  SquareTerminal,
  Sun,
  User,
  Wand2,
} from 'lucide-react'
import { useUI } from '../../store/ui'
import { useAuth } from '../../store/auth'
import { api } from '../../lib/api'
import { useDebounced } from '../../hooks/useContent'
import { applyTheme, cn } from '../../lib/utils'

const PAGES = [
  { label: 'Home', to: '/', icon: Home, group: 'Navigate' },
  { label: 'About Mukeshimana Kevin', to: '/about', icon: User, group: 'Navigate' },
  { label: 'Projects', to: '/projects', icon: FolderKanban, group: 'Navigate' },
  { label: 'Skills & Stack', to: '/skills', icon: Layers, group: 'Navigate' },
  { label: 'Services', to: '/services', icon: Mail, group: 'Navigate' },
  { label: 'Blog / Journal', to: '/blog', icon: PenLine, group: 'Navigate' },
  { label: 'Gallery', to: '/gallery', icon: Image, group: 'Navigate' },
  { label: 'Contact', to: '/contact', icon: Mail, group: 'Navigate' },
  { label: 'ARENA AI', to: '/arena-ai', icon: Bot, group: 'Tools' },
  { label: 'GitHub Command Center', to: '/github', icon: Github, group: 'Tools' },
  { label: 'Developer Terminal', to: '/terminal', icon: SquareTerminal, group: 'Tools' },
  { label: '3D Universe', to: '/universe', icon: Boxes, group: 'Tools' },
]

interface Result {
  key: string
  label: string
  hint?: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  external?: boolean
}

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen)
  const togglePalette = useUI((s) => s.togglePalette)
  const setWallpaper = useUI((s) => s.setWallpaper)
  const setTheme = useUI((s) => s.setTheme)
  const theme = useUI((s) => s.theme)
  const accent = useUI((s) => s.accent)
  const toggleMusic = useUI((s) => s.toggleMusic)
  const toggleGestures = useUI((s) => s.toggleGestures)
  const toggleAssistant = useUI((s) => s.toggleAssistant)
  const admin = useAuth((s) => s.admin)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [remote, setRemote] = useState<Result[]>([])
  const [searching, setSearching] = useState(false)
  const debounced = useDebounced(query, 260)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setRemote([])
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setRemote([])
      return
    }
    let alive = true
    setSearching(true)
    api
      .get('/search', { params: { q: debounced.trim(), limit: 6 } })
      .then(({ data }) => {
        if (!alive) return
        const icons: Record<string, Result['icon']> = {
          projects: FolderKanban,
          blog: PenLine,
          skills: Layers,
          services: Boxes,
          gallery: Image,
          github: Github,
        }
        const results: Result[] = (data.results || []).map((item: any) => ({
          key: `${item.group}-${item.id}`,
          label: item.title,
          hint: item.meta || item.group,
          to: item.href,
          icon: icons[item.group] || Layers,
          group: item.group === 'github' ? 'GitHub' : 'Content',
          external: Boolean(item.external),
        }))
        setRemote(results)
      })
      .catch(() => alive && setRemote([]))
      .finally(() => alive && setSearching(false))
    return () => {
      alive = false
    }
  }, [debounced, open])

  const actions: Result[] = useMemo(
    () => [
      {
        key: 'toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
        to: '',
        icon: theme === 'dark' ? Sun : Moon,
        group: 'Actions',
      },
      {
        key: 'wallpaper',
        label: 'Cycle wallpaper',
        to: '',
        icon: Wand2,
        group: 'Actions',
      },
      { key: 'music', label: 'Open music player', to: '', icon: Music2, group: 'Actions' },
      { key: 'gestures', label: 'Gesture navigation', to: '', icon: Wand2, group: 'Actions' },
      { key: 'assistant', label: 'Ask ARENA AI', to: '', icon: Bot, group: 'Actions' },
      ...(admin ? [{ key: 'admin', label: 'Admin command center', to: '/admin', icon: Settings, group: 'Actions' }] : []),
    ],
    [theme, admin]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base: Result[] = [
      ...PAGES.map((page) => ({ ...page, key: `page:${page.to}` })),
      ...actions,
    ]
    const filtered = q
      ? base.filter((item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q))
      : base
    return [...filtered, ...remote]
  }, [query, remote, actions])

  useEffect(() => setActive(0), [results.length])

  const run = (item: Result) => {
    togglePalette(false)
    if (item.external && item.to) {
      window.open(item.to, '_blank', 'noopener,noreferrer')
      return
    }
    if (item.to) {
      navigate(item.to)
      return
    }
    if (item.key === 'toggle-theme') {
      const next = theme === 'dark' ? 'light' : 'dark'
      setTheme(next)
      applyTheme(next, accent, useUI.getState().reduceMotion)
    }
    if (item.key === 'wallpaper') {
      const order = ['aurora', 'nebula', 'grid', 'sunset']
      const current = useUI.getState().wallpaper
      setWallpaper(order[(order.indexOf(current) + 1) % order.length])
    }
    if (item.key === 'music') toggleMusic(true)
    if (item.key === 'gestures') toggleGestures(true)
    if (item.key === 'assistant') toggleAssistant(true)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (results[active]) run(results[active])
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active])

  let lastGroup = ''

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) togglePalette(false)
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass-strong w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--stroke-strong)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--stroke)] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--fg-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search pages, projects, articles or run a command…"
                className="w-full bg-transparent text-[13.5px] text-fg outline-none placeholder:text-[var(--fg-faint)]"
                aria-label="Command palette search"
                autoComplete="off"
              />
              <kbd className="hidden shrink-0 rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9.5px] text-muted sm:block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5" role="listbox">
              {results.length === 0 && (
                <div className="px-3 py-8 text-center text-[12px] text-muted">
                  {searching ? 'Searching…' : `No results for “${query}”`}
                </div>
              )}
              {results.map((item, index) => {
                const showGroup = item.group !== lastGroup
                lastGroup = item.group
                return (
                  <div key={item.key}>
                    {showGroup && (
                      <div className="px-2.5 pb-1 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
                        {item.group}
                      </div>
                    )}
                    <button
                      data-index={index}
                      role="option"
                      aria-selected={active === index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(item)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                        active === index ? 'bg-[var(--accent-soft)] text-fg' : 'text-[var(--fg-muted)] hover:bg-white/[0.05]'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1 truncate text-[12.5px]">{item.label}</span>
                      {item.hint && <span className="text-[10px] uppercase tracking-wide text-[var(--fg-faint)]">{item.hint}</span>}
                      <ArrowRight className={cn('h-3 w-3', active === index ? 'opacity-70' : 'opacity-0')} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--stroke)] px-3.5 py-2 text-[10px] text-[var(--fg-faint)]">
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" /> K to open · ↑↓ navigate · ↵ open
              </span>
              <span className="font-mono">ARENA OS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

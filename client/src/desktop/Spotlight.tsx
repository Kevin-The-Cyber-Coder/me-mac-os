import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Command,
  Download,
  FolderKanban,
  Github,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Search,
  Settings2,
  SquareTerminal,
  Sun,
  Wand2,
  X,
} from 'lucide-react'
import { ALL_APPS, APPS, type AppId } from './apps'
import { MAC_ICONS } from './mac-icons'
import { useLaunch, useOpenPath } from './launch'
import { useUI } from '../store/ui'
import { useAuth } from '../store/auth'
import { useSite } from '../store/site'
import { api } from '../lib/api'
import { applyTheme, cn } from '../lib/utils'

interface Result {
  key: string
  label: string
  hint?: string
  group: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
}

const GROUP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  projects: FolderKanban,
  blog: Wand2,
  skills: Layers,
  services: Mail,
  gallery: ImageIcon,
  github: Github,
}

const GROUP_LABEL: Record<string, string> = {
  projects: 'Projects',
  blog: 'Journal',
  skills: 'Skills',
  services: 'Services',
  gallery: 'Gallery',
  github: 'GitHub',
}

export function Spotlight() {
  const open = useUI((state) => state.paletteOpen)
  const togglePalette = useUI((state) => state.togglePalette)
  const theme = useUI((state) => state.theme)
  const setTheme = useUI((state) => state.setTheme)
  const reduceMotion = useUI((state) => state.reduceMotion)
  const launch = useLaunch()
  const openPath = useOpenPath()
  const admin = useAuth((state) => state.admin)
  const profile = useSite((state) => state.profile)

  const [query, setQuery] = useState('')
  const [content, setContent] = useState<{ group: string; id: string; title: string; description?: string; href: string; meta?: string; external?: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setContent([])
    setActive(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setContent([])
      setLoading(false)
      return
    }
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)
    const timer = window.setTimeout(() => {
      api
        .get('/search', { params: { q } })
        .then(({ data }) => {
          if (requestId.current !== id) return
          setContent(data.results || [])
        })
        .catch(() => {
          if (requestId.current === id) setContent([])
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false)
        })
    }, 170)
    return () => window.clearTimeout(timer)
  }, [query])

  const actions: Result[] = useMemo(() => {
    const list: Result[] = [
      {
        key: 'action:assistant',
        label: 'Open ARENA AI',
        hint: 'Portfolio assistant',
        group: 'Actions',
        icon: Bot,
        run: () => launch('arena'),
      },
      {
        key: 'action:terminal',
        label: 'Open Terminal',
        hint: 'kevin@arena',
        group: 'Actions',
        icon: SquareTerminal,
        run: () => launch('terminal'),
      },
      {
        key: 'action:wallpaper',
        label: 'Change Wallpaper',
        hint: 'System Settings',
        group: 'Actions',
        icon: Monitor,
        run: () => launch('settings', { section: 'wallpaper' }),
      },
      {
        key: 'action:theme',
        label: theme === 'dark' ? 'Switch to Light Appearance' : 'Switch to Dark Appearance',
        hint: 'Appearance',
        group: 'Actions',
        icon: theme === 'dark' ? Sun : Moon,
        run: () => {
          const next = theme === 'dark' ? 'light' : 'dark'
          setTheme(next)
          applyTheme(next, useUI.getState().accent, reduceMotion)
        },
      },
      {
        key: 'action:resume',
        label: 'Download Résumé',
        hint: 'PDF',
        group: 'Actions',
        icon: Download,
        run: () => {
          const link = document.createElement('a')
          link.href = profile?.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf'
          link.download = 'Mukeshimana-Kevin-CV.pdf'
          document.body.appendChild(link)
          link.click()
          link.remove()
        },
      },
      {
        key: 'action:admin',
        label: admin ? 'Open Command Center' : 'Admin Sign In',
        hint: 'Secured',
        group: 'Actions',
        icon: Settings2,
        run: () => window.location.assign(admin ? '/admin' : '/login'),
      },
    ]
    return list
  }, [admin, launch, profile?.resumeUrl, reduceMotion, setTheme, theme])

  const appResults: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_APPS.filter((app) => {
      if (!q) return true
      return `${app.label} ${app.subtitle} ${app.keywords.join(' ')}`.toLowerCase().includes(q)
    })
      .slice(0, q ? 6 : 8)
      .map((app) => ({
        key: `app:${app.id}`,
        label: app.label,
        hint: app.subtitle,
        group: 'Applications',
        icon: MAC_ICONS[app.id] ?? app.icon,
        run: () => launch(app.id as AppId),
      }))
  }, [launch, query])

  const contentResults: Result[] = useMemo(
    () =>
      content.map((item) => ({
        key: `content:${item.group}:${item.id}`,
        label: item.title,
        hint: item.meta || item.group,
        group: GROUP_LABEL[item.group] || 'Content',
        icon: GROUP_ICON[item.group] || Layers,
        run: () => {
          if (item.external) {
            window.open(item.href, '_blank', 'noopener,noreferrer')
            return
          }
          openPath(item.href)
        },
      })),
    [content, openPath]
  )

  const actionResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions.slice(0, 4)
    return actions.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q)).slice(0, 4)
  }, [actions, query])

  const results = useMemo(() => {
    if (!query.trim()) return [...appResults, ...actionResults]
    return [...appResults, ...contentResults, ...actionResults]
  }, [actionResults, appResults, contentResults, query])

  useEffect(() => {
    setActive(0)
  }, [query, results.length])

  if (!open) return null

  const runResult = (result: Result) => {
    togglePalette(false)
    result.run()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-[3px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) togglePalette(false)
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="w-full max-w-[680px] overflow-hidden rounded-[16px] border border-[var(--stroke-strong)] bg-[var(--panel-strong)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          role="dialog"
          aria-label="Spotlight search"
        >
          <div className="flex items-center gap-3 border-b border-[var(--stroke)] px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-[var(--fg-faint)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActive((index) => Math.min(results.length - 1, index + 1))
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActive((index) => Math.max(0, index - 1))
                } else if (event.key === 'Enter' && results[active]) {
                  event.preventDefault()
                  runResult(results[active])
                } else if (event.key === 'Escape') {
                  togglePalette(false)
                }
              }}
              placeholder="Spotlight Search — apps, projects, articles, skills, GitHub…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-[var(--fg-faint)]"
              aria-label="Search everything"
              autoComplete="off"
              spellCheck={false}
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--fg-faint)]" />}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded p-1 text-[var(--fg-faint)] hover:bg-white/[0.06] hover:text-fg"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9.5px] text-[var(--fg-faint)]">
              esc
            </kbd>
          </div>

          <div className="max-h-[56vh] overflow-y-auto p-2">
            {results.length === 0 && !loading && (
              <div className="px-3 py-10 text-center">
                <p className="text-[12.5px] font-medium text-fg">No results for “{query}”</p>
                <p className="mt-1 text-[11px] text-muted">Try a project name, a technology, or ask ARENA AI.</p>
              </div>
            )}
            {results.map((result, index) => {
              const Icon = result.icon
              const showHeader = index === 0 || results[index - 1].group !== result.group
              return (
                <div key={result.key}>
                  {showHeader && (
                    <p className="px-2.5 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                      {result.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runResult(result)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      active === index ? 'bg-[var(--accent)] text-white' : 'text-fg hover:bg-white/[0.06]'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-white/10 bg-white/[0.05]',
                        active === index && 'border-white/20 bg-white/15'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{result.label}</span>
                      {result.hint && (
                        <span className={cn('block truncate text-[10px]', active === index ? 'text-white/70' : 'text-[var(--fg-faint)]')}>
                          {result.hint}
                        </span>
                      )}
                    </span>
                    {active === index && <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--stroke)] px-4 py-2 text-[9.5px] text-[var(--fg-faint)]">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--stroke)] px-1 font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--stroke)] px-1 font-mono">↵</kbd> open
              </span>
              <span className="flex items-center gap-1">
                <Command className="h-2.5 w-2.5" />
                <kbd className="rounded border border-[var(--stroke)] px-1 font-mono">K</kbd> spotlight
              </span>
            </span>
            <span className="font-mono">ARENA OS · Spotlight</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

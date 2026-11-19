import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  Database,
  ExternalLink,
  FolderKanban,
  Github,
  HeartHandshake,
  Image,
  LayoutDashboard,
  Layers,
  ListMusic,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MessageSquareWarning,
  Moon,
  Music2,
  PenLine,
  Quote,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { useNotifications } from '../store/notifications'
import { useSocket } from '../hooks/useSocket'
import { api } from '../lib/api'
import { applyTheme, cn, timeAgo } from '../lib/utils'
import type { DashboardStats } from '../types'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
  badge?: 'pendingComments' | 'newMessages' | 'unread' | 'newFeedback'
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
      { label: 'GitHub', to: '/admin/github', icon: Github },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell, badge: 'unread' },
    ],
  },
  {
    group: 'Content',
    items: [
      { label: 'Projects', to: '/admin/projects', icon: FolderKanban },
      { label: 'Skills', to: '/admin/skills', icon: Layers },
      { label: 'Services', to: '/admin/services', icon: Briefcase },
      { label: 'Articles', to: '/admin/blog', icon: PenLine },
      { label: 'Blog categories', to: '/admin/blog-categories', icon: Tags },
      { label: 'Gallery', to: '/admin/gallery', icon: Image },
      { label: 'Testimonials', to: '/admin/testimonials', icon: Quote },
      { label: 'Music', to: '/admin/music', icon: Music2 },
      { label: 'Playlists', to: '/admin/playlists', icon: ListMusic },
    ],
  },
  {
    group: 'Engagement',
    items: [
      { label: 'Comments', to: '/admin/comments', icon: MessageSquare, badge: 'pendingComments' },
      { label: 'Feedback', to: '/admin/feedback', icon: MessageSquareWarning, badge: 'newFeedback' },
      { label: 'Messages', to: '/admin/messages', icon: Mail, badge: 'newMessages' },
      { label: 'Subscribers', to: '/admin/subscribers', icon: Send },
      { label: 'Campaigns', to: '/admin/campaigns', icon: Send },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { label: 'AI conversations', to: '/admin/conversations', icon: Bot },
      { label: 'Achievements', to: '/admin/achievements', icon: Award },
      { label: 'Sponsorships', to: '/admin/sponsorships', icon: HeartHandshake },
      { label: 'Repo audit', to: '/admin/audit', icon: ShieldCheck },
      { label: 'Activity log', to: '/admin/activity', icon: Activity },
      { label: 'GitHub snapshots', to: '/admin/github-accounts', icon: Database },
      { label: 'GitHub activity', to: '/admin/github-activity', icon: Activity },
      { label: 'Analytics events', to: '/admin/analytics-events', icon: BarChart3 },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Site settings', to: '/admin/settings', icon: Settings },
      { label: 'ARENA AI', to: '/admin/ai', icon: Sparkles },
      { label: 'Users & security', to: '/admin/users', icon: Users },
      { label: 'Backup & restore', to: '/admin/backup', icon: Database },
    ],
  },
]

export function AdminLayout() {
  const { admin, logout } = useAuth()
  const { theme, setTheme, accent, reduceMotion } = useUI()
  const unread = useNotifications((state) => state.unread)
  const setUnread = useNotifications((state) => state.setUnread)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  useSocket()

  useEffect(() => {
    applyTheme(theme, accent, reduceMotion)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const listener = () => applyTheme('system', accent, reduceMotion)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme, accent, reduceMotion])

  useEffect(() => {
    setSidebarOpen(false)
    setUserMenu(false)
  }, [location.pathname])

  const loadStats = useCallback(() => {
    Promise.all([
      api.get('/admin/stats').then((response) => response.data.stats as DashboardStats).catch(() => null),
      api
        .get('/admin/notifications', { params: { limit: 1 } })
        .then((response) => response.data.unread as number)
        .catch(() => null),
    ]).then(([nextStats, nextUnread]) => {
      if (nextStats) setStats(nextStats)
      if (typeof nextUnread === 'number') setUnread(nextUnread)
    })
  }, [setUnread])

  useEffect(() => {
    loadStats()
  }, [location.pathname, loadStats])

  const title = useMemo(() => {
    for (const group of NAV) {
      const match = group.items.find((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
      )
      if (match) return match.label
    }
    return 'Command center'
  }, [location.pathname])

  const badgeValue = (badge?: NavItem['badge']) => {
    if (!badge) return 0
    if (badge === 'unread') return unread
    return Number(stats?.[badge] || 0)
  }

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-fg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,92,255,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.08),transparent_50%)]"
      />

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--stroke)] bg-[var(--panel-strong)] backdrop-blur-xl transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--stroke)] px-4 py-3.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[12px] font-semibold text-fg">Kevin The Cyber Coder</p>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">Command center</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-muted hover:text-fg lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2.5" aria-label="Admin navigation">
          {NAV.map((group) => (
            <div key={group.group} className="mb-2.5">
              <p className="px-2.5 pb-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const count = badgeValue(item.badge)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[11.5px] transition-colors',
                          isActive
                            ? 'bg-[var(--accent-soft)] font-medium text-fg'
                            : 'text-[var(--fg-muted)] hover:bg-white/[0.04] hover:text-fg'
                        )
                      }
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 opacity-85" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-[#05060c]">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--stroke)] p-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--stroke)] px-2.5 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[9px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
              {(admin?.name || 'A')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10.5px] font-medium text-fg">{admin?.name || 'Administrator'}</p>
              <p className="truncate font-mono text-[8.5px] uppercase tracking-wide text-[var(--fg-faint)]">{admin?.role || 'editor'}</p>
            </div>
            <button onClick={signOut} className="rounded p-1 text-muted hover:text-rose-300" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="relative lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--stroke)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-3 backdrop-blur-xl sm:px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-muted hover:bg-white/[0.05] hover:text-fg lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <div className="min-w-0">
            <p className="truncate font-display text-[13.5px] font-semibold text-fg">{title}</p>
            <p className="hidden truncate font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--fg-faint)] sm:block">
              admin / {location.pathname.replace('/admin', '').replace(/^\//, '') || 'dashboard'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/"
              className="hidden items-center gap-1 rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-muted transition-colors hover:text-fg sm:flex"
            >
              View site <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/admin/github"
              className="hidden items-center gap-1 rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-muted transition-colors hover:text-fg md:flex"
            >
              <Github className="h-3 w-3" /> Sync
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-muted hover:bg-white/[0.05] hover:text-fg"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <Link
              to="/admin/notifications"
              className="relative rounded-lg p-2 text-muted hover:bg-white/[0.05] hover:text-fg"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            >
              <Bell className="h-3.5 w-3.5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-rose-500 px-0.5 font-mono text-[8px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-1.5 py-1 text-[10.5px] text-muted hover:text-fg"
                aria-expanded={userMenu}
                aria-haspopup="menu"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent-soft)] text-[8px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                  {(admin?.name || 'A').slice(0, 1).toUpperCase()}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {userMenu && (
                <div
                  role="menu"
                  className="glass-strong absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-[var(--stroke-strong)] shadow-2xl"
                >
                  <div className="border-b border-[var(--stroke)] px-3 py-2">
                    <p className="truncate text-[11px] font-medium text-fg">{admin?.name}</p>
                    <p className="truncate text-[9.5px] text-[var(--fg-faint)]">{admin?.email}</p>
                    {admin?.lastLoginAt && (
                      <p className="mt-0.5 font-mono text-[8px] text-[var(--fg-faint)]">last login {timeAgo(admin.lastLoginAt)}</p>
                    )}
                  </div>
                  <Link to="/admin/settings" className="flex items-center gap-1.5 px-3 py-2 text-[10.5px] text-muted hover:bg-white/[0.05] hover:text-fg">
                    <Settings className="h-3 w-3" /> Site settings
                  </Link>
                  <Link to="/admin/users" className="flex items-center gap-1.5 px-3 py-2 text-[10.5px] text-muted hover:bg-white/[0.05] hover:text-fg">
                    <ShieldCheck className="h-3 w-3" /> Security
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-1.5 border-t border-[var(--stroke)] px-3 py-2 text-left text-[10.5px] text-rose-300 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3 w-3" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-5 sm:py-5">
          <Outlet context={{ stats, refreshStats: loadStats }} />
        </main>
      </div>
    </div>
  )
}

export function AdminSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!query.trim()) return
        navigate(`/admin/projects?q=${encodeURIComponent(query.trim())}`)
      }}
      className="relative hidden md:block"
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-faint)]" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search projects…"
        className="w-48 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] py-1.5 pl-8 pr-2 text-[11px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:w-64"
        aria-label="Search projects"
      />
    </form>
  )
}

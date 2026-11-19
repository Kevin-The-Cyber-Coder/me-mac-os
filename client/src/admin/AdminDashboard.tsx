import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FolderKanban,
  Github as GithubIcon,
  HeartHandshake,
  Mail,
  MessageSquare,
  PenLine,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Progress,
  Skeleton,
  StatCard,
  Tooltip,
} from '../components/ui'
import { api, apiError } from '../lib/api'
import { cn, formatDate, formatNumber, timeAgo } from '../lib/utils'
import type { AnalyticsSummary, DashboardStats } from '../types'

interface ActivityItem {
  id: string
  action: string
  actor?: string
  entity?: string
  createdAt: string
}

interface MessageItem {
  id: string
  name: string
  email?: string
  subject: string
  service?: string
  status: string
  createdAt: string
}

interface DashboardPayload {
  stats: DashboardStats
  analytics: AnalyticsSummary
  recentActivity: ActivityItem[]
  recentMessages: MessageItem[]
}

interface OutletCtx {
  stats: DashboardStats | null
  refreshStats: () => void
}

const QUICK_ACTIONS = [
  { label: 'New project', to: '/admin/projects?new=1', icon: FolderKanban, hint: 'Publish a case study' },
  { label: 'Write article', to: '/admin/blog?new=1', icon: PenLine, hint: 'Journal entry' },
  { label: 'Moderate comments', to: '/admin/comments', icon: MessageSquare, hint: 'Pending queue' },
  { label: 'Send newsletter', to: '/admin/campaigns', icon: Send, hint: 'Reach subscribers' },
  { label: 'GitHub center', to: '/admin/github', icon: GithubIcon, hint: 'Sync & audit' },
  { label: 'ARENA AI', to: '/admin/ai', icon: Bot, hint: 'Provider & limits' },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function ChartFrame({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-[13.5px] font-semibold text-fg">Traffic · last 30 days</h2>
          <p className="text-[10.5px] text-[var(--fg-faint)]">Privacy-conscious pageviews, no third-party pixels.</p>
        </div>
        <Badge tone="accent">
          <TrendingUp className="h-2.5 w-2.5" /> live
        </Badge>
      </div>
      {empty ? (
        <div className="grid h-[210px] place-items-center rounded-xl border border-dashed border-[var(--stroke)] text-[11.5px] text-[var(--fg-faint)]">
          No traffic recorded yet.
        </div>
      ) : (
        <div className="h-[210px] w-full">{children}</div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const ctx = useOutletContext<OutletCtx | undefined>()
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/admin/stats')
      setPayload({
        stats: data.stats as DashboardStats,
        analytics: data.analytics as AnalyticsSummary,
        recentActivity: (data.recentActivity || []) as ActivityItem[],
        recentMessages: (data.recentMessages || []) as MessageItem[],
      })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = payload?.stats || ctx?.stats || null
  const analytics = payload?.analytics
  const chartData = useMemo(
    () =>
      (analytics?.perDay || []).map((day) => ({
        date: formatDate(day.date, { month: 'short', day: 'numeric' }),
        views: day.views,
        visitors: day.visitors,
      })),
    [analytics]
  )

  const pendingTotal = stats ? stats.pendingComments + stats.newMessages + stats.newFeedback : 0

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            Command center
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-tight text-fg">
            {greeting()}, Kevin
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Everything that matters in one view — content health, moderation queue, traffic and AI usage.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={stats?.mailConfigured ? 'success' : 'warning'}>
              <Mail className="h-2.5 w-2.5" /> {stats?.mailConfigured ? 'mail ready' : 'mail not configured'}
            </Badge>
            <Badge tone={stats?.github ? 'success' : 'default'}>
              <GithubIcon className="h-2.5 w-2.5" /> {stats?.github ? `@${stats.github.username}` : 'GitHub idle'}
            </Badge>
            <Badge tone="default">
              <Database className="h-2.5 w-2.5" /> {stats ? formatNumber(stats.aiMessages) : '—'} AI messages
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={() => load(true)}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/">
            <Button size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
              View site
            </Button>
          </Link>
        </div>
      </header>

      {loading && !stats && (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px]" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {!loading && error && !stats && <ErrorState message={error} onRetry={() => load()} />}

      {stats && (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Published projects"
              value={formatNumber(stats.publishedProjects)}
              hint={`${stats.projects} total records`}
              icon={<FolderKanban className="h-4 w-4" />}
            />
            <StatCard
              label="Published articles"
              value={formatNumber(stats.publishedPosts)}
              hint={`${stats.posts} total records`}
              icon={<PenLine className="h-4 w-4" />}
            />
            <StatCard
              label="Visitors · 30d"
              value={formatNumber(stats.visitors30d)}
              hint={`${formatNumber(stats.pageviews30d)} pageviews`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Subscribers"
              value={formatNumber(stats.subscribers)}
              hint="confirmed opt-in"
              icon={<UserPlus className="h-4 w-4" />}
            />
            <StatCard
              label="Pending comments"
              value={formatNumber(stats.pendingComments)}
              hint={`${stats.comments} total`}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <StatCard
              label="New messages"
              value={formatNumber(stats.newMessages)}
              hint="contact form"
              icon={<Mail className="h-4 w-4" />}
            />
            <StatCard
              label="AI conversations"
              value={formatNumber(stats.conversations)}
              hint={`${formatNumber(stats.aiMessages)} messages`}
              icon={<Bot className="h-4 w-4" />}
            />
            <StatCard
              label="Unread alerts"
              value={formatNumber(stats.unread)}
              hint="notification center"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          {pendingTotal > 0 && (
            <Alert tone="warning" title="Moderation needs attention">
              <div className="mt-1 flex flex-wrap gap-2">
                {stats.pendingComments > 0 && (
                  <Link
                    to="/admin/comments"
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-400/10"
                  >
                    {stats.pendingComments} pending comment{stats.pendingComments === 1 ? '' : 's'}
                  </Link>
                )}
                {stats.newMessages > 0 && (
                  <Link
                    to="/admin/messages"
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-400/10"
                  >
                    {stats.newMessages} new message{stats.newMessages === 1 ? '' : 's'}
                  </Link>
                )}
                {stats.newFeedback > 0 && (
                  <Link
                    to="/admin/feedback"
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-400/10"
                  >
                    {stats.newFeedback} new feedback
                  </Link>
                )}
              </div>
            </Alert>
          )}

          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <ChartFrame empty={chartData.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 6, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#8b93b0' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#8b93b0' }} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    contentStyle={{
                      background: '#0b1020',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: '#e8ecff',
                    }}
                    labelStyle={{ color: '#8b93b0', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Pageviews"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#viewsFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visitors"
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                    fill="url(#visitorsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Top pages</h2>
                <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
              </div>
              <div className="mt-3 space-y-2.5">
                {(analytics?.topPages || []).slice(0, 6).map((page) => {
                  const max = Math.max(1, ...(analytics?.topPages || []).map((item) => item.views))
                  return (
                    <div key={page.path}>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate font-mono text-[var(--fg-muted)]">{page.path}</span>
                        <span className="shrink-0 text-[10px] text-[var(--fg-faint)]">{formatNumber(page.views)}</span>
                      </div>
                      <Progress value={(page.views / max) * 100} className="mt-1" />
                    </div>
                  )
                })}
                {(analytics?.topPages || []).length === 0 && (
                  <p className="text-[11px] text-[var(--fg-faint)]">No page views recorded yet.</p>
                )}
              </div>
              <div className="mt-3 border-t border-[var(--stroke)] pt-2.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[var(--fg-faint)]">Referrers</span>
                  <span className="font-mono text-[var(--fg-muted)]">{(analytics?.referrers || []).length}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(analytics?.referrers || []).slice(0, 4).map((ref) => (
                    <span
                      key={ref.source}
                      className="rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9px] text-[var(--fg-faint)]"
                    >
                      {ref.source} · {ref.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="glass rounded-2xl p-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Quick actions</h2>
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              </div>
              <div className="mt-2.5 grid gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center gap-2.5 rounded-xl border border-[var(--stroke)] px-2.5 py-2 transition-colors hover:border-[var(--stroke-strong)]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                      <action.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-fg">{action.label}</span>
                      <span className="block truncate text-[9.5px] text-[var(--fg-faint)]">{action.hint}</span>
                    </span>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Recent activity</h2>
                <Link to="/admin/activity" className="text-[10px] text-muted hover:text-fg">
                  View all
                </Link>
              </div>
              <div className="mt-2.5 space-y-2">
                {(payload?.recentActivity || []).slice(0, 7).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[10px] text-[var(--fg-muted)]">{item.action}</p>
                      <p className="truncate text-[9px] text-[var(--fg-faint)]">
                        {item.actor || 'system'} · {item.entity || '—'} · {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {(payload?.recentActivity || []).length === 0 && (
                  <p className="text-[11px] text-[var(--fg-faint)]">No administrative activity recorded yet.</p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Latest messages</h2>
                <Link to="/admin/messages" className="text-[10px] text-muted hover:text-fg">
                  Inbox
                </Link>
              </div>
              <div className="mt-2.5 space-y-2">
                {(payload?.recentMessages || []).slice(0, 6).map((message) => (
                  <Link
                    key={message.id}
                    to="/admin/messages"
                    className="block rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 transition-colors hover:border-[var(--stroke-strong)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-medium text-fg">{message.subject}</p>
                      <Badge tone={message.status === 'new' ? 'warning' : 'default'} className="shrink-0">
                        {message.status}
                      </Badge>
                    </div>
                    <p className="truncate text-[9.5px] text-[var(--fg-faint)]">
                      {message.name} · {timeAgo(message.createdAt)}
                    </p>
                  </Link>
                ))}
                {(payload?.recentMessages || []).length === 0 && (
                  <p className="text-[11px] text-[var(--fg-faint)]">No contact messages yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> System health
              </h2>
              <dl className="mt-2.5 space-y-1.5 text-[10.5px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--fg-faint)]">Mail transport</dt>
                  <dd className={cn('font-mono', stats.mailConfigured ? 'text-emerald-300' : 'text-amber-300')}>
                    {stats.mailConfigured ? 'configured' : 'dev preview'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--fg-faint)]">GitHub snapshot</dt>
                  <dd className="font-mono text-[var(--fg-muted)]">
                    {stats.github ? timeAgo(stats.github.lastSyncedAt) : 'not synced'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--fg-faint)]">Gallery assets</dt>
                  <dd className="font-mono text-[var(--fg-muted)]">{formatNumber(stats.gallery)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--fg-faint)]">AI messages</dt>
                  <dd className="font-mono text-[var(--fg-muted)]">{formatNumber(stats.aiMessages)}</dd>
                </div>
              </dl>
              <div className="mt-2.5 flex flex-wrap gap-1">
                <Link to="/admin/backup">
                  <Badge tone="default">backup</Badge>
                </Link>
                <Link to="/admin/users">
                  <Badge tone="default">users</Badge>
                </Link>
                <Link to="/admin/settings">
                  <Badge tone="default">settings</Badge>
                </Link>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <GithubIcon className="h-3.5 w-3.5 text-[var(--accent)]" /> GitHub snapshot
              </h2>
              {stats.github ? (
                <div className="mt-2.5">
                  <p className="font-mono text-[11px] text-fg">@{stats.github.username}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-[var(--stroke)] py-1.5">
                      <p className="font-display text-sm font-semibold text-fg">{formatNumber(stats.github.stars)}</p>
                      <p className="text-[8.5px] uppercase tracking-wide text-[var(--fg-faint)]">stars</p>
                    </div>
                    <div className="rounded-lg border border-[var(--stroke)] py-1.5">
                      <p className="font-display text-sm font-semibold text-fg">{formatNumber(stats.github.publicRepos)}</p>
                      <p className="text-[8.5px] uppercase tracking-wide text-[var(--fg-faint)]">repos</p>
                    </div>
                    <div className="rounded-lg border border-[var(--stroke)] py-1.5">
                      <p className="font-display text-sm font-semibold text-fg">{formatNumber(stats.github.followers)}</p>
                      <p className="text-[8.5px] uppercase tracking-wide text-[var(--fg-faint)]">followers</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/github"
                    className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
                  >
                    Open command center <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2">
                  <p className="text-[11px] leading-relaxed text-[var(--fg-faint)]">
                    No GitHub snapshot yet. Connect a token and sync to populate verified metrics — nothing is estimated.
                  </p>
                  <Link to="/admin/github">
                    <Button variant="secondary" size="sm" icon={<GithubIcon className="h-3.5 w-3.5" />}>
                      Configure GitHub
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <Award className="h-3.5 w-3.5 text-[var(--accent)]" /> Verification policy
              </h2>
              <ul className="mt-2.5 space-y-1.5">
                {[
                  'No fabricated statistics or achievements',
                  'GitHub metrics pulled from the official API',
                  'Manual achievements require a verification note',
                  'Every admin mutation is written to the activity log',
                  'API keys stay server-side and encrypted',
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {rule}
                  </li>
                ))}
              </ul>
              <div className="mt-2.5 flex items-center gap-1.5">
                <Link to="/admin/achievements">
                  <Badge tone="default">achievements</Badge>
                </Link>
                <Link to="/admin/sponsorships">
                  <Badge tone="default">
                    <HeartHandshake className="h-2.5 w-2.5" /> sponsorship
                  </Badge>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                  <Activity className="h-3.5 w-3.5 text-[var(--accent)]" /> Events by type
                </h2>
                <Tooltip label="Recorded client-side events">
                  <span className="text-[9px] text-[var(--fg-faint)]">privacy-first</span>
                </Tooltip>
              </div>
              {(analytics?.events || []).length > 0 ? (
                <div className="mt-2 h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(analytics?.events || []).slice(0, 8)}
                      margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 8.5, fill: '#8b93b0' }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 9, fill: '#8b93b0' }} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip
                        contentStyle={{
                          background: '#0b1020',
                          border: '1px solid rgba(148,163,184,0.25)',
                          borderRadius: 10,
                          fontSize: 11,
                          color: '#e8ecff',
                        }}
                      />
                      <Bar dataKey="count" name="Events" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  className="py-8"
                  title="No events yet"
                  description="Events appear once visitors interact with the portfolio."
                  icon={<BarChart3 className="h-4 w-4" />}
                />
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <Clock className="h-3.5 w-3.5 text-[var(--accent)]" /> Analytics summary
              </h2>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {[
                  { label: 'Pageviews', value: formatNumber(analytics?.totals.pageviews || 0) },
                  { label: 'Unique visitors', value: formatNumber(analytics?.totals.uniqueVisitors || 0) },
                  { label: 'Events', value: formatNumber(analytics?.totals.events || 0) },
                  { label: 'Avg / day', value: formatNumber(analytics?.totals.avgPerDay || 0) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--stroke)] px-2.5 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">{item.label}</p>
                    <p className="mt-0.5 font-display text-base font-semibold text-fg">{item.value}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/analytics"
                className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
              >
                Open analytics <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

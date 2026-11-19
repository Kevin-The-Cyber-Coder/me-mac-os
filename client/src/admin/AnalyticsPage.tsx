import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ExternalLink,
  Eye,
  Globe2,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
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
import { Badge, Button, EmptyState, ErrorState, Progress, Skeleton, StatCard } from '../components/ui'
import { api, apiError } from '../lib/api'
import { cn, formatDate, formatNumber } from '../lib/utils'
import type { AnalyticsSummary } from '../types'

const RANGES = [7, 30, 90, 365]

const CHART_TOOLTIP = {
  background: '#0b1020',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 10,
  fontSize: 11,
  color: '#e8ecff',
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const { data: response } = await api.get('/admin/analytics', { params: { days } })
        setData({
          range: response.range,
          totals: response.totals,
          perDay: response.perDay || [],
          topPages: response.topPages || [],
          referrers: response.referrers || [],
          events: response.events || [],
        })
      } catch (err) {
        setError(apiError(err))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [days]
  )

  useEffect(() => {
    load()
  }, [load])

  const chartData = useMemo(
    () =>
      (data?.perDay || []).map((day) => ({
        date: formatDate(day.date, { month: 'short', day: 'numeric' }),
        views: day.views,
        visitors: day.visitors,
      })),
    [data]
  )

  const peakDay = useMemo(() => {
    if (!data?.perDay?.length) return null
    return data.perDay.reduce((best, day) => (day.views > best.views ? day : best), data.perDay[0])
  }, [data])

  const maxPage = Math.max(1, ...(data?.topPages || []).map((page) => page.views))
  const maxRef = Math.max(1, ...(data?.referrers || []).map((ref) => ref.count))
  const hasTraffic = (data?.totals.pageviews || 0) > 0

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            Insights
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Privacy-first analytics
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Aggregated pageviews, unique visitors and interaction events. No third-party pixels, no cookies, no
            cross-site tracking.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">
              <CalendarDays className="h-2.5 w-2.5" /> last {days} days
            </Badge>
            {data?.range?.since && <Badge tone="default">since {formatDate(data.range.since)}</Badge>}
            {peakDay && peakDay.views > 0 && <Badge tone="default">peak {formatNumber(peakDay.views)} views</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-[var(--stroke)]">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={cn(
                  'px-2.5 py-1.5 font-mono text-[10.5px] transition-colors',
                  days === range
                    ? 'bg-[var(--accent-soft)] text-fg'
                    : 'text-muted hover:bg-white/[0.04] hover:text-fg'
                )}
                aria-pressed={days === range}
              >
                {range}d
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={() => load(true)}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {loading && !data && (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px]" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <div className="grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </div>
      )}

      {!loading && error && !data && <ErrorState message={error} onRetry={() => load()} />}

      {data && (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pageviews"
              value={formatNumber(data.totals.pageviews)}
              hint={`last ${data.range.days} days`}
              icon={<Eye className="h-4 w-4" />}
            />
            <StatCard
              label="Unique visitors"
              value={formatNumber(data.totals.uniqueVisitors)}
              hint="hashed, never stored raw"
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Events"
              value={formatNumber(data.totals.events)}
              hint="interactions recorded"
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <StatCard
              label="Avg / day"
              value={formatNumber(data.totals.avgPerDay)}
              hint="pageviews per day"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Traffic trend</h2>
                <p className="text-[10.5px] text-[var(--fg-faint)]">
                  Pageviews and unique visitors per day for the selected range.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-muted">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> pageviews
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> visitors
                </span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="grid h-[240px] place-items-center rounded-xl border border-dashed border-[var(--stroke)] text-[11.5px] text-[var(--fg-faint)]">
                No analytics data available for this range.
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="analyticsViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="analyticsVisitors" x1="0" y1="0" x2="0" y2="1">
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
                      minTickGap={24}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#8b93b0' }} tickLine={false} axisLine={false} width={42} />
                    <ChartTooltip contentStyle={CHART_TOOLTIP} labelStyle={{ color: '#8b93b0', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Pageviews"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fill="url(#analyticsViews)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      name="Visitors"
                      stroke="#22d3ee"
                      strokeWidth={1.5}
                      fill="url(#analyticsVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {!hasTraffic && (
            <div className="glass rounded-2xl">
              <EmptyState
                title="No pageviews recorded yet"
                description="Traffic appears here once visitors browse the public site. Analytics are collected first-party and aggregated."
                icon={<BarChart3 className="h-5 w-5" />}
                action={
                  <Link to="/">
                    <Button variant="secondary" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Open public site
                    </Button>
                  </Link>
                }
              />
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                  <Globe2 className="h-3.5 w-3.5 text-[var(--accent)]" /> Top pages
                </h2>
                <Badge tone="default">{data.topPages.length}</Badge>
              </div>
              <div className="mt-3 space-y-2.5">
                {data.topPages.length === 0 && (
                  <p className="text-[11px] text-[var(--fg-faint)]">No page paths recorded yet.</p>
                )}
                {data.topPages.slice(0, 10).map((page) => (
                  <div key={page.path}>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-mono text-[var(--fg-muted)]" title={page.path}>
                        {page.path}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--fg-faint)]">
                        {formatNumber(page.views)}
                      </span>
                    </div>
                    <Progress value={(page.views / maxPage) * 100} className="mt-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" /> Referrers
                </h2>
                <Badge tone="default">{data.referrers.length}</Badge>
              </div>
              <div className="mt-3 space-y-2.5">
                {data.referrers.length === 0 && (
                  <p className="text-[11px] text-[var(--fg-faint)]">
                    No external referrers recorded. Direct visits are not listed here.
                  </p>
                )}
                {data.referrers.slice(0, 10).map((ref) => (
                  <div key={ref.source}>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-[var(--fg-muted)]" title={ref.source}>
                        {ref.source}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--fg-faint)]">{ref.count}</span>
                    </div>
                    <Progress value={(ref.count / maxRef) * 100} className="mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <MousePointerClick className="h-3.5 w-3.5 text-[var(--accent)]" /> Events by type
              </h2>
              {data.events.length > 0 ? (
                <div className="mt-2 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.events.slice(0, 12)} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 8.5, fill: '#8b93b0' }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={44}
                      />
                      <YAxis tick={{ fontSize: 9, fill: '#8b93b0' }} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="count" name="Events" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  className="py-10"
                  title="No events recorded"
                  description="Events appear when visitors interact with the terminal, assistant or other tracked features."
                  icon={<MousePointerClick className="h-4 w-4" />}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="glass rounded-2xl p-4">
                <h2 className="font-display text-[13px] font-semibold text-fg">Collection policy</h2>
                <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-muted">
                  <li>· IP addresses are hashed, never stored raw</li>
                  <li>· No cookies or cross-site identifiers</li>
                  <li>· Aggregates only in this dashboard</li>
                  <li>· Raw records are readable but not editable</li>
                </ul>
                <Link
                  to="/admin/analytics-events"
                  className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
                >
                  Raw event records <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="glass rounded-2xl p-4">
                <h2 className="font-display text-[13px] font-semibold text-fg">Range</h2>
                <dl className="mt-2 space-y-1.5 text-[10.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[var(--fg-faint)]">Window</dt>
                    <dd className="font-mono text-[var(--fg-muted)]">{data.range.days} days</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[var(--fg-faint)]">Since</dt>
                    <dd className="font-mono text-[var(--fg-muted)]">{formatDate(data.range.since)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[var(--fg-faint)]">Peak day</dt>
                    <dd className="font-mono text-[var(--fg-muted)]">
                      {peakDay ? `${formatDate(peakDay.date)} · ${peakDay.views}` : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

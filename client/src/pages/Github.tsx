import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  Code2,
  ExternalLink,
  GitBranch,
  GitFork,
  Github as GithubIcon,
  GitPullRequest,
  Globe2,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  XCircle,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Progress,
  SectionTitle,
  Skeleton,
  StatCard,
  Tabs,
  Tooltip,
} from '../components/ui'
import { api, apiError } from '../lib/api'
import { cn, formatDate, formatNumber, timeAgo } from '../lib/utils'
import type { Achievement, AchievementBoard, GithubRepo, GithubSummary } from '../types'

type TabKey = 'overview' | 'achievements' | 'repositories' | 'activity'

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: 'overview', label: 'Overview', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: 'achievements', label: 'Achievements', icon: <Award className="h-3.5 w-3.5" /> },
  { key: 'repositories', label: 'Repositories', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" /> },
]

function heatColor(count: number) {
  if (!count) return 'rgba(255,255,255,0.055)'
  if (count < 3) return 'rgba(52,211,153,0.28)'
  if (count < 6) return 'rgba(52,211,153,0.45)'
  if (count < 10) return 'rgba(52,211,153,0.68)'
  return 'rgba(52,211,153,0.95)'
}

function ContributionHeatmap({ days, total }: { days: { date: string; count: number }[]; total: number }) {
  const weeks = useMemo(() => {
    const chunks: { date: string; count: number }[][] = []
    for (let index = 0; index < days.length; index += 7) chunks.push(days.slice(index, index + 7))
    return chunks
  }, [days])

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[14px] font-semibold text-fg">Contribution calendar</h2>
          <p className="text-[10.5px] text-[var(--fg-faint)]">Verified from the GitHub GraphQL contribution collection.</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold leading-none text-fg">{formatNumber(total)}</p>
          <p className="text-[9.5px] uppercase tracking-wider text-[var(--fg-faint)]">contributions</p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date)}`}
                  className="h-[9px] w-[9px] rounded-[2px] ring-1 ring-white/[0.04]"
                  style={{ backgroundColor: heatColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-[var(--fg-faint)]">
        <span>{days[0] ? formatDate(days[0].date, { month: 'short', year: 'numeric' }) : ''}</span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 3, 6, 10].map((count) => (
            <span key={count} className="h-[9px] w-[9px] rounded-[2px]" style={{ backgroundColor: heatColor(count) }} />
          ))}
          More
        </span>
        <span>{days.length ? formatDate(days[days.length - 1].date, { month: 'short', year: 'numeric' }) : ''}</span>
      </div>
    </div>
  )
}

function RepoCard({ repo }: { repo: GithubRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass card-hover group flex h-full flex-col rounded-2xl p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-[13.5px] font-semibold text-fg group-hover:text-[color-mix(in_srgb,var(--accent)_85%,white)]">
            {repo.name}
          </p>
          <p className="truncate font-mono text-[9px] text-[var(--fg-faint)]">{repo.fullName}</p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-2 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed text-muted">
        {repo.description || 'No description provided in the repository.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {repo.language && (
          <span className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-[var(--fg-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> {repo.language}
          </span>
        )}
        {repo.license && (
          <span className="rounded-md border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-[var(--fg-faint)]">
            {repo.license}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-[var(--stroke)] pt-2.5 text-[10px] text-[var(--fg-faint)]">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" /> {formatNumber(repo.stars)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" /> {formatNumber(repo.forks)}
        </span>
        <span className="ml-auto">{timeAgo(repo.updatedAt)}</span>
      </div>
    </a>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="glass flex h-full flex-col rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
              achievement.verified
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                : 'border-[var(--stroke)] bg-[var(--panel-soft)] text-muted'
            )}
          >
            <Award className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-[13px] font-semibold text-fg">{achievement.name}</h3>
            <p className="truncate text-[9.5px] text-[var(--fg-faint)]">
              Level {achievement.currentLevel} · {achievement.currentLevelLabel}
            </p>
          </div>
        </div>
        <Badge tone={achievement.verified ? 'success' : 'default'} className="shrink-0">
          {achievement.verified ? (
            <>
              <BadgeCheck className="h-2.5 w-2.5" /> verified
            </>
          ) : (
            <>
              <CircleSlash className="h-2.5 w-2.5" /> unverified
            </>
          )}
        </Badge>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-muted">{achievement.description}</p>

      <div className="mt-3">
        <div className="mb-1 flex items-end justify-between text-[10px]">
          <span className="text-[var(--fg-faint)]">
            {achievement.verified ? `${formatNumber(achievement.current)} verified` : 'manual tracking'}
          </span>
          <span className="font-mono text-[9.5px] text-muted">
            {achievement.nextTarget ? `${formatNumber(achievement.current)} / ${formatNumber(achievement.nextTarget)}` : 'max level'}
          </span>
        </div>
        <Progress value={achievement.percent} />
        <div className="mt-1 flex items-center justify-between text-[9px] text-[var(--fg-faint)]">
          <span>source · {achievement.source}</span>
          <span>{achievement.nextLevel ? `next · level ${achievement.nextLevel}` : 'all levels reached'}</span>
        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-2.5 flex items-center gap-1 text-left text-[10px] font-medium text-[var(--fg-muted)] hover:text-fg"
        aria-expanded={open}
      >
        {open ? 'Hide strategy' : 'How this is earned'}
        <ArrowUpRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] p-2.5">
          <ul className="space-y-1">
            {achievement.strategy.map((tip) => (
              <li key={tip} className="flex gap-1.5 text-[10.5px] leading-relaxed text-muted">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {tip}
              </li>
            ))}
          </ul>
          <p className="border-t border-[var(--stroke)] pt-1.5 text-[9px] leading-relaxed text-[var(--fg-faint)]">
            {achievement.notes || achievement.officialStatus}
          </p>
          <a
            href={achievement.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[9.5px] font-medium text-[color-mix(in_srgb,var(--accent)_85%,white)] hover:underline"
          >
            Verify on GitHub <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}
    </article>
  )
}

export default function Github() {
  const [summary, setSummary] = useState<GithubSummary | null>(null)
  const [board, setBoard] = useState<AchievementBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [summaryRes, boardRes] = await Promise.all([
        api.get('/github/summary'),
        api.get('/github/achievements'),
      ])
      setSummary(summaryRes.data.summary as GithubSummary)
      setBoard({ ...(boardRes.data as AchievementBoard) })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const profile = summary?.profile
  const contributions = summary?.contributions
  const achievements = board?.achievements || []

  const verifiedCount = achievements.filter((item) => item.verified).length
  const languages = summary?.languages || []
  const languageTotal = languages.reduce((sum, item) => sum + item.count, 0) || 1

  return (
    <>
      <Seo
        title="GitHub Command Center"
        description="Verified GitHub activity, repository health, contribution history and achievement progress for Mukeshimana Kevin. No fabricated statistics."
      />

      <header className="mb-6 flex flex-col gap-4 border-b border-[var(--stroke)] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            GitHub Command Center
          </div>
          <h1 className="font-display text-[clamp(1.6rem,3.4vw,2.3rem)] font-semibold leading-tight text-fg">
            Proof of work, <span className="text-gradient">pulled live</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            Everything on this page comes from the GitHub API or is explicitly marked as manually tracked. Achievements are
            awarded only by GitHub — this page shows progress, never a claim of an unlock.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={summary?.ok ? 'success' : 'warning'}>
              <span className={cn('h-1.5 w-1.5 rounded-full', summary?.ok ? 'bg-emerald-400' : 'bg-amber-400')} />
              {summary?.ok ? 'live data' : 'data unavailable'}
            </Badge>
            <Badge tone="default">
              <ShieldCheck className="h-2.5 w-2.5" /> verified only
            </Badge>
            {summary?.tokenConfigured && <Badge tone="accent">GraphQL token active</Badge>}
            {summary?.fetchedAt && <Badge tone="default">fetched {timeAgo(summary.fetchedAt)}</Badge>}
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
          {profile?.htmlUrl && (
            <a href={profile.htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" icon={<GithubIcon className="h-3.5 w-3.5" />}>
                Open profile
              </Button>
            </a>
          )}
        </div>
      </header>

      {loading && (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px]" />
            ))}
          </div>
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

      {!loading && !error && summary && !summary.ok && (
        <div className="space-y-3">
          <Alert tone="warning" title="Live GitHub data is not available right now">
            {summary.error || 'The GitHub integration is not configured.'} No statistics are shown rather than displaying
            estimates or fabricated numbers. Set <code className="rounded bg-white/10 px-1">GITHUB_USERNAME</code> and a
            read-only <code className="rounded bg-white/10 px-1">GITHUB_TOKEN</code> on the server to enable live data.
          </Alert>
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-[15px] font-semibold text-fg">What this page will show once connected</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'Profile, followers and public repository totals',
                'Stars and language distribution across repositories',
                'Contribution calendar from the GitHub GraphQL API',
                'Top repositories with license and activity metadata',
                'Achievement progress with verified metrics',
                'Recent public activity events',
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-xl border border-[var(--stroke)] p-2.5 text-[11.5px] text-muted">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--fg-faint)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && summary?.ok && (
        <>
          <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Public repositories"
              value={formatNumber(summary.publicRepos || 0)}
              hint="owned by this account"
              icon={<BookOpen className="h-4 w-4" />}
            />
            <StatCard
              label="Stars earned"
              value={formatNumber(summary.stars || 0)}
              hint="across public repositories"
              icon={<Star className="h-4 w-4" />}
            />
            <StatCard
              label="Merged pull requests"
              value={summary.mergedPRs === null || summary.mergedPRs === undefined ? '—' : formatNumber(summary.mergedPRs)}
              hint={summary.mergedPRs === null ? 'requires a GitHub token' : 'authored and merged'}
              icon={<GitPullRequest className="h-4 w-4" />}
            />
            <StatCard
              label="Verified achievements"
              value={`${verifiedCount}/${achievements.length || 7}`}
              hint="metrics verified by API"
              icon={<Award className="h-4 w-4" />}
            />
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-start gap-3.5">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.login} avatar`}
                    className="h-16 w-16 rounded-2xl border border-[var(--stroke)] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--panel-soft)]">
                    <GithubIcon className="h-7 w-7 text-muted" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold leading-tight text-fg">
                    {profile?.name || profile?.login}
                  </h2>
                  <a
                    href={profile?.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-[color-mix(in_srgb,var(--accent)_85%,white)] hover:underline"
                  >
                    @{profile?.login}
                  </a>
                  {profile?.bio && <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{profile.bio}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--fg-faint)]">
                    {profile?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {profile.location}
                      </span>
                    )}
                    {profile?.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {profile.company}
                      </span>
                    )}
                    {profile?.blog && (
                      <a
                        href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-fg"
                      >
                        <Globe2 className="h-3 w-3" /> {profile.blog}
                      </a>
                    )}
                    {profile?.createdAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> joined {formatDate(profile.createdAt, { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-4 text-center">
                  <div>
                    <p className="font-display text-lg font-semibold text-fg">{formatNumber(profile?.followers || 0)}</p>
                    <p className="text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">followers</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-fg">{formatNumber(profile?.following || 0)}</p>
                    <p className="text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">following</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                <Code2 className="h-3.5 w-3.5 text-[var(--accent)]" /> Language distribution
              </h2>
              <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                {languages.slice(0, 6).map((language, index) => (
                  <span
                    key={language.name}
                    title={`${language.name}: ${language.count} repositories`}
                    style={{
                      width: `${(language.count / languageTotal) * 100}%`,
                      backgroundColor: ['#7c5cff', '#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#60a5fa'][index % 6],
                    }}
                  />
                ))}
              </div>
              <div className="mt-2.5 space-y-1">
                {languages.slice(0, 5).map((language, index) => (
                  <div key={language.name} className="flex items-center gap-1.5 text-[10.5px]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ['#7c5cff', '#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#60a5fa'][index % 6] }}
                    />
                    <span className="flex-1 text-[var(--fg-muted)]">{language.name}</span>
                    <span className="font-mono text-[9.5px] text-[var(--fg-faint)]">{language.count}</span>
                  </div>
                ))}
                {languages.length === 0 && <p className="text-[10.5px] text-[var(--fg-faint)]">No language data reported.</p>}
              </div>
            </div>
          </div>

          <Tabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            className="mb-4"
          />

          {tab === 'overview' && (
            <div className="space-y-3">
              {contributions && contributions.days.length > 0 ? (
                <ContributionHeatmap days={contributions.days} total={contributions.total} />
              ) : (
                <Alert tone="info" title="Contribution calendar needs a token">
                  GitHub only exposes the contribution calendar through the GraphQL API with a token. Add a read-only
                  <code className="mx-1 rounded bg-white/10 px-1">GITHUB_TOKEN</code> to display it — no estimated calendar is
                  generated.
                </Alert>
              )}

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="glass rounded-2xl p-4">
                  <SectionTitle title="Top repositories" subtitle="Ranked by stars, forks excluded." />
                  <div className="space-y-2">
                    {(summary.topRepos || []).slice(0, 5).map((repo) => (
                      <a
                        key={repo.fullName}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-[var(--stroke)] px-3 py-2 transition-colors hover:border-[var(--stroke-strong)]"
                      >
                        <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--fg-faint)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-medium text-fg">{repo.name}</p>
                          <p className="truncate text-[9.5px] text-[var(--fg-faint)]">{repo.language || 'no language'}</p>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--fg-faint)]">
                          <Star className="h-3 w-3" /> {repo.stars}
                        </span>
                        <ArrowUpRight className="h-3 w-3 text-muted" />
                      </a>
                    ))}
                    {(summary.topRepos || []).length === 0 && (
                      <p className="text-[11px] text-[var(--fg-faint)]">No public repositories returned.</p>
                    )}
                  </div>
                </div>

                <div className="glass rounded-2xl p-4">
                  <SectionTitle title="Recent public activity" subtitle="Newest public events from the GitHub events API." />
                  <div className="space-y-2">
                    {(summary.recentActivity || []).slice(0, 5).map((event, index) => (
                      <a
                        key={`${event.url}-${index}`}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                      >
                        <Activity className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] text-fg">{event.title}</p>
                          <p className="truncate font-mono text-[9px] text-[var(--fg-faint)]">
                            {event.repo} · {timeAgo(event.date)}
                          </p>
                        </div>
                      </a>
                    ))}
                    {(summary.recentActivity || []).length === 0 && (
                      <p className="text-[11px] text-[var(--fg-faint)]">No public events returned.</p>
                    )}
                  </div>
                </div>
              </div>

              <Alert tone="info" title="How verification works">
                {board?.disclaimer ||
                  'Verified metrics come from the GitHub API. Metrics the public API cannot query must be verified manually against the GitHub profile. Badges are awarded solely by GitHub.'}
              </Alert>
            </div>
          )}

          {tab === 'achievements' && (
            <div className="space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <AchievementCard key={achievement.key} achievement={achievement} />
                ))}
              </div>
              {achievements.length === 0 && (
                <EmptyState
                  title="No achievement definitions loaded"
                  description="The server returned an empty achievement board."
                  icon={<Award className="h-5 w-5" />}
                />
              )}
              <div className="glass rounded-2xl p-4">
                <h3 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                  <Info className="h-3.5 w-3.5 text-[var(--accent)]" /> Metrics the public API cannot verify
                </h3>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(board?.metrics || {}).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-[var(--stroke)] px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">{key}</p>
                      <p className={cn('mt-0.5 font-mono text-[11.5px]', value === null ? 'text-[var(--fg-faint)]' : 'text-fg')}>
                        {value === null ? 'not queryable' : formatNumber(value)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[10px] leading-relaxed text-[var(--fg-faint)]">
                  Co-authored PRs, accepted discussion answers, Quickdraw, YOLO and sponsorship verification cannot be read
                  reliably from the public API. They are tracked manually with a verification date — never inferred.
                </p>
              </div>
            </div>
          )}

          {tab === 'repositories' && (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {(summary.topRepos || []).map((repo) => (
                <RepoCard key={repo.fullName} repo={repo} />
              ))}
              {(summary.topRepos || []).length === 0 && (
                <EmptyState
                  className="col-span-full"
                  title="No repositories returned"
                  description="GitHub returned an empty repository list for this account."
                  icon={<GithubIcon className="h-5 w-5" />}
                />
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="glass rounded-2xl p-4">
              <SectionTitle title="Public event stream" subtitle="Pulled from the GitHub public events API." />
              <ol className="relative space-y-3 border-l border-[var(--stroke)] pl-4">
                {(summary.recentActivity || []).map((event, index) => (
                  <li key={`${event.url}-${index}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--accent)] ring-4 ring-[var(--bg)]" />
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="group block">
                      <p className="text-[12px] font-medium text-fg group-hover:text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                        {event.title}
                      </p>
                      <p className="font-mono text-[9.5px] text-[var(--fg-faint)]">
                        {event.type} · {event.repo} · {formatDate(event.date)}
                      </p>
                    </a>
                  </li>
                ))}
                {(summary.recentActivity || []).length === 0 && (
                  <li className="text-[11.5px] text-[var(--fg-faint)]">No public events returned.</li>
                )}
              </ol>
            </div>
          )}
        </>
      )}

      {!loading && !error && !summary && (
        <EmptyState
          title="GitHub integration not configured"
          description="Set GITHUB_USERNAME and a read-only GITHUB_TOKEN in the server environment."
          icon={<GithubIcon className="h-5 w-5" />}
        />
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--stroke)] px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Repository health analysis and sponsorship verification run inside the admin command center.
        </p>
        <div className="flex items-center gap-2">
          {summary?.rateLimit?.remaining && (
            <span className="font-mono text-[9px] text-[var(--fg-faint)]">API remaining · {summary.rateLimit.remaining}</span>
          )}
          <Link to="/admin/github" className="flex items-center gap-1 text-[10.5px] text-muted hover:text-fg">
            Open analyzer <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[9.5px] text-[var(--fg-faint)]">
        <XCircle className="h-2.5 w-2.5" />
        This page never displays estimated, simulated or fabricated GitHub statistics.
        <Tooltip label="Data source: api.github.com">
          <span className="ml-auto flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> public API
          </span>
        </Tooltip>
      </div>
    </>
  )
}

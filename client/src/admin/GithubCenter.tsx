import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  GitBranch,
  Github as GithubIcon,
  HeartHandshake,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  XCircle,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Progress,
  Skeleton,
  StatCard,
  Tabs,
  Textarea,
  Toggle,
} from '../components/ui'
import { api, apiError } from '../lib/api'
import { toast } from '../lib/toast'
import { cn, formatNumber, timeAgo } from '../lib/utils'
import type { Achievement, AchievementBoard, GithubSummary, RepoAudit } from '../types'

type TabKey = 'overview' | 'audit' | 'sponsorships' | 'achievements'

interface SponsorshipRow {
  id: string
  packageName: string
  version?: string
  repository: string
  maintainers: string[]
  fundingUrls: string[]
  fundingSource: string
  verified: boolean
  status: 'unreviewed' | 'reviewed' | 'sponsored'
  note: string
  lastCheckedAt?: string
}

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: 'overview', label: 'Overview', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: 'audit', label: 'Repo audit', icon: <Wrench className="h-3.5 w-3.5" /> },
  { key: 'sponsorships', label: 'Sponsorships', icon: <HeartHandshake className="h-3.5 w-3.5" /> },
  { key: 'achievements', label: 'Achievements', icon: <Award className="h-3.5 w-3.5" /> },
]

export default function GithubCenter() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [summary, setSummary] = useState<GithubSummary | null>(null)
  const [board, setBoard] = useState<AchievementBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [audit, setAudit] = useState<RepoAudit | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  const [sponsorships, setSponsorships] = useState<SponsorshipRow[]>([])
  const [sponsorLoading, setSponsorLoading] = useState(false)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [sponsorBusy, setSponsorBusy] = useState<string | null>(null)

  const [editing, setEditing] = useState<Achievement | null>(null)
  const [progressValue, setProgressValue] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [progressSaving, setProgressSaving] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/admin/github/overview')
      setSummary(data.summary as GithubSummary)
      setBoard(data.achievements as AchievementBoard)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAudit = useCallback(async (force = false) => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const { data } = await api.get('/github/audit', { params: force ? { force: 'true' } : {} })
      setAudit(data as RepoAudit)
    } catch (err) {
      setAuditError(apiError(err))
    } finally {
      setAuditLoading(false)
    }
  }, [])

  const loadSponsorships = useCallback(async (force = false) => {
    setSponsorLoading(true)
    setSponsorError(null)
    try {
      await api.get('/github/sponsorships', { params: force ? { force: 'true' } : {} })
      const { data } = await api.get('/admin/sponsorships', { params: { limit: 100 } })
      setSponsorships((data.items || []) as SponsorshipRow[])
    } catch (err) {
      setSponsorError(apiError(err))
    } finally {
      setSponsorLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (tab === 'audit' && !audit && !auditLoading) loadAudit()
    if (tab === 'sponsorships' && !sponsorships.length && !sponsorLoading) loadSponsorships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const sync = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/github/sync')
      setSummary(data.summary as GithubSummary)
      setBoard(data.achievements as AchievementBoard)
      toast('GitHub data synced')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSyncing(false)
    }
  }

  const openProgress = (achievement: Achievement) => {
    setEditing(achievement)
    setProgressValue(String(achievement.current || 0))
    setProgressNote(achievement.notes || '')
    setProgressError(null)
  }

  const saveProgress = async () => {
    if (!editing) return
    setProgressSaving(true)
    setProgressError(null)
    try {
      await api.patch(`/github/achievements/${editing.key}`, {
        current: Number(progressValue) || 0,
        note: progressNote,
      })
      toast('Achievement progress saved')
      setEditing(null)
      await loadOverview()
    } catch (err) {
      setProgressError(apiError(err))
    } finally {
      setProgressSaving(false)
    }
  }

  const updateSponsor = async (row: SponsorshipRow, patch: Partial<SponsorshipRow>) => {
    setSponsorBusy(row.id)
    try {
      await api.patch(`/admin/sponsorships/${row.id}`, patch)
      setSponsorships((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...patch } : item)))
      toast('Sponsorship updated')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSponsorBusy(null)
    }
  }

  const achievements = board?.achievements || []
  const verifiedCount = achievements.filter((item) => item.verified).length
  const sponsorVerified = sponsorships.filter((item) => item.verified).length
  const avgAudit = useMemo(() => {
    if (!audit?.repositories?.length) return audit?.averageScore || 0
    return Math.round(audit.repositories.reduce((sum, repo) => sum + repo.score, 0) / audit.repositories.length)
  }, [audit])

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            GitHub command center
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Verified data, <span className="text-gradient">never invented</span>
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Sync live metrics, audit repository health and track achievement progress. Badges are awarded only by GitHub.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={summary?.ok ? 'success' : 'warning'}>
              <span className={cn('h-1.5 w-1.5 rounded-full', summary?.ok ? 'bg-emerald-400' : 'bg-amber-400')} />
              {summary?.ok ? 'live' : 'not connected'}
            </Badge>
            <Badge tone="default">
              <ShieldCheck className="h-2.5 w-2.5" /> {verifiedCount}/{achievements.length || 7} verified
            </Badge>
            {summary?.tokenConfigured && <Badge tone="accent">token active</Badge>}
            {summary?.fetchedAt && <Badge tone="default">synced {timeAgo(summary.fetchedAt)}</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={syncing}
            onClick={sync}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Sync now
          </Button>
          {summary?.profile?.htmlUrl && (
            <a href={summary.profile.htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" icon={<GithubIcon className="h-3.5 w-3.5" />}>
                Profile
              </Button>
            </a>
          )}
        </div>
      </header>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {loading && !summary && (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[88px]" />
            ))}
          </div>
          <Skeleton className="h-56" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={loadOverview} />}

      {tab === 'overview' && !loading && !error && (
        <div className="space-y-3">
          {!summary?.ok && (
            <Alert tone="warning" title="Live GitHub data is unavailable">
              {summary?.error ||
                'Set GITHUB_USERNAME and a read-only GITHUB_TOKEN in the server environment to enable live data.'}{' '}
              No estimated or fabricated statistics are displayed in the meantime.
            </Alert>
          )}

          {summary?.ok && (
            <>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Public repositories"
                  value={formatNumber(summary.publicRepos || 0)}
                  hint="owned by this account"
                  icon={<GithubIcon className="h-4 w-4" />}
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
                  hint={summary.mergedPRs === null ? 'requires a token' : 'authored and merged'}
                  icon={<GitBranch className="h-4 w-4" />}
                />
                <StatCard
                  label="Verified achievements"
                  value={`${verifiedCount}/${achievements.length || 7}`}
                  hint="metrics verified by API"
                  icon={<Award className="h-4 w-4" />}
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                <div className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {summary.profile?.avatarUrl ? (
                      <img
                        src={summary.profile.avatarUrl}
                        alt="GitHub avatar"
                        className="h-14 w-14 rounded-xl border border-[var(--stroke)] object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--panel-soft)]">
                        <GithubIcon className="h-6 w-6 text-muted" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold text-fg">
                        {summary.profile?.name || summary.profile?.login}
                      </p>
                      <a
                        href={summary.profile?.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10.5px] text-[color-mix(in_srgb,var(--accent)_85%,white)] hover:underline"
                      >
                        @{summary.username}
                      </a>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--fg-faint)]">
                        <span>{formatNumber(summary.profile?.followers || 0)} followers</span>
                        <span>{formatNumber(summary.profile?.following || 0)} following</span>
                        {summary.profile?.location && <span>{summary.profile.location}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">rate limit</p>
                      <p className="font-mono text-[11px] text-fg">{summary.rateLimit?.remaining ?? '—'}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--stroke)] p-2.5">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">Top languages</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(summary.languages || []).slice(0, 6).map((language) => (
                          <span
                            key={language.name}
                            className="rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-[var(--fg-muted)]"
                          >
                            {language.name} · {language.count}
                          </span>
                        ))}
                        {(summary.languages || []).length === 0 && (
                          <span className="text-[10px] text-[var(--fg-faint)]">No language data.</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--stroke)] p-2.5">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">
                        Contributions (last year)
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold text-fg">
                        {summary.contributions ? formatNumber(summary.contributions.total) : '—'}
                      </p>
                      <p className="text-[9px] text-[var(--fg-faint)]">
                        {summary.contributions ? 'from GraphQL contribution calendar' : 'requires a GitHub token'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-4">
                  <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                    <Activity className="h-3.5 w-3.5 text-[var(--accent)]" /> Recent activity
                  </h2>
                  <div className="mt-2 space-y-1.5">
                    {(summary.recentActivity || []).slice(0, 7).map((event, index) => (
                      <a
                        key={`${event.url}-${index}`}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                      >
                        <p className="truncate text-[10.5px] text-fg">{event.title}</p>
                        <p className="truncate font-mono text-[8.5px] text-[var(--fg-faint)]">
                          {event.repo} · {timeAgo(event.date)}
                        </p>
                      </a>
                    ))}
                    {(summary.recentActivity || []).length === 0 && (
                      <p className="text-[10.5px] text-[var(--fg-faint)]">No public events returned.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-4">
                <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
                  <Star className="h-3.5 w-3.5 text-[var(--accent)]" /> Top repositories
                </h2>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {(summary.topRepos || []).slice(0, 6).map((repo) => (
                    <a
                      key={repo.fullName}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] px-2.5 py-2 transition-colors hover:border-[var(--stroke-strong)]"
                    >
                      <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--fg-faint)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-fg">{repo.name}</p>
                        <p className="truncate text-[9px] text-[var(--fg-faint)]">{repo.language || 'no language'}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--fg-faint)]">
                        <Star className="h-3 w-3" /> {repo.stars}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <Alert tone="info" title="Verification policy">
            {board?.disclaimer ||
              'Verified metrics come from the GitHub API. Metrics that cannot be queried publicly are tracked manually with a verification date — never inferred.'}
          </Alert>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                <Wrench className="h-2.5 w-2.5" /> {audit?.repositories?.length || 0} repositories
              </Badge>
              {audit?.auditedAt && <Badge tone="default">audited {timeAgo(audit.auditedAt)}</Badge>}
              {audit?.repositories?.length ? <Badge tone="success">avg score {avgAudit}</Badge> : null}
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={auditLoading}
              onClick={() => loadAudit(true)}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Re-run audit
            </Button>
          </div>

          {auditLoading && !audit && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          )}

          {!auditLoading && auditError && <ErrorState message={auditError} onRetry={() => loadAudit()} />}

          {!auditLoading && !auditError && audit && !audit.ok && (
            <Alert tone="warning" title="Audit unavailable">
              {audit.error || 'GitHub is not configured, so no repository health scores can be computed.'}
            </Alert>
          )}

          {!auditLoading && !auditError && audit?.ok && (
            <>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {audit.repositories.map((repo) => (
                  <div key={repo.fullName} className="glass rounded-2xl p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[12.5px] font-semibold text-fg">{repo.name}</p>
                        <p className="truncate font-mono text-[9px] text-[var(--fg-faint)]">{repo.fullName}</p>
                      </div>
                      <Badge tone={repo.score >= 80 ? 'success' : repo.score >= 50 ? 'warning' : 'danger'}>
                        {repo.score}
                      </Badge>
                    </div>
                    <Progress value={repo.score} className="mt-2" />
                    <div className="mt-2 space-y-1">
                      {repo.checks.map((check) => (
                        <div key={check.key} className="flex items-start gap-1.5 text-[10px]">
                          {check.passed ? (
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          ) : (
                            <CircleSlash className="mt-0.5 h-3 w-3 shrink-0 text-[var(--fg-faint)]" />
                          )}
                          <span className={check.passed ? 'text-[var(--fg-muted)]' : 'text-[var(--fg-faint)]'}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-[var(--stroke)] pt-2">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)] hover:text-fg"
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> Open repo
                      </a>
                      <span className="flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)]">
                        <Star className="h-2.5 w-2.5" /> {repo.stars}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {audit.note && <p className="text-[10px] leading-relaxed text-[var(--fg-faint)]">{audit.note}</p>}
            </>
          )}
        </div>
      )}

      {tab === 'sponsorships' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                <HeartHandshake className="h-2.5 w-2.5" /> {sponsorships.length} dependencies
              </Badge>
              <Badge tone={sponsorVerified ? 'success' : 'default'}>{sponsorVerified} funding files verified</Badge>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={sponsorLoading}
              onClick={() => loadSponsorships(true)}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Re-check funding
            </Button>
          </div>

          <Alert tone="info" title="Verification rules">
            A dependency is only marked verified when a <code className="rounded bg-white/10 px-1">FUNDING.yml</code> file
            declares a funding link. Sponsorship availability is never assumed.
          </Alert>

          {sponsorLoading && !sponsorships.length && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          )}

          {!sponsorLoading && sponsorError && <ErrorState message={sponsorError} onRetry={() => loadSponsorships()} />}

          {!sponsorLoading && !sponsorError && sponsorships.length === 0 && (
            <div className="glass rounded-2xl">
              <EmptyState
                title="No sponsorship candidates yet"
                description="Run a funding check to inspect direct dependencies for declared FUNDING.yml links."
                icon={<HeartHandshake className="h-5 w-5" />}
                action={
                  <Button size="sm" onClick={() => loadSponsorships(true)} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Run funding check
                  </Button>
                }
              />
            </div>
          )}

          {sponsorships.length > 0 && (
            <div className="space-y-2">
              {sponsorships.map((row) => (
                <div key={row.id} className="glass rounded-2xl p-3.5">
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-display text-[12.5px] font-semibold text-fg">{row.packageName}</p>
                        {row.version && <span className="font-mono text-[9px] text-[var(--fg-faint)]">{row.version}</span>}
                        <Badge tone={row.verified ? 'success' : 'default'}>
                          {row.verified ? <BadgeCheck className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                          {row.verified ? 'funding verified' : 'no funding file'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--fg-faint)]">{row.fundingSource || '—'}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(row.fundingUrls || []).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9px] text-[var(--fg-muted)] hover:text-fg"
                          >
                            sponsor <ArrowUpRight className="h-2 w-2" />
                          </a>
                        ))}
                        {row.repository && (
                          <a
                            href={row.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9px] text-[var(--fg-muted)] hover:text-fg"
                          >
                            repository <ExternalLink className="h-2 w-2" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={row.status}
                        disabled={sponsorBusy === row.id}
                        onChange={(event) =>
                          updateSponsor(row, { status: event.target.value as SponsorshipRow['status'] })
                        }
                        className="rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-2 py-1 text-[10.5px] text-fg outline-none disabled:opacity-50"
                        aria-label={`Status for ${row.packageName}`}
                      >
                        <option value="unreviewed">unreviewed</option>
                        <option value="reviewed">reviewed</option>
                        <option value="sponsored">sponsored</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[10px] text-muted">
                        <Toggle
                          checked={Boolean(row.verified)}
                          onChange={(next) => updateSponsor(row, { verified: next })}
                          disabled={sponsorBusy === row.id}
                        />
                        verified
                      </label>
                    </div>
                  </div>
                  {row.note && <p className="mt-2 text-[10px] leading-relaxed text-[var(--fg-faint)]">{row.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'achievements' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <Award className="h-2.5 w-2.5" /> {achievements.length} definitions
            </Badge>
            <Badge tone={verifiedCount ? 'success' : 'default'}>{verifiedCount} verified from API</Badge>
            <span className="ml-auto text-[10px] text-[var(--fg-faint)]">
              GitHub awards badges — progress only is tracked here.
            </span>
          </div>

          {achievements.length === 0 && (
            <div className="glass rounded-2xl">
              <EmptyState
                title="No achievement definitions"
                description="The achievement board returned no definitions."
                icon={<Award className="h-5 w-5" />}
              />
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <div key={achievement.key} className="glass rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-display text-[12.5px] font-semibold text-fg">{achievement.name}</p>
                      <Badge tone={achievement.verified ? 'success' : 'default'}>
                        {achievement.verified ? 'verified' : achievement.source}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--fg-muted)]">{achievement.description}</p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-semibold text-fg">{achievement.percent}%</span>
                </div>
                <Progress value={achievement.percent} className="mt-2" />
                <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-[var(--fg-faint)]">
                  <span>
                    {formatNumber(achievement.current)}
                    {achievement.nextTarget ? ` / ${formatNumber(achievement.nextTarget)}` : ' · max level'}
                  </span>
                  <span>
                    level {achievement.currentLevel}
                    {achievement.nextLevel ? ` → ${achievement.nextLevel}` : ''}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--stroke)] pt-2">
                  <a
                    href={achievement.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)] hover:text-fg"
                  >
                    verify on GitHub <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  {achievement.source !== 'github' ? (
                    <Button variant="secondary" size="sm" onClick={() => openProgress(achievement)}>
                      Update progress
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400/80">
                      <ShieldCheck className="h-2.5 w-2.5" /> API-managed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
              <Info className="h-3.5 w-3.5 text-[var(--accent)]" /> Non-queryable metrics
            </h3>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(board?.metrics || {}).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-[var(--stroke)] px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">{key}</p>
                  <p className={cn('mt-0.5 font-mono text-[11px]', value === null ? 'text-[var(--fg-faint)]' : 'text-fg')}>
                    {value === null ? 'not queryable' : formatNumber(value)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--fg-faint)]">
              Manual progress requires a verification note. Nothing is inferred or auto-incremented.
            </p>
          </div>

          <Link
            to="/admin/achievements"
            className="flex items-center justify-between rounded-xl border border-[var(--stroke)] px-3 py-2 text-[10.5px] text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg"
          >
            Open raw achievement records <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Update ${editing?.name || 'achievement'}`}
        description="Manual metrics must be verified against your GitHub profile before saving."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveProgress} loading={progressSaving} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              Save progress
            </Button>
          </>
        }
      >
        {progressError && (
          <div className="mb-3">
            <Alert tone="danger">{progressError}</Alert>
          </div>
        )}
        <div className="space-y-3">
          <Field label="Verified current value" required hint="Enter the value you confirmed on GitHub.">
            <Input
              type="number"
              min={0}
              value={progressValue}
              onChange={(event) => setProgressValue(event.target.value)}
            />
          </Field>
          <Field label="Verification note" hint="Where and when you verified this value.">
            <Textarea
              value={progressNote}
              onChange={(event) => setProgressNote(event.target.value)}
              placeholder="Checked github.com/… on 18 Nov 2026"
            />
          </Field>
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--fg-faint)]">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
            This updates tracked progress only. It does not and cannot award a GitHub badge.
          </p>
        </div>
      </Modal>
    </div>
  )
}

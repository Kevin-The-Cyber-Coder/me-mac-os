import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Bot,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Github,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Zap,
} from 'lucide-react'
import { Badge, Button, EmptyState, ErrorState, FilterPills, Skeleton } from '../components/ui'
import { api, apiError } from '../lib/api'
import { confirmDialog, toast } from '../lib/toast'
import { useNotifications } from '../store/notifications'
import { cn, timeAgo } from '../lib/utils'
import type { NotificationItem } from '../types'

interface ListResponse {
  items: NotificationItem[]
  total: number
  page: number
  pages: number
  limit: number
  unread: number
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  comment: MessageSquare,
  message: Mail,
  subscriber: UserPlus,
  feedback: MessageSquare,
  newsletter: Send,
  campaign: Send,
  github: Github,
  ai: Bot,
  security: ShieldCheck,
  system: Zap,
}

const FILTERS = ['all', 'unread'] as const

export default function NotificationsPage() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const setUnread = useNotifications((state) => state.setUnread)
  const liveItems = useNotifications((state) => state.items)
  const markStoreRead = useNotifications((state) => state.markRead)
  const markStoreAllRead = useNotifications((state) => state.markAllRead)
  const removeStoreItem = useNotifications((state) => state.remove)

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const { data: response } = await api.get('/admin/notifications', { params: { page, limit: 30 } })
        setData(response as ListResponse)
        setUnread(response.unread as number)
      } catch (err) {
        setError(apiError(err))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, setUnread]
  )

  useEffect(() => {
    load()
  }, [load])

  // Surface real-time notifications received over Socket.IO.
  useEffect(() => {
    if (!liveItems.length) return
    setData((prev) => {
      if (!prev) return prev
      const known = new Set(prev.items.map((item) => item.id))
      const fresh = liveItems.filter((item) => !known.has(item.id))
      if (!fresh.length) return prev
      return { ...prev, items: [...fresh, ...prev.items], total: prev.total + fresh.length }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveItems])

  const items = useMemo(() => {
    const rows = data?.items || []
    return filter === 'unread' ? rows.filter((item) => !item.read) : rows
  }, [data, filter])

  const unreadOnPage = (data?.items || []).filter((item) => !item.read).length

  const markRead = async (item: NotificationItem) => {
    if (item.read) return
    setBusyId(item.id)
    try {
      await api.patch(`/admin/notifications/${item.id}/read`)
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
              unread: Math.max(0, prev.unread - 1),
            }
          : prev
      )
      markStoreRead(item.id)
      setUnread(Math.max(0, (data?.unread || 0) - 1))
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const markAll = async () => {
    setMarkingAll(true)
    try {
      await api.patch('/admin/notifications/read-all')
      setData((prev) =>
        prev ? { ...prev, items: prev.items.map((row) => ({ ...row, read: true })), unread: 0 } : prev
      )
      markStoreAllRead()
      setUnread(0)
      toast('All notifications marked read')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  const remove = async (item: NotificationItem) => {
    const confirmed = await confirmDialog('Delete notification?', `"${item.title}" will be permanently removed.`, 'Delete')
    if (!confirmed) return
    setBusyId(item.id)
    try {
      await api.delete(`/admin/notifications/${item.id}`)
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((row) => row.id !== item.id),
              total: Math.max(0, prev.total - 1),
              unread: item.read ? prev.unread : Math.max(0, prev.unread - 1),
            }
          : prev
      )
      removeStoreItem(item.id)
      toast('Notification deleted')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pages = data?.pages || 1
  const unread = data?.unread || 0

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            Signals
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Notification center
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Contact messages, moderation queue, new subscribers and system events. New notifications arrive in real time
            over Socket.IO.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={unread ? 'warning' : 'success'}>
              {unread ? <Bell className="h-2.5 w-2.5" /> : <BellOff className="h-2.5 w-2.5" />}
              {unread ? `${unread} unread` : 'all caught up'}
            </Badge>
            <Badge tone="default">{data?.total || 0} total</Badge>
            <Badge tone="accent">
              <Sparkles className="h-2.5 w-2.5" /> live
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={() => load(true)}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            loading={markingAll}
            disabled={!unread}
            onClick={markAll}
            icon={<CheckCheck className="h-3.5 w-3.5" />}
          >
            Mark all read
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          options={FILTERS}
          value={filter}
          onChange={(value) => setFilter(value as (typeof FILTERS)[number])}
        />
        {filter === 'unread' && (
          <p className="text-[10px] text-[var(--fg-faint)]">
            {unreadOnPage} unread on this page · {unread} unread in total
          </p>
        )}
      </div>

      {loading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[64px]" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

      {!loading && !error && data && items.length === 0 && (
        <div className="glass rounded-2xl">
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'Everything has been read. Switch to “all” to review history.'
                : 'Contact messages, comments and system events will appear here.'
            }
            icon={filter === 'unread' ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          />
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] || Bell
            return (
              <div
                key={item.id}
                className={cn(
                  'glass flex flex-wrap items-start gap-3 rounded-2xl p-3.5 transition-opacity',
                  !item.read && 'border-l-2 border-l-[var(--accent)]',
                  busyId === item.id && 'opacity-60'
                )}
              >
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    item.read
                      ? 'bg-white/[0.05] text-muted'
                      : 'bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className={cn('text-[12px]', item.read ? 'text-[var(--fg-muted)]' : 'font-medium text-fg')}>
                      {item.title}
                    </p>
                    <Badge tone={item.read ? 'default' : 'accent'}>{item.read ? 'read' : 'new'}</Badge>
                    <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">
                      {item.type}
                    </span>
                  </div>
                  {item.message && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                      {item.message}
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-[var(--fg-faint)]">
                    <span>{timeAgo(item.createdAt)}</span>
                    {item.link && (
                      <Link to={item.link} className="text-[color-mix(in_srgb,var(--accent)_80%,white)] hover:underline">
                        open related
                      </Link>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {!item.read && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => markRead(item)}
                      icon={<Check className="h-3.5 w-3.5" />}
                    >
                      Mark read
                    </Button>
                  )}
                  <button
                    onClick={() => remove(item)}
                    disabled={busyId === item.id}
                    className="rounded-md border border-[var(--stroke)] p-1.5 text-muted transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                    aria-label={`Delete notification: ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data && pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--stroke)] pt-3">
          <p className="text-[10.5px] text-[var(--fg-faint)]">
            {data.total} notification{data.total === 1 ? '' : 's'} · page {data.page} of {pages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

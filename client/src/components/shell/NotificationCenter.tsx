import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, Cpu, Github, Sparkles, Trash2, X } from 'lucide-react'
import { useUI } from '../../store/ui'
import { useAuth } from '../../store/auth'
import { useNotifications } from '../../store/notifications'
import { api } from '../../lib/api'
import { timeAgo, cn } from '../../lib/utils'
import { EmptyState, Spinner } from '../ui'

interface DisplayItem {
  id: string
  title: string
  message: string
  tone: 'success' | 'info' | 'warning'
  createdAt: string
  link?: string
  read: boolean
  managed: boolean
}

export function NotificationCenter() {
  const open = useUI((s) => s.notificationsOpen)
  const toggle = useUI((s) => s.toggleNotifications)
  const token = useAuth((s) => s.token)
  const { items, unread, setItems, setUnread, markAllRead, remove, markRead } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [system, setSystem] = useState<DisplayItem[]>([])

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    if (token) {
      api
        .get('/admin/notifications', { params: { limit: 30 } })
        .then(({ data }) => {
          if (!alive) return
          setItems(data.items || [])
          setUnread(data.unread ?? 0)
        })
        .catch(() => undefined)
        .finally(() => alive && setLoading(false))
    } else {
      api
        .get('/health')
        .then(({ data }) => {
          if (!alive) return
          const integrations = data.integrations || {}
          setSystem([
            {
              id: 'api',
              title: 'ARENA API online',
              message: `Uptime ${data.uptime}s · database in ${data.database?.mode} mode.`,
              tone: 'success',
              createdAt: new Date().toISOString(),
              read: true,
              managed: false,
            },
            {
              id: 'ai',
              title: integrations.ai ? 'AI provider configured' : 'ARENA AI in knowledge mode',
              message: integrations.ai
                ? 'Streaming responses are served through the server-side proxy.'
                : 'No provider key is configured. Answers come from verified portfolio content.',
              tone: 'info',
              createdAt: new Date().toISOString(),
              read: true,
              managed: false,
            },
            {
              id: 'github',
              title: integrations.github ? 'GitHub API authenticated' : 'GitHub API unauthenticated',
              message: integrations.github
                ? 'Verified metrics are available in the command center.'
                : 'Unauthenticated requests are rate limited by GitHub.',
              tone: 'info',
              createdAt: new Date().toISOString(),
              read: true,
              managed: false,
            },
          ])
        })
        .catch(() => undefined)
        .finally(() => alive && setLoading(false))
    }
    return () => {
      alive = false
    }
  }, [open, token, setItems, setUnread])

  const display: DisplayItem[] = token
    ? items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        tone: (item.type === 'error' ? 'warning' : item.type === 'success' ? 'success' : 'info') as DisplayItem['tone'],
        createdAt: item.createdAt,
        link: item.link,
        read: item.read,
        managed: true,
      }))
    : system

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/30 backdrop-blur-[1px]"
            onClick={() => toggle(false)}
          />
          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="glass-strong fixed right-0 top-8 z-[115] flex h-[calc(100%-5.5rem)] w-full max-w-[360px] flex-col border-l border-[var(--stroke-strong)] shadow-2xl sm:rounded-l-2xl"
            role="dialog"
            aria-label="Notification center"
          >
            <div className="flex items-center justify-between border-b border-[var(--stroke)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" />
                <h2 className="font-display text-[13.5px] font-semibold text-fg">Notification Center</h2>
                {unread > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{unread}</span>
                )}
              </div>
              <button
                onClick={() => toggle(false)}
                className="rounded p-1 text-muted hover:bg-white/[0.06] hover:text-fg"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {token && display.length > 0 && (
              <div className="flex items-center justify-between border-b border-[var(--stroke)] px-3 py-1.5">
                <button
                  onClick={async () => {
                    try {
                      await api.patch('/admin/notifications/read-all')
                      markAllRead()
                    } catch {}
                  }}
                  className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10.5px] text-muted hover:text-fg"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
                <span className="font-mono text-[9.5px] text-[var(--fg-faint)]">{display.length} stored</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2">
              {loading && (
                <div className="flex justify-center py-10">
                  <Spinner label="Syncing" />
                </div>
              )}

              {!loading && display.length === 0 && (
                <EmptyState
                  icon={<BellOff className="h-5 w-5" />}
                  title="All clear"
                  description="New contact messages, comments, subscriptions and system events will appear here in real time."
                />
              )}

              {!loading &&
                display.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative mb-1.5 rounded-xl border px-3 py-2.5 transition-colors',
                      item.read ? 'border-transparent bg-transparent' : 'border-[var(--stroke)] bg-[var(--panel-soft)]'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg',
                          item.tone === 'success'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : item.tone === 'warning'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-cyan-500/15 text-cyan-300'
                        )}
                      >
                        {item.managed ? <Sparkles className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] font-semibold leading-snug text-fg">{item.title}</p>
                          <span className="shrink-0 text-[9.5px] text-[var(--fg-faint)]">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{item.message}</p>
                        {item.link && (
                          <Link
                            to={item.link}
                            onClick={() => {
                              toggle(false)
                              if (item.managed && !item.read) {
                                api.patch(`/admin/notifications/${item.id}/read`).catch(() => undefined)
                                markRead(item.id)
                              }
                            }}
                            className="mt-1.5 inline-block text-[10.5px] font-medium text-[color-mix(in_srgb,var(--accent)_85%,white)] hover:underline"
                          >
                            Open →
                          </Link>
                        )}
                      </div>
                    </div>
                    {item.managed && (
                      <button
                        onClick={async () => {
                          try {
                            await api.delete(`/admin/notifications/${item.id}`)
                          } catch {}
                          remove(item.id)
                        }}
                        className="absolute right-2 top-2 rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <div className="border-t border-[var(--stroke)] p-2.5">
              {token ? (
                <Link
                  to="/admin?module=notifications"
                  onClick={() => toggle(false)}
                  className="block w-full rounded-lg border border-[var(--stroke)] py-2 text-center text-[11.5px] text-fg transition-colors hover:bg-white/[0.05]"
                >
                  Manage notifications
                </Link>
              ) : (
                <p className="flex items-start gap-1.5 px-1 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">
                  <Github className="mt-0.5 h-3 w-3 shrink-0" /> Public visitors receive system status only. Sign in as an
                  administrator for real-time inbox events.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

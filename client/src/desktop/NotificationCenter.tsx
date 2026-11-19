import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Check, ChevronRight, Moon, Settings2, ShieldCheck, Wifi, WifiOff, X } from 'lucide-react'
import { useUI } from '../store/ui'
import { useDesktop } from '../store/desktop'
import { useNotifications } from '../store/notifications'
import { useAuth } from '../store/auth'
import { api } from '../lib/api'
import { useLaunch, useOpenPath } from './launch'
import { applyTheme, cn, timeAgo } from '../lib/utils'
import type { NotificationItem } from '../types'

export function NotificationCenter() {
  const open = useUI((state) => state.notificationsOpen)
  const toggle = useUI((state) => state.toggleNotifications)
  const toggleControlCenter = useUI((state) => state.toggleControlCenter)
  const theme = useUI((state) => state.theme)
  const setTheme = useUI((state) => state.setTheme)
  const accent = useUI((state) => state.accent)
  const reduceMotion = useUI((state) => state.reduceMotion)
  const { focusMode, setFocusMode, doNotDisturb, setDoNotDisturb } = useDesktop()
  const { items, unread, loading, setItems, setUnread, markAllRead, markRead, setLoading } = useNotifications()
  const token = useAuth((state) => state.token)
  const launch = useLaunch()
  const openPath = useOpenPath()
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    if (!open) return
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [open, setOnline])

  useEffect(() => {
    if (!open || !token) return
    let alive = true
    setLoading(true)
    api
      .get('/admin/notifications', { params: { limit: 24 } })
      .then(({ data }) => {
        if (!alive) return
        setItems((data.items || []) as NotificationItem[])
        setUnread(data.unread || 0)
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, token, setItems, setUnread, setLoading])

  const now = useMemo(() => new Date(), [open])
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const days = Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(monthStart)
    date.setDate(1 - monthStart.getDay() + index)
    return date
  })

  const markAll = () => {
    if (token) {
      api.patch('/admin/notifications/read-all').catch(() => undefined)
    }
    markAllRead()
  }

  const onItem = (item: NotificationItem) => {
    if (!item.read) {
      markRead(item.id)
      if (token) api.patch(`/admin/notifications/${item.id}/read`).catch(() => undefined)
    }
    if (item.link) {
      toggle(false)
      openPath(item.link)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[142] bg-black/20"
            onMouseDown={() => toggle(false)}
          />
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed bottom-2 right-2 top-[34px] z-[146] flex w-[min(344px,calc(100vw-1rem))] flex-col overflow-hidden rounded-[18px] border border-white/15 bg-[color-mix(in_srgb,var(--panel-strong)_86%,transparent)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
            role="dialog"
            aria-label="Notification Center"
          >
            <header className="flex items-center gap-2 border-b border-[var(--stroke)] px-3 py-2">
              <Bell className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              <p className="text-[12px] font-semibold text-fg">Notification Center</p>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-px font-mono text-[8.5px] font-bold text-white">
                  {unread}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAll}
                  disabled={unread === 0}
                  className="rounded px-1.5 py-0.5 text-[9.5px] text-[var(--fg-faint)] hover:bg-white/10 hover:text-fg disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="rounded p-1 text-[var(--fg-faint)] hover:bg-white/10 hover:text-fg"
                  aria-label="Close Notification Center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </header>

            <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="rounded-xl border border-[var(--stroke)] bg-white/[0.04] px-3 py-5 text-center">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-[var(--fg-faint)]">
                    <BellOff className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-[11.5px] font-medium text-fg">No notifications</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">
                    {token
                      ? 'Admin notifications appear here when the API records activity.'
                      : 'Sign in as an administrator to receive content, comment and AI notifications.'}
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItem(item)}
                    className={cn(
                      'flex w-full gap-2 rounded-xl border p-2.5 text-left transition-colors',
                      item.read
                        ? 'border-[var(--stroke)] bg-white/[0.03] hover:bg-white/[0.06]'
                        : 'border-[color-mix(in_srgb,var(--accent)_35%,var(--stroke))] bg-[var(--accent-soft)] hover:brightness-110'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                        item.read ? 'bg-white/[0.06] text-[var(--fg-faint)]' : 'bg-[var(--accent)] text-white'
                      )}
                    >
                      {item.read ? <Check className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-fg">{item.title}</span>
                      <span className="mt-0.5 block line-clamp-2 text-[10px] leading-relaxed text-muted">{item.message}</span>
                      <span className="mt-1 flex items-center gap-1.5 font-mono text-[8.5px] text-[var(--fg-faint)]">
                        {timeAgo(item.createdAt)}
                        {item.link && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              open <ChevronRight className="h-2.5 w-2.5" />
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                    {!item.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />}
                  </button>
                ))
              )}

              {loading && <p className="py-1 text-center text-[9.5px] text-[var(--fg-faint)]">Refreshing…</p>}

              <div className="rounded-xl border border-[var(--stroke)] bg-white/[0.04] p-2.5">
                <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Quick controls</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFocusMode(!focusMode)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px]',
                      focusMode ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.06] text-fg hover:bg-white/[0.1]'
                    )}
                    aria-pressed={focusMode}
                  >
                    <Moon className="h-3 w-3" /> Focus {focusMode ? 'on' : 'off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoNotDisturb(!doNotDisturb)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px]',
                      doNotDisturb ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.06] text-fg hover:bg-white/[0.1]'
                    )}
                    aria-pressed={doNotDisturb}
                  >
                    <BellOff className="h-3 w-3" /> DND {doNotDisturb ? 'on' : 'off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggle(false)
                      toggleControlCenter(true)
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1.5 text-left text-[10px] text-fg hover:bg-white/[0.1]"
                  >
                    {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} {online ? 'Online' : 'Offline'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = theme === 'dark' ? 'light' : 'dark'
                      setTheme(next)
                      applyTheme(next, accent, reduceMotion)
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1.5 text-left text-[10px] text-fg hover:bg-white/[0.1]"
                  >
                    <Moon className="h-3 w-3" /> {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--stroke)] bg-white/[0.04] p-2.5">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-[15px] font-semibold text-fg">
                    {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-mono text-[9px] text-[var(--fg-faint)]">
                    {now.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <span key={`${day}-${index}`} className="py-0.5 font-mono text-[8px] uppercase text-[var(--fg-faint)]">
                      {day}
                    </span>
                  ))}
                  {days.map((date) => {
                    const today = date.toDateString() === now.toDateString()
                    const muted = date.getMonth() !== now.getMonth()
                    return (
                      <span
                        key={date.toISOString()}
                        className={cn(
                          'grid h-6 place-items-center rounded-full text-[9.5px]',
                          muted ? 'text-[var(--fg-faint)]/40' : 'text-[var(--fg-muted)]',
                          today && 'bg-[var(--accent)] font-semibold text-white'
                        )}
                      >
                        {date.getDate()}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-[var(--stroke)] px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  toggle(false)
                  launch('settings', { section: 'notifications' })
                }}
                className="flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)] hover:text-fg"
              >
                <Settings2 className="h-2.5 w-2.5" /> Notification settings
              </button>
              <span className="flex items-center gap-1 font-mono text-[8px] text-[var(--fg-faint)]">
                <ShieldCheck className="h-2.5 w-2.5" /> {token ? 'admin' : 'visitor'}
              </span>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

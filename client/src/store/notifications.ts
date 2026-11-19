import { create } from 'zustand'
import type { NotificationItem } from '../types'

interface NotificationState {
  items: NotificationItem[]
  unread: number
  loading: boolean
  setItems: (items: NotificationItem[]) => void
  setUnread: (unread: number) => void
  add: (item: NotificationItem) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useNotifications = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  setItems: (items) => set({ items }),
  setUnread: (unread) => set({ unread }),
  add: (item) => set({ items: [item, ...get().items].slice(0, 100), unread: get().unread + 1 }),
  markRead: (id) =>
    set({
      items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, get().unread - 1),
    }),
  markAllRead: () => set({ items: get().items.map((n) => ({ ...n, read: true })), unread: 0 }),
  remove: (id) => set({ items: get().items.filter((n) => n.id !== id) }),
  setLoading: (loading) => set({ loading }),
}))

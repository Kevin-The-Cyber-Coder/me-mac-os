import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '../store/auth'
import { useNotifications } from '../store/notifications'
import { toast } from '../lib/toast'
import type { NotificationItem } from '../types'

const origin = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
  : window.location.origin

export function useSocket() {
  const token = useAuth((s) => s.token)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return
    const socket = io(origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on('notification:new', ({ notification, unread }: { notification: NotificationItem; unread: number }) => {
      useNotifications.getState().add(notification)
      useNotifications.getState().setUnread(unread)
      toast(notification.title, 'info')
    })
    socket.on('notification:count', ({ unread }: { unread: number }) => {
      useNotifications.getState().setUnread(unread)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  return socketRef
}

import { create } from 'zustand'
import { api, apiError } from '../lib/api'
import { session, SESSION_EVENT } from '../lib/session'
import type { AdminUser } from '../types'

interface AuthState {
  token: string | null
  admin: AdminUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  clear: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: session.token,
  admin: session.admin as AdminUser | null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      session.set(data.accessToken, data.admin)
      set({ token: data.accessToken, admin: data.admin, loading: false })
      return true
    } catch (error) {
      set({ loading: false, error: apiError(error) })
      return false
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    session.clear()
    set({ token: null, admin: null })
  },

  bootstrap: async () => {
    if (!session.token) {
      set({ token: null, admin: session.admin as AdminUser | null })
      return
    }
    set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ admin: data.admin, token: session.token, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  clear: () => {
    session.clear()
    set({ token: null, admin: null })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener(SESSION_EVENT, () => {
    useAuth.setState({ token: session.token, admin: session.admin as AdminUser | null })
  })
}

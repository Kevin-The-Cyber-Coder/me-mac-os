const TOKEN_KEY = 'kcp_access'
const ADMIN_KEY = 'kcp_admin'

export const SESSION_EVENT = 'kcp:session'

function emit() {
  window.dispatchEvent(new CustomEvent(SESSION_EVENT))
}

export const session = {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  get admin(): { id: string; name: string; email: string; role: string; avatar?: string } | null {
    try {
      const raw = localStorage.getItem(ADMIN_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(token: string, admin: unknown) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
    } catch {}
    emit()
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ADMIN_KEY)
    } catch {}
    emit()
  },
}

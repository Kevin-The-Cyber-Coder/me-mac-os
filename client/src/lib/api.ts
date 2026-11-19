import axios from 'axios'
import { session } from './session'

const root = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
export const API_BASE = `${root}/api`

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = session.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthRoute = String(original?.url || '').includes('/auth/')
    if (error.response?.status === 401 && original && !original.__retry && !isAuthRoute) {
      original.__retry = true
      refreshing =
        refreshing ||
        axios
          .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
          .then(({ data }) => {
            session.set(data.accessToken, data.admin)
            return data.accessToken as string
          })
          .catch(() => {
            session.clear()
            return null
          })
          .finally(() => {
            refreshing = null
          })
      const token = await refreshing
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

export function apiError(error: unknown): string {
  const err = error as { response?: { data?: { message?: string; details?: { message: string }[] } }; message?: string }
  const details = err?.response?.data?.details
  if (Array.isArray(details) && details.length) return details.map((d) => d.message).join(' · ')
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.'
}

export interface StreamEvent {
  type: 'meta' | 'delta' | 'notice' | 'done' | 'error'
  content?: string
  message?: string
  conversationId?: string
  messageId?: string
  source?: string
  tokens?: number
  mode?: string
  model?: string
}

export async function streamChat(
  payload: { message: string; conversationId?: string | null; visitorId: string; history?: { role: string; content: string }[] },
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok || !response.body) {
    let message = `ARENA AI request failed (${response.status})`
    try {
      const json = await response.json()
      message = json.message || message
    } catch {}
    throw new Error(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      try {
        onEvent(JSON.parse(line.slice(5).trim()) as StreamEvent)
      } catch {}
    }
  }
}

export const uploadFiles = async (files: File[]) => {
  const form = new FormData()
  files.forEach((file) => form.append('files', file))
  const { data } = await api.post('/admin/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.files as { url: string; provider: string; name: string }[]
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const ACCENTS: Record<string, string> = {
  violet: '#7c5cff',
  cyan: '#22d3ee',
  blue: '#3b82f6',
  emerald: '#34d399',
  rose: '#fb7185',
  amber: '#f59e0b',
}

export const WALLPAPERS = ['aurora', 'nebula', 'grid', 'sunset'] as const

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const value = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function applyTheme(theme: string, accent: string, reduceMotion: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  const color = ACCENTS[accent] || ACCENTS.violet
  root.style.setProperty('--accent', color)
  root.style.setProperty('--accent-soft', hexToRgba(color, 0.16))
  root.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#e9edf8' : '#05060c')
}

export const formatDate = (input?: string | Date, options?: Intl.DateTimeFormatOptions) => {
  if (!input) return '—'
  const date = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDateTime = (input?: string | Date) =>
  formatDate(input, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const timeAgo = (input?: string | Date) => {
  if (!input) return ''
  const date = typeof input === 'string' ? new Date(input) : input
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (Number.isNaN(seconds)) return ''
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(seconds) >= secondsInUnit) return rtf.format(-Math.round(seconds / secondsInUnit), unit)
  }
  return rtf.format(-seconds, 'second')
}

export const formatNumber = (value = 0) => new Intl.NumberFormat('en', { notation: value > 9999 ? 'compact' : 'standard' }).format(value)

export const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

export const getVisitorId = () => {
  const key = 'kcp_visitor'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `v-${Math.random().toString(36).slice(2)}-${Date.now()}`
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return `v-${Math.random().toString(36).slice(2)}`
  }
}

export const getSessionId = () => {
  const key = 'kcp_session'
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `s-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return `s-${Math.random().toString(36).slice(2)}`
  }
}

export const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

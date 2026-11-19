import { create } from 'zustand'
import { api } from '../lib/api'
import type { Profile, SiteSettings } from '../types'

interface PublicStats {
  projects: number
  posts: number
  skills: number
  gallery: number
  comments: number
}

interface SiteState {
  settings: SiteSettings | null
  profile: Profile | null
  stats: PublicStats | null
  loading: boolean
  loaded: boolean
  error: string | null
  load: (force?: boolean) => Promise<void>
}

let inFlight: Promise<void> | null = null

export const useSite = create<SiteState>((set, get) => ({
  settings: null,
  profile: null,
  stats: null,
  loading: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    if (!force && (get().loaded || inFlight)) return inFlight || undefined
    set({ loading: true, error: null })
    inFlight = (async () => {
      try {
        const [settings, profile, stats] = await Promise.all([
          api.get('/settings').then((r) => r.data.settings as SiteSettings),
          api.get('/profile').then((r) => r.data.profile as Profile),
          api.get('/stats/public').then((r) => r.data.stats as PublicStats),
        ])
        set({ settings, profile, stats, loaded: true, loading: false })
      } catch (error) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load site data',
        })
      } finally {
        inFlight = null
      }
    })()
    return inFlight
  },
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MusicTrack } from '../types'

type RepeatMode = 'off' | 'all' | 'one'

interface MusicState {
  tracks: MusicTrack[]
  index: number
  playing: boolean
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  favorites: string[]
  recentlyPlayed: string[]
  expanded: boolean
  elapsed: number
  duration: number
  seekRequest: number
  error: string | null
  setTracks: (tracks: MusicTrack[]) => void
  playIndex: (index: number) => void
  toggle: () => void
  pause: () => void
  next: () => void
  prev: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  toggleFavorite: (id: string) => void
  setExpanded: (expanded: boolean) => void
  setElapsed: (elapsed: number) => void
  setDuration: (duration: number) => void
  seekTo: (seconds: number) => void
  setError: (error: string | null) => void
}

export const useMusic = create<MusicState>()(
  persist(
    (set, get) => ({
      tracks: [],
      index: 0,
      playing: false,
      volume: 0.65,
      muted: false,
      shuffle: false,
      repeat: 'all',
      favorites: [],
      recentlyPlayed: [],
      expanded: false,
      elapsed: 0,
      duration: 0,
      seekRequest: 0,
      error: null,

      setTracks: (tracks) =>
        set((state) => ({
          tracks,
          index: Math.min(state.index, Math.max(0, tracks.length - 1)),
        })),

      playIndex: (index) => {
        const { tracks, recentlyPlayed } = get()
        if (!tracks.length) return
        const safe = ((index % tracks.length) + tracks.length) % tracks.length
        const track = tracks[safe]
        set({
          index: safe,
          playing: true,
          elapsed: 0,
          duration: track.duration || 0,
          error: null,
          recentlyPlayed: [track.id, ...recentlyPlayed.filter((id) => id !== track.id)].slice(0, 8),
        })
      },

      toggle: () => {
        if (!get().tracks.length) return
        set({ playing: !get().playing })
      },

      pause: () => set({ playing: false }),

      next: () => {
        const { index, tracks, shuffle, repeat } = get()
        if (!tracks.length) return
        if (repeat === 'one') {
          set({ playing: true })
          return
        }
        const nextIndex = shuffle ? Math.floor(Math.random() * tracks.length) : index + 1
        if (!shuffle && nextIndex >= tracks.length) {
          if (repeat === 'off') {
            set({ playing: false, index: 0 })
            return
          }
          get().playIndex(0)
          return
        }
        get().playIndex(nextIndex)
      },

      prev: () => {
        const { index, tracks, shuffle } = get()
        if (!tracks.length) return
        get().playIndex(shuffle ? Math.floor(Math.random() * tracks.length) : index - 1)
      },

      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)), muted: volume === 0 ? true : false }),
      toggleMute: () => set({ muted: !get().muted }),
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () =>
        set({ repeat: get().repeat === 'off' ? 'all' : get().repeat === 'all' ? 'one' : 'off' }),
      toggleFavorite: (id) =>
        set({
          favorites: get().favorites.includes(id)
            ? get().favorites.filter((f) => f !== id)
            : [...get().favorites, id],
        }),
      setExpanded: (expanded) => set({ expanded }),
      setElapsed: (elapsed) => set({ elapsed }),
      setDuration: (duration) => set({ duration }),
      seekTo: (seconds) => set({ elapsed: seconds, seekRequest: Date.now() }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'kcp-music',
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        favorites: state.favorites,
        recentlyPlayed: state.recentlyPlayed,
        index: state.index,
      }),
    }
  )
)

export const useCurrentTrack = () => useMusic((s) => s.tracks[s.index] ?? null)

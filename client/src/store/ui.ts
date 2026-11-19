import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'

interface UIState {
  theme: Theme
  accent: string
  wallpaper: string
  glass: number
  reduceMotion: boolean
  paletteOpen: boolean
  notificationsOpen: boolean
  controlCenterOpen: boolean
  assistantOpen: boolean
  gestureOpen: boolean
  musicOpen: boolean
  minimized: boolean
  theater: boolean
  searchOpen: boolean
  setTheme: (theme: Theme) => void
  setAccent: (accent: string) => void
  setWallpaper: (wallpaper: string) => void
  setGlass: (glass: number) => void
  setReduceMotion: (value: boolean) => void
  togglePalette: (open?: boolean) => void
  toggleNotifications: (open?: boolean) => void
  toggleControlCenter: (open?: boolean) => void
  toggleAssistant: (open?: boolean) => void
  toggleGestures: (open?: boolean) => void
  toggleMusic: (open?: boolean) => void
  setMinimized: (value: boolean) => void
  toggleTheater: () => void
  toggleSearch: (open?: boolean) => void
  closeOverlays: () => void
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      accent: 'violet',
      wallpaper: 'macos',
      glass: 0.7,
      reduceMotion: false,
      paletteOpen: false,
      notificationsOpen: false,
      controlCenterOpen: false,
      assistantOpen: false,
      gestureOpen: false,
      musicOpen: false,
      minimized: false,
      theater: false,
      searchOpen: false,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setGlass: (glass) => set({ glass }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      togglePalette: (open) => set({ paletteOpen: open ?? !get().paletteOpen, notificationsOpen: false, controlCenterOpen: false, searchOpen: false }),
      toggleNotifications: (open) => set({ notificationsOpen: open ?? !get().notificationsOpen, paletteOpen: false, controlCenterOpen: false }),
      toggleControlCenter: (open) => set({ controlCenterOpen: open ?? !get().controlCenterOpen, paletteOpen: false, notificationsOpen: false }),
      toggleAssistant: (open) => set({ assistantOpen: open ?? !get().assistantOpen }),
      toggleGestures: (open) => set({ gestureOpen: open ?? !get().gestureOpen }),
      toggleMusic: (open) => set({ musicOpen: open ?? !get().musicOpen }),
      setMinimized: (minimized) => set({ minimized }),
      toggleTheater: () => set({ theater: !get().theater }),
      toggleSearch: (open) => set({ searchOpen: open ?? !get().searchOpen }),
      closeOverlays: () => set({ paletteOpen: false, notificationsOpen: false, controlCenterOpen: false, searchOpen: false }),
    }),
    {
      name: 'kcp-ui',
      version: 1,
      migrate: (persistedState, version) => {
        const state = (persistedState || {}) as Partial<UIState>
        if (version < 1) {
          return {
            ...state,
            wallpaper: !state.wallpaper || state.wallpaper === 'rays' ? 'macos' : state.wallpaper,
          } as UIState
        }
        return state as UIState
      },
      partialize: (state) => ({
        theme: state.theme,
        accent: state.accent,
        wallpaper: state.wallpaper,
        glass: state.glass,
        reduceMotion: state.reduceMotion,
      }),
    }
  )
)

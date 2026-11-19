import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type IconSize = 'small' | 'medium' | 'large'

export interface IconPoint {
  x: number
  y: number
}

interface DesktopState {
  iconPositions: Record<string, IconPoint>
  hiddenIcons: string[]
  discardedIcons: string[]
  iconSize: IconSize
  autoArrange: boolean
  showIcons: boolean
  showWidgets: boolean
  dockSize: number
  dockMagnify: boolean
  dockAutohide: boolean
  focusMode: boolean
  brightness: number
  contrast: number
  analyticsOptOut: boolean
  notificationBanners: boolean
  notificationSounds: boolean
  doNotDisturb: boolean
  setIconPosition: (appId: string, point: IconPoint) => void
  clearIconPositions: () => void
  hideIcon: (appId: string) => void
  restoreIcon: (appId: string) => void
  restoreIcons: () => void
  emptyTrash: () => void
  arrangeIcons: () => void
  setIconSize: (size: IconSize) => void
  setAutoArrange: (value: boolean) => void
  setShowIcons: (value: boolean) => void
  setShowWidgets: (value: boolean) => void
  setDockSize: (value: number) => void
  setDockMagnify: (value: boolean) => void
  setDockAutohide: (value: boolean) => void
  setFocusMode: (value: boolean) => void
  setBrightness: (value: number) => void
  setContrast: (value: number) => void
  setAnalyticsOptOut: (value: boolean) => void
  setNotificationBanners: (value: boolean) => void
  setNotificationSounds: (value: boolean) => void
  setDoNotDisturb: (value: boolean) => void
}

export const useDesktop = create<DesktopState>()(
  persist(
    (set) => ({
      iconPositions: {},
      hiddenIcons: [],
      discardedIcons: [],
      iconSize: 'medium',
      autoArrange: true,
      showIcons: true,
      showWidgets: true,
      dockSize: 52,
      dockMagnify: true,
      dockAutohide: false,
      focusMode: false,
      brightness: 1,
      contrast: 1,
      analyticsOptOut: false,
      notificationBanners: true,
      notificationSounds: false,
      doNotDisturb: false,

      setIconPosition: (appId, point) =>
        set((state) => ({ iconPositions: { ...state.iconPositions, [appId]: point } })),

      clearIconPositions: () => set({ iconPositions: {} }),
      hideIcon: (appId) =>
        set((state) => ({ hiddenIcons: [...new Set([...state.hiddenIcons, appId])] })),
      restoreIcon: (appId) =>
        set((state) => ({ hiddenIcons: state.hiddenIcons.filter((id) => id !== appId) })),
      restoreIcons: () => set({ hiddenIcons: [], discardedIcons: [], iconPositions: {} }),
      emptyTrash: () =>
        set((state) => ({
          discardedIcons: [...new Set([...state.discardedIcons, ...state.hiddenIcons])],
          hiddenIcons: [],
        })),
      arrangeIcons: () => set({ iconPositions: {}, autoArrange: true }),
      setIconSize: (iconSize) => set({ iconSize }),
      setAutoArrange: (autoArrange) => set({ autoArrange }),
      setShowIcons: (showIcons) => set({ showIcons }),
      setShowWidgets: (showWidgets) => set({ showWidgets }),
      setDockSize: (dockSize) => set({ dockSize: Math.min(68, Math.max(40, dockSize)) }),
      setDockMagnify: (dockMagnify) => set({ dockMagnify }),
      setDockAutohide: (dockAutohide) => set({ dockAutohide }),
      setFocusMode: (focusMode) => set({ focusMode }),
      setBrightness: (brightness) => set({ brightness: Math.min(1.2, Math.max(0.35, brightness)) }),
      setContrast: (contrast) => set({ contrast: Math.min(1.3, Math.max(0.8, contrast)) }),
      setAnalyticsOptOut: (analyticsOptOut) => set({ analyticsOptOut }),
      setNotificationBanners: (notificationBanners) => set({ notificationBanners }),
      setNotificationSounds: (notificationSounds) => set({ notificationSounds }),
      setDoNotDisturb: (doNotDisturb) => set({ doNotDisturb }),
    }),
    { name: 'kcp-desktop' }
  )
)

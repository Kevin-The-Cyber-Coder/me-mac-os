import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createDebouncedStorage } from '../lib/debounced-storage'

export interface WindowRect {
  x: number
  y: number
  w: number
  h: number
}

export interface OSWindow {
  id: string
  appId: string
  title: string
  path: string
  params: Record<string, string>
  rect: WindowRect
  restoreRect: WindowRect | null
  z: number
  minimized: boolean
  maximized: boolean
}

export interface OpenWindowInput {
  id: string
  appId: string
  title: string
  path: string
  params?: Record<string, string>
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}

export const MENUBAR_HEIGHT = 30
export const DOCK_HEIGHT = 94

const MIN_WIDTH = 320
const MIN_HEIGHT = 220

function viewport() {
  if (typeof window === 'undefined') return { w: 1440, h: 900 }
  return { w: window.innerWidth, h: window.innerHeight }
}

function available(): WindowRect {
  const { w, h } = viewport()
  return {
    x: 12,
    y: MENUBAR_HEIGHT + 10,
    w: Math.max(320, w - 24),
    h: Math.max(240, h - MENUBAR_HEIGHT - DOCK_HEIGHT - 18),
  }
}

export function clampRect(rect: WindowRect, minWidth = MIN_WIDTH, minHeight = MIN_HEIGHT): WindowRect {
  const area = available()
  const w = Math.min(Math.max(rect.w, minWidth), area.w)
  const h = Math.min(Math.max(rect.h, minHeight), area.h)
  const x = Math.min(Math.max(rect.x, area.x), area.x + area.w - Math.min(w, 120))
  const y = Math.min(Math.max(rect.y, area.y), area.y + area.h - 44)
  return { x, y, w, h }
}

interface OSState {
  windows: OSWindow[]
  focusedId: string | null
  nextZ: number
  openWindow: (input: OpenWindowInput) => void
  closeWindow: (id: string) => void
  closeAll: () => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  toggleMinimize: (id: string) => void
  toggleMaximize: (id: string) => void
  setRect: (id: string, rect: WindowRect) => void
  /** Pages set the real content title once their data arrives. */
  setWindowTitle: (id: string, title: string) => void
  clampAll: () => void
  cycleWindows: (direction?: 1 | -1) => void
  minimizeAll: () => void
  showDesktop: () => void
  topWindow: () => OSWindow | null
  findWindow: (id: string) => OSWindow | null
}

const cascade = (index: number) => {
  const area = available()
  return {
    x: area.x + 26 + (index % 7) * 34,
    y: area.y + 18 + (index % 7) * 28,
  }
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      windows: [],
      focusedId: null,
      nextZ: 10,

      openWindow: (input) => {
        const existing = get().windows.find((win) => win.id === input.id)
        const z = get().nextZ + 1
        if (existing) {
          set((state) => ({
            windows: state.windows.map((win) =>
              win.id === input.id
                ? {
                    ...win,
                    title: input.title || win.title,
                    path: input.path || win.path,
                    params: input.params || win.params,
                    minimized: false,
                    z,
                  }
                : win
            ),
            focusedId: existing.id,
            nextZ: z,
          }))
          return
        }
        const area = available()
        const width = Math.min(input.width || 960, area.w)
        const height = Math.min(input.height || 660, area.h)
        const spot = cascade(get().windows.length)
        const rect = clampRect(
          {
            x: spot.x,
            y: spot.y,
            w: width,
            h: height,
          },
          input.minWidth || MIN_WIDTH,
          input.minHeight || MIN_HEIGHT
        )
        set((state) => ({
          windows: [
            ...state.windows,
            {
              id: input.id,
              appId: input.appId,
              title: input.title,
              path: input.path,
              params: input.params || {},
              rect,
              restoreRect: null,
              z,
              minimized: false,
              maximized: false,
            },
          ],
          focusedId: input.id,
          nextZ: z,
        }))
      },

      closeWindow: (id) => {
        const state = get()
        const remaining = state.windows.filter((win) => win.id !== id)
        const focused =
          state.focusedId === id
            ? [...remaining].sort((a, b) => b.z - a.z)[0]?.id || null
            : state.focusedId
        set({ windows: remaining, focusedId: focused })
      },

      closeAll: () => set({ windows: [], focusedId: null }),

      focusWindow: (id) => {
        if (get().focusedId === id && !get().windows.find((w) => w.id === id)?.minimized) return
        const z = get().nextZ + 1
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === id ? { ...win, z, minimized: false } : win
          ),
          focusedId: id,
          nextZ: z,
        }))
      },

      minimizeWindow: (id) => {
        const state = get()
        const remaining = state.windows.filter((win) => win.id !== id && !win.minimized)
        const focused =
          state.focusedId === id
            ? [...remaining].sort((a, b) => b.z - a.z)[0]?.id || null
            : state.focusedId
        set({
          windows: state.windows.map((win) => (win.id === id ? { ...win, minimized: true } : win)),
          focusedId: focused,
        })
      },

      restoreWindow: (id) => {
        get().focusWindow(id)
      },

      toggleMinimize: (id) => {
        const win = get().windows.find((item) => item.id === id)
        if (!win) return
        if (win.minimized) get().restoreWindow(id)
        else get().minimizeWindow(id)
      },

      toggleMaximize: (id) => {
        const area = available()
        set((state) => ({
          windows: state.windows.map((win) => {
            if (win.id !== id) return win
            if (win.maximized) {
              return {
                ...win,
                maximized: false,
                rect: clampRect(win.restoreRect || win.rect),
                restoreRect: null,
              }
            }
            return {
              ...win,
              maximized: true,
              restoreRect: win.rect,
              rect: area,
            }
          }),
        }))
      },

      setRect: (id, rect) => {
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === id
              ? {
                  ...win,
                  rect,
                  maximized: false,
                  restoreRect: null,
                }
              : win
          ),
        }))
      },

      setWindowTitle: (id, title) => {
        if (!title) return
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === id && win.title !== title ? { ...win, title } : win
          ),
        }))
      },

      clampAll: () => {
        const area = available()
        set((state) => ({
          windows: state.windows.map((win) => {
            if (win.maximized) return { ...win, rect: area }
            return { ...win, rect: clampRect(win.rect) }
          }),
        }))
      },

      cycleWindows: (direction = 1) => {
        const { windows, focusedId } = get()
        if (windows.length < 2) return
        const ordered = [...windows].sort((a, b) => b.z - a.z)
        const index = Math.max(0, ordered.findIndex((win) => win.id === focusedId))
        const next = ordered[(index + direction + ordered.length) % ordered.length]
        if (next) get().focusWindow(next.id)
      },

      minimizeAll: () => {
        set((state) => ({
          windows: state.windows.map((win) => ({ ...win, minimized: true })),
          focusedId: null,
        }))
      },

      showDesktop: () => {
        set((state) => ({
          windows: state.windows.map((win) => ({ ...win, minimized: true })),
          focusedId: null,
        }))
      },

      topWindow: () => {
        const { windows, focusedId } = get()
        return (
          windows.find((win) => win.id === focusedId) ||
          [...windows].sort((a, b) => b.z - a.z)[0] ||
          null
        )
      },

      findWindow: (id) => get().windows.find((win) => win.id === id) || null,
    }),
    {
      name: 'kcp-os',
      storage: createJSONStorage(() => createDebouncedStorage()),
      partialize: (state) => ({
        windows: state.windows.map((win) => ({ ...win, minimized: false })),
        focusedId: state.focusedId,
        nextZ: state.nextZ,
      }),
    }
  )
)

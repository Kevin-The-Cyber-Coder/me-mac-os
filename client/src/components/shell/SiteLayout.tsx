import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Wallpaper, CursorGlow } from '../effects'
import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { WindowFrame } from './WindowFrame'
import { CommandPalette } from './CommandPalette'
import { NotificationCenter } from './NotificationCenter'
import { ArenaAssistant } from '../assistant/ArenaAssistant'
import { MusicPlayer } from '../music/MusicPlayer'
import { GestureController } from '../gestures/GestureController'
import { useUI } from '../../store/ui'
import { useSite } from '../../store/site'
import { applyTheme } from '../../lib/utils'

export function SiteLayout() {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { theater, theme, accent, reduceMotion, togglePalette, closeOverlays } = useUI()
  const { load } = useSite()

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    applyTheme(theme, accent, reduceMotion)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const listener = () => applyTheme('system', accent, reduceMotion)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme, accent, reduceMotion])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        togglePalette()
      }
      if (event.key === 'Escape') closeOverlays()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePalette, closeOverlays])

  return (
    <div className="relative flex h-full flex-col">
      <a
        href="#window-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-10 focus:z-[200] focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content
      </a>
      <Wallpaper />
      <CursorGlow />
      <MenuBar />
      <main
        className={
          theater
            ? 'h-full pb-[86px] pt-8'
            : 'mx-auto h-full w-full max-w-[1500px] px-2 pb-[86px] pt-9 sm:px-4 sm:pt-10'
        }
      >
        <WindowFrame ref={scrollRef}>
          <Outlet />
        </WindowFrame>
      </main>
      <Dock />
      <CommandPalette />
      <NotificationCenter />
      <ArenaAssistant />
      <MusicPlayer />
      <GestureController />
    </div>
  )
}

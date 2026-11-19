import { useEffect, useState } from 'react'
import { ArrowUpRight, Bot, CalendarDays, Circle, MapPin, Music2, Pause, Play } from 'lucide-react'
import { useSite } from '../store/site'
import { useMusic, useCurrentTrack } from '../store/music'
import { useOS } from '../store/os'
import { useLaunch } from './launch'
import { useDesktop } from '../store/desktop'
import { cn } from '../lib/utils'

function uptimeLabel(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

export function DesktopWidgets() {
  const profile = useSite((state) => state.profile)
  const stats = useSite((state) => state.stats)
  const { playing, toggle } = useMusic()
  const track = useCurrentTrack()
  const windows = useOS((state) => state.windows)
  const showWidgets = useDesktop((state) => state.showWidgets)
  const launch = useLaunch()
  const [now, setNow] = useState(new Date())
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = window.setInterval(() => {
      setNow(new Date())
      setUptime(Math.floor((Date.now() - started) / 1000))
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!showWidgets) return null

  return (
    <div className="pointer-events-none absolute left-4 top-11 z-[3] hidden w-[264px] flex-col gap-2.5 lg:flex">
      <div className="pointer-events-auto rounded-[18px] border border-white/15 bg-black/25 p-4 text-white shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-[32px] font-semibold leading-none tracking-tight">
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="mt-1 text-[11px] text-white/70">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <CalendarDays className="h-4 w-4 text-white/45" />
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-[10px] text-white/55">
          <Circle className={cn('h-2 w-2', playing ? 'fill-emerald-400 text-emerald-400' : 'fill-white/30 text-white/30')} />
          ARENA OS · local {uptimeLabel(uptime)}
        </div>
      </div>

      <div className="pointer-events-auto rounded-[18px] border border-white/15 bg-black/25 p-3.5 text-white shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] font-display text-[11px] font-bold text-[#05060c]">
            MK
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold">{profile?.name || 'Mukeshimana Kevin'}</p>
            <p className="truncate text-[9.5px] text-white/55">Kevin The Cyber Coder</p>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-white/65">
          {profile?.tagline || "Building Tomorrow's Technology, One Innovation at a Time."}
        </p>
        <div className="mt-2 flex items-center gap-1 text-[9.5px] text-white/50">
          <MapPin className="h-2.5 w-2.5" /> {profile?.location || 'Remote · Worldwide'}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-2.5 text-center">
          {[
            { label: 'projects', value: stats?.projects ?? 0 },
            { label: 'articles', value: stats?.posts ?? 0 },
            { label: 'skills', value: stats?.skills ?? 0 },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-display text-[15px] font-semibold text-white">{item.value}</p>
              <p className="text-[8.5px] uppercase tracking-wide text-white/45">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => launch('about')}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 py-1.5 text-[9.5px] text-white hover:bg-white/15"
          >
            About <ArrowUpRight className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => launch('arena')}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--accent)] py-1.5 text-[9.5px] text-white hover:brightness-110"
          >
            <Bot className="h-2.5 w-2.5" /> ARENA
          </button>
        </div>
      </div>

      <div className="pointer-events-auto rounded-[18px] border border-white/15 bg-black/25 p-3 text-white shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
            <Music2 className={cn('h-3.5 w-3.5', playing && 'text-[var(--accent)]')} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10.5px] font-medium">{track?.title || 'ARENA Sound'}</p>
            <p className="truncate text-[9px] text-white/50">{track?.artist || 'Nothing playing'}</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
          </button>
        </div>
        <p className="mt-2 text-[8.5px] text-white/40">
          {windows.length} window{windows.length === 1 ? '' : 's'} open · playback is always manual
        </p>
      </div>
    </div>
  )
}

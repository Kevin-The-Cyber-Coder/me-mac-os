import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, Bot, Clock3, FolderKanban, Globe2, Mail } from 'lucide-react'
import { useSite } from '../../store/site'
import { cn } from '../../lib/utils'

export function DesktopWidgets({ className }: { className?: string }) {
  const { profile, stats } = useSite()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const offset = -now.getTimezoneOffset() / 60
  const tz = `UTC${offset >= 0 ? '+' : ''}${offset}`

  const availability = profile?.availability
  const tone =
    availability?.status === 'available'
      ? 'bg-emerald-400'
      : availability?.status === 'limited'
        ? 'bg-amber-400'
        : 'bg-rose-400'

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--fg-faint)]">
            <Clock3 className="h-3 w-3" /> Local time
          </span>
          <span className="font-mono text-[10px] text-[var(--fg-faint)]">{tz}</span>
        </div>
        <div className="mt-1.5 font-display text-[26px] font-semibold tabular-nums leading-none text-fg">{time}</div>
        <div className="mt-1 text-[11px] text-muted">{date}</div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--fg-faint)]">
            <Activity className="h-3 w-3" /> Status
          </span>
          <span className="relative flex h-2 w-2">
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', tone)} />
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', tone)} />
          </span>
        </div>
        <p className="mt-2 text-[12.5px] font-medium leading-snug text-fg">
          {availability?.label || 'Available for select projects'}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
          <Globe2 className="h-3 w-3" /> {profile?.location || 'Remote · Worldwide'}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--fg-faint)]">Published</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { label: 'Projects', value: stats?.projects ?? 0, icon: FolderKanban },
            { label: 'Articles', value: stats?.posts ?? 0, icon: Bot },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-2.5 py-2">
              <item.icon className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--accent)_75%,white)]" />
              <div className="mt-1 font-display text-lg font-semibold leading-none text-fg">{item.value}</div>
              <div className="mt-0.5 text-[9.5px] uppercase tracking-wide text-[var(--fg-faint)]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/arena-ai"
          className="glass card-hover flex flex-col gap-1.5 rounded-2xl p-3.5"
        >
          <Bot className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" />
          <span className="text-[12px] font-medium text-fg">Ask ARENA</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted">
            Streaming AI <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        </Link>
        <Link to="/contact" className="glass card-hover flex flex-col gap-1.5 rounded-2xl p-3.5">
          <Mail className="h-4 w-4 text-cyan-300" />
          <span className="text-[12px] font-medium text-fg">Start a project</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted">
            Get in touch <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        </Link>
      </div>
    </div>
  )
}

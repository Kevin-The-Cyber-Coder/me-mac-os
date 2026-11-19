import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Compass, Home, Search, SquareTerminal } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { Button, GlassCard } from '../components/ui'
import { useUI } from '../store/ui'

const LINKS = [
  { label: 'Home', to: '/', icon: Home, hint: 'Start over' },
  { label: 'Projects', to: '/projects', icon: Compass, hint: 'Case studies' },
  { label: 'Terminal', to: '/terminal', icon: SquareTerminal, hint: 'Run a command' },
]

export default function NotFound() {
  const location = useLocation()
  const togglePalette = useUI((state) => state.togglePalette)

  return (
    <>
      <Seo title="Page not found" description="This route does not exist in the portfolio." noIndex />
      <div className="flex min-h-[62vh] flex-col items-center justify-center py-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--accent)_80%,white)]">
          error · 404
        </p>
        <h1 className="mt-3 font-display text-[clamp(4rem,14vw,8rem)] font-bold leading-none tracking-tight">
          <span className="text-gradient">404</span>
        </h1>
        <h2 className="mt-3 font-display text-xl font-semibold text-fg">This window does not exist</h2>
        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">
          The route <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-fg">{location.pathname}</code>{' '}
          is not part of the portfolio. It may have been renamed, archived, or never existed.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link to="/">
            <Button icon={<ArrowLeft className="h-4 w-4" />}>Back to home</Button>
          </Link>
          <Button variant="secondary" onClick={() => togglePalette(true)} icon={<Search className="h-4 w-4" />}>
            Search the site
          </Button>
        </div>

        <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <GlassCard hover className="flex items-center gap-2.5 p-3 text-left">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                  <link.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-fg">{link.label}</span>
                  <span className="block truncate text-[10px] text-[var(--fg-faint)]">{link.hint}</span>
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
          Ctrl K · command palette · ↑↓ navigate
        </p>
      </div>
    </>
  )
}

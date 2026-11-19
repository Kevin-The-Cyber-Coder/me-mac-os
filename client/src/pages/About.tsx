import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Download,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Sparkles,
  Target,
  Telescope,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { Reveal } from '../components/effects'
import { Badge, Button, ErrorState, PageHeader, Skeleton } from '../components/ui'
import { useSite } from '../store/site'
import { cn } from '../lib/utils'

export default function About() {
  const { profile, loading, error } = useSite()

  if (loading && !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return <ErrorState message={error} onRetry={() => useSite.getState().load(true)} />
  }

  if (!profile) return null

  const paragraphs = profile.bio.split('\n').filter(Boolean)

  return (
    <>
      <Seo title="About" description={profile.shortBio} />
      <PageHeader
        eyebrow="About"
        title={
          <>
            Mukeshimana Kevin — <span className="text-gradient">the person behind the shell</span>
          </>
        }
        description={profile.title}
        actions={
          <>
            <a href={profile.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf'} download>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
                Download résumé
              </Button>
            </a>
            <Link to="/contact">
              <Button icon={<Mail className="h-4 w-4" />}>Get in touch</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={profile.availability?.status === 'available' ? 'success' : 'warning'}>
              {profile.availability?.label || 'Available'}
            </Badge>
            <Badge tone="default">
              <MapPin className="h-2.5 w-2.5" /> {profile.location}
            </Badge>
            <Badge tone="accent">{profile.displayName}</Badge>
          </div>

          <h2 className="mt-4 font-display text-xl font-semibold leading-snug text-fg">{profile.tagline}</h2>

          <div className="mt-3 space-y-3">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-[13px] leading-[1.85] text-[var(--fg-muted)]">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                <Target className="h-3 w-3" /> Mission
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{profile.mission}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                <Telescope className="h-3 w-3" /> Vision
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{profile.vision}</p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-2.5 font-display text-[14px] font-semibold text-fg">Values I build by</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.values.map((value, index) => (
                <div key={value.title} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h4 className="text-[12px] font-medium text-fg">{value.title}</h4>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="aspect-square bg-[var(--panel-soft)]">
              <img src={profile.avatar || '/avatar.svg'} alt={`${profile.name} avatar`} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-display text-[14px] font-semibold text-fg">{profile.name}</p>
              <p className="text-[11px] text-muted">{profile.title}</p>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-muted hover:text-fg">
                  <Mail className="h-3 w-3" /> {profile.email}
                </a>
                <p className="flex items-center gap-2 text-muted">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {profile.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target={social.url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2 py-1.5 text-[10px] text-muted transition-colors hover:text-fg"
                  >
                    {social.label}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
              <Heart className="h-3 w-3" /> Interests
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full border border-[var(--stroke)] px-2 py-0.5 text-[10px] text-muted">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
              <Sparkles className="h-3 w-3" /> What's next
            </div>
            <ul className="mt-2 space-y-1.5">
              {profile.futureGoals.map((goal) => (
                <li key={goal} className="flex gap-1.5 text-[11px] leading-relaxed text-muted">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {/* ── Timeline ───────────────────────────────────────── */}
      <Reveal className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-fg">Timeline</h2>
        <div className="relative ml-1 border-l border-[var(--stroke)] pl-5">
          {profile.timeline.map((item, index) => (
            <div key={`${item.year}-${item.title}`} className="relative pb-5 last:pb-0">
              <span
                className={cn(
                  'absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)]',
                  index === profile.timeline.length - 1 ? 'bg-[var(--accent)]' : 'bg-[var(--fg-faint)]'
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-[color-mix(in_srgb,var(--accent)_80%,white)]">{item.year}</span>
                <h3 className="text-[12.5px] font-medium text-fg">{item.title}</h3>
                {item.type && <Badge tone="default" className="text-[8.5px]">{item.type}</Badge>}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Experience & education ────────────────────────── */}
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-semibold text-fg">
            <Briefcase className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" /> Experience
          </h2>
          <div className="space-y-2.5">
            {profile.experience.map((role) => (
              <article key={`${role.company}-${role.role}`} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[12.5px] font-semibold text-fg">{role.role}</h3>
                    <p className="text-[11px] text-[var(--fg-muted)]">{role.company}</p>
                  </div>
                  <Badge tone={role.current ? 'success' : 'default'}>
                    {role.start} — {role.current ? 'Present' : role.end}
                  </Badge>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{role.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.technologies.map((tech) => (
                    <span key={tech} className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-faint)]">
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-semibold text-fg">
            <GraduationCap className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" /> Education & practice
          </h2>
          <div className="space-y-2.5">
            {profile.education.map((entry) => (
              <article key={entry.institution} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[12.5px] font-semibold text-fg">{entry.degree}</h3>
                    <p className="text-[11px] text-[var(--fg-muted)]">{entry.institution}</p>
                  </div>
                  <Badge tone="default">
                    {entry.start} — {entry.end}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--fg-faint)]">{entry.field}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{entry.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-5">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-fg">Want the short version?</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Ask ARENA AI about my work, or read the case studies directly.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects">
            <Button variant="secondary">Browse projects</Button>
          </Link>
          <Link to="/arena-ai">
            <Button icon={<Sparkles className="h-3.5 w-3.5" />}>Ask ARENA AI</Button>
          </Link>
        </div>
      </div>
    </>
  )
}

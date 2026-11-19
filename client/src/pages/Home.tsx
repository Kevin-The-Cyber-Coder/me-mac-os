import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Download,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  Twitter,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { PostCard, ProjectCard, ServiceCard, TestimonialCard } from '../components/site/cards'
import { DesktopWidgets } from '../components/shell/DesktopWidgets'
import { NewsletterForm } from '../components/site/NewsletterForm'
import { Reveal, TypingText, GridBackdrop } from '../components/effects'
import { Badge, Button, SectionTitle, Skeleton } from '../components/ui'
import { useSite } from '../store/site'
import { useList } from '../hooks/useContent'
import { useUI } from '../store/ui'
import { formatNumber } from '../lib/utils'
import type { BlogPost, Project, Service, Testimonial } from '../types'

const ROLES = [
  'Full-Stack Developer',
  'Software Engineer',
  'Technology Innovator',
  'Problem Solver',
]

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Github,
  Linkedin,
  Twitter,
  Mail,
}

export default function Home() {
  const { profile, stats, loading } = useSite()
  const toggleAssistant = useUI((s) => s.toggleAssistant)
  const { items: projects, loading: projectsLoading } = useList<Project>('/projects', { featured: 'true', limit: 3 })
  const { items: services } = useList<Service>('/services', { limit: 4 })
  const { items: posts } = useList<BlogPost>('/blog', { limit: 3 })
  const { items: testimonials } = useList<Testimonial>('/testimonials', { limit: 3 })

  const socials = profile?.socials || []

  return (
    <>
      <Seo />
      <div className="relative">
        <GridBackdrop className="-top-24 h-[520px] opacity-70" />

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative grid items-start gap-7 lg:grid-cols-[1.5fr_0.9fr]" aria-labelledby="hero-title">
          <div className="pt-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-2"
            >
              <Badge tone="success" className="gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {profile?.availability?.label || 'Available for select projects'}
              </Badge>
              <Badge tone="default">
                <MapPin className="h-2.5 w-2.5" /> {profile?.location || 'Remote · Worldwide'}
              </Badge>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="mt-5 font-mono text-[11px] uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--accent)_80%,white)]"
            >
              Mukeshimana Kevin
            </motion.p>

            <motion.h1
              id="hero-title"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-2 font-display text-[clamp(2.2rem,6vw,4.1rem)] font-bold leading-[1.03] tracking-tight text-fg"
            >
              Kevin The
              <br />
              <span className="text-gradient">Cyber Coder</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
              className="mt-3 flex min-h-[26px] items-center gap-2 font-mono text-[13px] text-[var(--fg-muted)] sm:text-[15px]"
            >
              <span className="text-[var(--accent)]">&gt;</span>
              <TypingText words={ROLES} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]"
            >
              {profile?.shortBio ||
                'Full-stack developer and technology innovator crafting modern digital experiences, intelligent applications and scalable systems.'}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36 }}
              className="mt-2 font-display text-[13px] italic text-[color-mix(in_srgb,var(--accent)_70%,var(--fg))]"
            >
              “{profile?.tagline || "Building Tomorrow's Technology, One Innovation at a Time."}”
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="mt-6 flex flex-wrap items-center gap-2.5"
            >
              <Link to="/projects">
                <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Explore the work
                </Button>
              </Link>
              <Button size="lg" variant="secondary" onClick={() => toggleAssistant(true)} icon={<Bot className="h-4 w-4" />}>
                Ask ARENA AI
              </Button>
              <a href={profile?.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf'} download>
                <Button size="lg" variant="ghost" icon={<Download className="h-4 w-4" />}>
                  Résumé
                </Button>
              </a>
            </motion.div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon || ''] || ArrowUpRight
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target={social.url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg"
                  >
                    <Icon className="h-3 w-3" />
                    {social.label}
                  </a>
                )
              })}
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {(profile?.stats || [
                { label: 'Projects shipped', value: '18', suffix: '+' },
                { label: 'Technologies', value: '30', suffix: '+' },
                { label: 'Articles', value: '6', suffix: '' },
                { label: 'Published skills', value: String(stats?.skills ?? '—'), suffix: '' },
              ]).map((stat) => (
                <div key={stat.label} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5">
                  <div className="font-display text-lg font-semibold leading-none text-fg">
                    {stat.value}
                    <span className="text-[var(--accent)]">{stat.suffix}</span>
                  </div>
                  <div className="mt-1 text-[9.5px] uppercase leading-tight tracking-wide text-[var(--fg-faint)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <DesktopWidgets />
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--accent)_85%,white)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">ARENA AI</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                A streaming assistant grounded in this portfolio. Ask it which projects use React, what services exist, or how a
                system was built — it answers from published records, not guesses.
              </p>
              <button
                onClick={() => toggleAssistant(true)}
                className="mt-2.5 flex w-full items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-2 text-[11px] font-medium text-fg transition-colors hover:border-[var(--stroke-strong)]"
              >
                Open assistant
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Featured work ────────────────────────────────── */}
        <Reveal className="mt-12">
          <SectionTitle
            title="Selected work"
            subtitle="Systems built end to end — interface, API, data model and operations."
            action={
              <Link to="/projects" className="flex items-center gap-1 text-[11.5px] text-muted hover:text-fg">
                All projects <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectsLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[330px]" />)}
            {!projectsLoading && projects.length === 0 && (
              <div className="glass col-span-full rounded-2xl p-8 text-center text-[12.5px] text-muted">
                Projects are being published from the admin command center.
              </div>
            )}
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </Reveal>

        {/* ── Services ─────────────────────────────────────── */}
        <Reveal className="mt-12">
          <SectionTitle
            title="How I can help"
            subtitle="From a focused audit to a complete product build."
            action={
              <Link to="/services" className="flex items-center gap-1 text-[11.5px] text-muted hover:text-fg">
                All services <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </Reveal>

        {/* ── Writing ──────────────────────────────────────── */}
        <Reveal className="mt-12">
          <SectionTitle
            title="From the journal"
            subtitle="Engineering notes, architecture decisions and honest retrospectives."
            action={
              <Link to="/blog" className="flex items-center gap-1 text-[11.5px] text-muted hover:text-fg">
                All articles <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Reveal>

        {/* ── Testimonials ─────────────────────────────────── */}
        {testimonials.length > 0 && (
          <Reveal className="mt-12">
            <SectionTitle title="What collaborators say" subtitle="Placeholder testimonials seeded with the site — replace them in the admin panel." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </Reveal>
        )}

        {/* ── Newsletter + contact ─────────────────────────── */}
        <Reveal className="mt-12 mb-2 grid gap-3 lg:grid-cols-2">
          <div className="glass gradient-border rounded-2xl p-5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--fg-faint)]">Newsletter</span>
            <h2 className="mt-1.5 font-display text-lg font-semibold text-fg">Build notes, occasionally.</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              New projects, engineering write-ups and things worth sharing. No noise, no spam, unsubscribe anytime.
            </p>
            <div className="mt-3">
              <NewsletterForm source="home" />
            </div>
            <p className="mt-2 font-mono text-[9px] text-[var(--fg-faint)]">
              {formatNumber(stats?.projects ?? 0)} projects · {formatNumber(stats?.posts ?? 0)} articles published
            </p>
          </div>

          <div className="glass relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/15 blur-2xl" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--fg-faint)]">Collaboration</span>
            <h2 className="mt-1.5 font-display text-lg font-semibold text-fg">Have a system to build?</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Tell me the constraint you're stuck on. I reply to serious inquiries with a clear next step — not a sales deck.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/contact">
                <Button icon={<Mail className="h-3.5 w-3.5" />}>Start a conversation</Button>
              </Link>
              <Link to="/github">
                <Button variant="secondary" icon={<Github className="h-3.5 w-3.5" />}>
                  GitHub Command Center
                </Button>
              </Link>
            </div>
            {loading && <p className="mt-2 text-[10px] text-[var(--fg-faint)]">Loading profile…</p>}
          </div>
        </Reveal>
      </div>
    </>
  )
}

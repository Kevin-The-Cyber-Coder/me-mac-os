import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Eye,
  Github,
  Heart,
  Layers,
  Lightbulb,
  Target,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { CommentSection } from '../components/site/CommentSection'
import { ProjectCard } from '../components/site/cards'
import { Badge, Button, ErrorState, Progress, Skeleton } from '../components/ui'
import { api, apiError } from '../lib/api'
import { formatDate, formatNumber } from '../lib/utils'
import { toast } from '../lib/toast'
import { useWindowParam } from '../desktop/window-context'
import { useOS } from '../store/os'
import type { Project } from '../types'

export default function ProjectDetail({ windowId }: { windowId?: string }) {
  const slug = useWindowParam('slug')
  const setWindowTitle = useOS((state) => state.setWindowTitle)
  const [project, setProject] = useState<Project | null>(null)
  const [related, setRelated] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    api
      .get(`/projects/${slug}`)
      .then(({ data }) => {
        if (!alive) return
        setProject(data.project)
        setRelated(data.related || [])
      })
      .catch((err) => alive && setError(apiError(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  // The URL slug only gives a readable guess; use the real title once loaded.
  useEffect(() => {
    if (windowId && project?.title) setWindowTitle(windowId, project.title)
  }, [windowId, project?.title, setWindowTitle])

  const appreciate = async () => {
    if (!project || liked) return
    try {
      const { data } = await api.post('/appreciate', { type: 'project', id: project.id })
      setLiked(true)
      setProject({ ...project, likes: data.likes })
      toast('Appreciation recorded')
    } catch {
      toast('Could not record that right now', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="py-10">
        <ErrorState message={error || 'Project not found'} onRetry={() => window.location.reload()} />
        <div className="mt-4 text-center">
          <Link to="/projects">
            <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back to projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo title={project.title} description={project.summary} image={project.coverImage} type="article" />

      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-fg">
        <ArrowLeft className="h-3 w-3" /> All projects
      </Link>

      <header className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{project.category}</Badge>
            <Badge tone={project.stage === 'completed' ? 'success' : project.stage === 'in-progress' ? 'warning' : 'info'} className="capitalize">
              {project.stage.replace('-', ' ')}
            </Badge>
            {project.featured && <Badge tone="warning">Featured</Badge>}
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,4vw,2.6rem)] font-semibold leading-tight text-fg">{project.title}</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">{project.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10.5px] text-[var(--fg-faint)]">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {formatNumber(project.views)} views
            </span>
            <button onClick={appreciate} className="flex items-center gap-1 transition-colors hover:text-rose-300">
              <Heart className={`h-3 w-3 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} /> {formatNumber(project.likes)} appreciations
            </button>
            {project.completedAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {formatDate(project.completedAt, { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <Button icon={<ArrowUpRight className="h-3.5 w-3.5" />}>View live</Button>
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" icon={<Github className="h-3.5 w-3.5" />}>
                  Source
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-[var(--panel-soft)]">
          {project.coverImage ? (
            <img src={project.coverImage} alt={`${project.title} cover`} className="aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="grid aspect-[16/10] place-items-center text-muted">
              <Layers className="h-8 w-8" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-px bg-[var(--stroke)]">
            <div className="bg-[var(--panel)] px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">Stack size</p>
              <p className="mt-0.5 font-display text-[15px] font-semibold text-fg">{project.technologies.length}</p>
            </div>
            <div className="bg-[var(--panel)] px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">Features</p>
              <p className="mt-0.5 font-display text-[15px] font-semibold text-fg">{project.features.length}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0">
          <section>
            <h2 className="font-display text-[15px] font-semibold text-fg">Overview</h2>
            <p className="mt-2 text-[13px] leading-[1.85] text-[var(--fg-muted)]">{project.description}</p>
          </section>

          {(project.problem || project.solution) && (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {project.problem && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    <Target className="h-3 w-3" /> The constraint
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-amber-100/70">{project.problem}</p>
                </div>
              )}
              {project.solution && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    <Lightbulb className="h-3 w-3" /> The approach
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-emerald-100/70">{project.solution}</p>
                </div>
              )}
            </div>
          )}

          {project.features.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-[15px] font-semibold text-fg">What it does</h2>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-2.5 py-2 text-[11.5px] leading-relaxed text-muted">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {project.process.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-[15px] font-semibold text-fg">How it was built</h2>
              <div className="mt-2 space-y-2">
                {project.process.map((step, index) => (
                  <div key={step.title} className="flex gap-3 rounded-xl border border-[var(--stroke)] p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-[12px] font-medium text-fg">{step.title}</h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {project.gallery.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-[15px] font-semibold text-fg">Screens</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {project.gallery.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setLightbox(image)}
                    className="overflow-hidden rounded-xl border border-[var(--stroke)]"
                    aria-label={`Open screenshot ${index + 1}`}
                  >
                    <img src={image} alt={`${project.title} screenshot ${index + 1}`} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <CommentSection targetType="project" targetId={project.slug} targetTitle={project.title} />
        </div>

        <aside className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Technology</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.technologies.map((tech) => (
                <span key={tech} className="rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-2 py-1 font-mono text-[10px] text-[var(--fg-muted)]">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Delivery</h2>
            <div className="mt-2 space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] text-muted">
                  <span>Stage</span>
                  <span className="capitalize text-fg">{project.stage.replace('-', ' ')}</span>
                </div>
                <Progress
                  value={project.stage === 'completed' ? 100 : project.stage === 'in-progress' ? 62 : 18}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Started</span>
                <span className="text-fg">{formatDate(project.startedAt)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Completed</span>
                <span className="text-fg">{project.completedAt ? formatDate(project.completedAt) : 'In progress'}</span>
              </div>
            </div>
          </div>

          {project.tags.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Tags</h2>
              <div className="mt-2 flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-[var(--fg-faint)]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-fg">Related work</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} compact />
            ))}
          </div>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
        >
          <img src={lightbox} alt="Project screenshot" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </>
  )
}

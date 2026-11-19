import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Eye,
  Github,
  Heart,
  Layers,
  Star,
  Quote,
} from 'lucide-react'
import { Badge } from '../ui'
import { cn, formatDate, formatNumber, initials } from '../../lib/utils'
import type { BlogPost, GalleryItem, Project, Service, Skill, Testimonial } from '../../types'

const stageTone = {
  completed: 'success',
  'in-progress': 'warning',
  concept: 'info',
} as const

export function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="glass card-hover group flex h-full flex-col overflow-hidden rounded-2xl focus-visible:outline-none"
    >
      <div className={cn('relative overflow-hidden bg-[var(--panel-soft)]', compact ? 'aspect-[16/9]' : 'aspect-[16/10]')}>
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={`${project.title} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <Layers className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060c] via-transparent to-transparent opacity-80" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <Badge tone="accent">{project.category}</Badge>
          {project.featured && <Badge tone="warning">Featured</Badge>}
        </div>
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 text-[10px] text-white/75">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {formatNumber(project.views || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {formatNumber(project.likes || 0)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-fg transition-colors group-hover:text-[color-mix(in_srgb,var(--accent)_80%,white)]">
            {project.title}
          </h3>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{project.summary}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-[var(--stroke)] bg-[var(--panel-soft)] px-1.5 py-0.5 font-mono text-[9.5px] text-[var(--fg-muted)]"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="px-1 py-0.5 font-mono text-[9.5px] text-[var(--fg-faint)]">+{project.technologies.length - 4}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--stroke)] pt-2.5 text-[10px] text-[var(--fg-faint)]">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {project.completedAt ? formatDate(project.completedAt, { month: 'short', year: 'numeric' }) : 'In progress'}
          </span>
          <Badge tone={stageTone[project.stage] || 'default'} className="capitalize">
            {project.stage.replace('-', ' ')}
          </Badge>
        </div>
      </div>
    </Link>
  )
}

export function PostCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={cn(
        'glass card-hover group flex h-full overflow-hidden rounded-2xl',
        featured ? 'flex-col sm:flex-row' : 'flex-col'
      )}
    >
      <div className={cn('relative shrink-0 overflow-hidden bg-[var(--panel-soft)]', featured ? 'aspect-[16/9] sm:aspect-auto sm:w-2/5' : 'aspect-[16/9]')}>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={`${post.title} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <Layers className="h-7 w-7" />
          </div>
        )}
        <Badge tone="accent" className="absolute left-2.5 top-2.5">
          {post.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[10px] text-[var(--fg-faint)]">
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.readingTime || 1} min read
          </span>
        </div>
        <h3 className={cn('mt-1.5 font-display font-semibold leading-snug text-fg', featured ? 'text-lg' : 'text-[14.5px]')}>
          {post.title}
        </h3>
        <p className={cn('mt-1.5 text-[12.5px] leading-relaxed text-muted', featured ? 'line-clamp-3' : 'line-clamp-2')}>{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-[var(--fg-faint)]">
                #{tag}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-[10px] text-[var(--fg-faint)]">
            <Eye className="h-3 w-3" /> {formatNumber(post.views || 0)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ServiceCard({ service, onSelect }: { service: Service; onSelect?: (service: Service) => void }) {
  return (
    <article className="glass card-hover flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--stroke)] bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
          <Layers className="h-5 w-5" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--fg-faint)]">service</span>
      </div>
      <h3 className="mt-3.5 font-display text-[15px] font-semibold text-fg">{service.title}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{service.description}</p>
      <ul className="mt-3 space-y-1">
        {service.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-[11.5px] text-[var(--fg-muted)]">
            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1">
        {service.technologies.slice(0, 4).map((tech) => (
          <span key={tech} className="rounded-md border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-faint)]">
            {tech}
          </span>
        ))}
      </div>
      <button
        onClick={() => onSelect?.(service)}
        className="mt-auto flex items-center justify-between border-t border-[var(--stroke)] pt-3 text-left text-[11.5px] font-medium text-fg transition-colors hover:text-[color-mix(in_srgb,var(--accent)_85%,white)]"
      >
        {service.cta || 'Discuss this service'}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </article>
  )
}

const levelPercent = { expert: 92, advanced: 78, intermediate: 58, learning: 32 }

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="glass card-hover rounded-xl p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-fg">{skill.name}</span>
        <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--fg-faint)]">{skill.level}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700',
            skill.learning ? 'bg-amber-400/80' : 'bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)]'
          )}
          style={{ width: `${levelPercent[skill.level] || 50}%` }}
        />
      </div>
      <p className="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">{skill.description}</p>
    </div>
  )
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="glass flex h-full flex-col rounded-2xl p-5">
      <Quote className="h-5 w-5 text-[color-mix(in_srgb,var(--accent)_60%,transparent)]" />
      <blockquote className="mt-2.5 flex-1 text-[12.5px] leading-relaxed text-[var(--fg-muted)]">“{testimonial.quote}”</blockquote>
      <div className="mt-3 flex items-center gap-2.5 border-t border-[var(--stroke)] pt-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
          {testimonial.avatar ? (
            <img src={testimonial.avatar} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initials(testimonial.name)
          )}
        </span>
        <div className="min-w-0">
          <figcaption className="truncate text-[11.5px] font-medium text-fg">{testimonial.name}</figcaption>
          <p className="truncate text-[10px] text-[var(--fg-faint)]">
            {testimonial.role}
            {testimonial.company ? ` · ${testimonial.company}` : ''}
          </p>
        </div>
        <span className="ml-auto flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn('h-2.5 w-2.5', index < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-white/15')}
            />
          ))}
        </span>
      </div>
    </figure>
  )
}

export function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] text-left focus-visible:outline-none"
      aria-label={`Open ${item.title}`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={item.thumbnail || item.url}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-[12px] font-medium text-white">{item.title}</p>
        <p className="text-[9.5px] uppercase tracking-wider text-white/55">{item.category}</p>
      </div>
    </button>
  )
}

export function GithubRepoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-fg"
    >
      <Github className="h-3.5 w-3.5" />
      {children}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  )
}

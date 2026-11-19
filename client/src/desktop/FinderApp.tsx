import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Folder,
  FolderKanban,
  Grid2X2,
  Home,
  Images,
  Layers,
  List,
  Mail,
  Music2,
  Play,
  Search,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useList } from '../hooks/useContent'
import { useSite } from '../store/site'
import { useLaunch } from './launch'
import { cn, formatDate, formatNumber, formatTime } from '../lib/utils'
import type { BlogPost, GalleryItem, MusicTrack, Project, Service, Skill } from '../types'

type FolderId = 'home' | 'projects' | 'blog' | 'skills' | 'services' | 'gallery' | 'music'
type ViewMode = 'grid' | 'list'
type SortKey = 'name' | 'newest' | 'views'

const FOLDER_LABEL: Record<FolderId, string> = {
  home: 'Home',
  projects: 'Projects',
  blog: 'Journal',
  skills: 'Skills',
  services: 'Services',
  gallery: 'Gallery',
  music: 'Music',
}

const FAVORITES: { id: FolderId; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'projects', icon: FolderKanban },
  { id: 'blog', icon: FileText },
  { id: 'gallery', icon: Images },
]

const PORTFOLIO_FOLDERS: { id: FolderId; icon: typeof Home }[] = [
  { id: 'skills', icon: Layers },
  { id: 'services', icon: Briefcase },
  { id: 'music', icon: Music2 },
]

function Cover({
  src,
  alt,
  className,
  icon: Icon,
}: {
  src?: string
  alt: string
  className?: string
  icon: typeof Folder
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-[image:linear-gradient(135deg,color-mix(in_srgb,var(--accent)_45%,#0b1020),rgba(34,211,238,0.35))] text-white/70',
          className
        )}
        aria-label={alt}
      >
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}

function SidebarRow({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active?: boolean
  icon: typeof Home
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2 rounded-[6px] px-2 py-[5px] text-left text-[11.5px] transition-colors',
        active ? 'bg-white/[0.12] font-medium text-fg' : 'text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-fg'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-[var(--accent)]' : 'opacity-70')} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && count > 0 && (
        <span className="font-mono text-[9px] text-[var(--fg-faint)]">{count}</span>
      )}
    </button>
  )
}

function EmptyFolder({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="grid flex-1 place-items-center px-6 py-14 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-[var(--fg-faint)]">
          <Folder className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <p className="mt-3 text-[13px] font-medium text-fg">{label}</p>
        <p className="mx-auto mt-1 max-w-[280px] text-[11.5px] leading-relaxed text-muted">{hint}</p>
      </div>
    </div>
  )
}

function ProjectTile({ project }: { project: Project }) {
  const launch = useLaunch()
  return (
    <button
      type="button"
      onDoubleClick={() => launch('project', { slug: project.slug })}
      onClick={(event) => {
        if (event.detail === 0) launch('project', { slug: project.slug })
      }}
      className="group overflow-hidden rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] text-left transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--stroke))] hover:bg-white/[0.06]"
      title={`${project.title} — double click to open`}
    >
      <Cover src={project.coverImage} alt={project.title} icon={FolderKanban} className="h-[106px] w-full" />
      <div className="p-2.5">
        <p className="truncate text-[11.5px] font-medium text-fg">{project.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[var(--fg-faint)]">
          {project.category || 'Project'} · {project.stage || 'published'}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(project.technologies || []).slice(0, 2).map((tech) => (
            <span
              key={tech}
              className="rounded border border-[var(--stroke)] px-1 py-px font-mono text-[8px] uppercase tracking-wide text-[var(--fg-faint)]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

function FinderHome({
  onOpenFolder,
}: {
  onOpenFolder: (folder: FolderId) => void
}) {
  const { profile, stats } = useSite()
  const launch = useLaunch()
  const { items: projects } = useList<Project>('/projects', { limit: 100 })
  const { items: posts } = useList<BlogPost>('/blog', { limit: 100 })

  const featured = useMemo(
    () => [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3),
    [projects]
  )
  const recentPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
        .slice(0, 3),
    [posts]
  )

  const folders: { id: FolderId; label: string; icon: typeof Folder; count: number }[] = [
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: stats?.projects ?? projects.length },
    { id: 'blog', label: 'Journal', icon: FileText, count: stats?.posts ?? posts.length },
    { id: 'skills', label: 'Skills', icon: Layers, count: stats?.skills ?? 0 },
    { id: 'gallery', label: 'Gallery', icon: Images, count: stats?.gallery ?? 0 },
    { id: 'services', label: 'Services', icon: Briefcase, count: 0 },
    { id: 'music', label: 'Music', icon: Music2, count: 0 },
  ]

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 py-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-5 sm:flex-row sm:items-center">
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] font-display text-[19px] font-bold text-[#05060c]">
            MK
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[22px] font-semibold leading-tight text-fg">
              {profile?.name || 'Mukeshimana Kevin'}
            </h1>
            {profile?.availability?.status && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-px text-[9px] text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {profile.availability.label}
              </span>
            )}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color-mix(in_srgb,var(--accent)_80%,white)]">
            {profile?.displayName || 'Kevin The Cyber Coder'}
          </p>
          <p className="mt-1.5 max-w-[560px] text-[11.5px] leading-relaxed text-muted">
            {profile?.tagline || 'Full-stack engineer building AI products, platforms and interfaces that hold up in production.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => launch('about')}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-2.5 py-1 text-[10.5px] font-medium text-white hover:brightness-110"
            >
              <UserRound className="h-3 w-3" /> About me
            </button>
            <button
              type="button"
              onClick={() => launch('contact')}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--stroke)] bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-fg hover:bg-white/[0.08]"
            >
              <Mail className="h-3 w-3" /> Contact
            </button>
            {profile?.resumeUrl && (
              <a
                href={profile.resumeUrl}
                download
                className="inline-flex items-center gap-1 rounded-md border border-[var(--stroke)] bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-fg hover:bg-white/[0.08]"
              >
                <Download className="h-3 w-3" /> Résumé
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Projects', value: stats?.projects ?? projects.length },
          { label: 'Articles', value: stats?.posts ?? posts.length },
          { label: 'Skills', value: stats?.skills ?? 0 },
          { label: 'Gallery', value: stats?.gallery ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5">
            <p className="font-display text-[19px] font-semibold leading-none text-fg">{formatNumber(item.value)}</p>
            <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-[12px] font-semibold text-fg">Portfolio folders</h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">double click to open</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onOpenFolder(folder.id)}
              onDoubleClick={() => onOpenFolder(folder.id)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:border-[var(--stroke)] hover:bg-white/[0.05]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[image:linear-gradient(145deg,rgba(124,92,255,0.45),rgba(34,211,238,0.25))] text-white ring-1 ring-white/15">
                <folder.icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span className="text-[10.5px] font-medium text-fg">{folder.label}</span>
              <span className="font-mono text-[8.5px] text-[var(--fg-faint)]">
                {folder.count ? `${folder.count} items` : 'open'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[12px] font-semibold text-fg">Featured work</h2>
            <button
              type="button"
              onClick={() => onOpenFolder('projects')}
              className="flex items-center gap-0.5 text-[10px] text-[var(--fg-faint)] hover:text-fg"
            >
              Open folder <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {featured.map((project) => (
              <ProjectTile key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {recentPosts.length > 0 && (
        <section className="mt-5 pb-2">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[12px] font-semibold text-fg">From the journal</h2>
            <button
              type="button"
              onClick={() => onOpenFolder('blog')}
              className="flex items-center gap-0.5 text-[10px] text-[var(--fg-faint)] hover:text-fg"
            >
              All articles <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)]">
            {recentPosts.map((post) => (
              <PostListRow key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PostListRow({ post }: { post: BlogPost }) {
  const launch = useLaunch()
  return (
    <button
      type="button"
      onDoubleClick={() => launch('post', { slug: post.slug })}
      onClick={(event) => {
        if (event.detail === 0) launch('post', { slug: post.slug })
      }}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
      title={`${post.title} — double click to open`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
        <FileText className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-medium text-fg">{post.title}</span>
        <span className="block truncate text-[10px] text-[var(--fg-faint)]">
          {post.category || 'Journal'} · {formatDate(post.publishedAt || post.createdAt)}
          {post.readingTime ? ` · ${post.readingTime} min read` : ''}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-[var(--fg-faint)]">
        <Eye className="h-3 w-3" /> {formatNumber(post.views || 0)}
      </span>
    </button>
  )
}

export default function FinderApp() {
  const { profile, stats } = useSite()
  const launch = useLaunch()
  const [folder, setFolder] = useState<FolderId>('home')
  const [history, setHistory] = useState<FolderId[]>(['home'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [view, setView] = useState<ViewMode>('grid')
  const [sort, setSort] = useState<SortKey>('newest')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  const projects = useList<Project>('/projects', { limit: 100 })
  const posts = useList<BlogPost>('/blog', { limit: 100 })
  const skills = useList<Skill>('/skills', { limit: 100 })
  const services = useList<Service>('/services', { limit: 100 })
  const gallery = useList<GalleryItem>('/gallery', { limit: 100 })
  const music = useList<MusicTrack>('/music', { limit: 100 })

  const go = (next: FolderId) => {
    setFolder(next)
    setQuery('')
    setSelected(null)
    setHistory((items) => {
      const trimmed = items.slice(0, historyIndex + 1)
      const appended = trimmed[trimmed.length - 1] === next ? trimmed : [...trimmed, next]
      setHistoryIndex(appended.length - 1)
      return appended
    })
  }

  const back = () => {
    if (historyIndex <= 0) return
    const index = historyIndex - 1
    setHistoryIndex(index)
    setFolder(history[index])
    setQuery('')
    setSelected(null)
  }

  const forward = () => {
    if (historyIndex >= history.length - 1) return
    const index = historyIndex + 1
    setHistoryIndex(index)
    setFolder(history[index])
    setQuery('')
    setSelected(null)
  }

  const q = query.trim().toLowerCase()
  const matches = (values: (string | undefined)[]) =>
    !q || values.filter(Boolean).join(' ').toLowerCase().includes(q)

  const sortList = <T,>(items: T[], get: (item: T) => { name: string; date?: string; views?: number }) =>
    [...items].sort((a, b) => {
      const left = get(a)
      const right = get(b)
      if (sort === 'name') return left.name.localeCompare(right.name)
      if (sort === 'views') return (right.views || 0) - (left.views || 0)
      return new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime()
    })

  const filteredProjects = useMemo(
    () =>
      sortList(
        projects.items.filter((item) => matches([item.title, item.summary, item.category, ...(item.technologies || [])])),
        (item) => ({
          name: item.title,
          date: item.completedAt || item.createdAt,
          views: item.views,
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects.items, q, sort]
  )

  const filteredPosts = useMemo(
    () =>
      sortList(
        posts.items.filter((item) => matches([item.title, item.excerpt, item.category, ...(item.tags || [])])),
        (item) => ({ name: item.title, date: item.publishedAt || item.createdAt, views: item.views })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts.items, q, sort]
  )

  const filteredSkills = useMemo(
    () =>
      sortList(
        skills.items.filter((item) => matches([item.name, item.category, item.description])),
        (item) => ({ name: item.name })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skills.items, q, sort]
  )

  const filteredServices = useMemo(
    () =>
      sortList(
        services.items.filter((item) => matches([item.title, item.description, ...(item.technologies || [])])),
        (item) => ({ name: item.title })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services.items, q, sort]
  )

  const filteredGallery = useMemo(
    () =>
      sortList(
        gallery.items.filter((item) => matches([item.title, item.description, item.category, ...(item.tags || [])])),
        (item) => ({ name: item.title })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gallery.items, q, sort]
  )

  const filteredMusic = useMemo(
    () =>
      sortList(
        music.items.filter((item) => matches([item.title, item.artist, item.album, item.genre])),
        (item) => ({ name: item.title })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [music.items, q, sort]
  )

  const loading =
    projects.loading || posts.loading || skills.loading || services.loading || gallery.loading || music.loading
  const error =
    projects.error || posts.error || skills.error || services.error || gallery.error || music.error

  const counts: Record<FolderId, number> = {
    home: 0,
    projects: projects.items.length,
    blog: posts.items.length,
    skills: skills.items.length,
    services: services.items.length,
    gallery: gallery.items.length,
    music: music.items.length,
  }

  const currentCount =
    folder === 'projects'
      ? filteredProjects.length
      : folder === 'blog'
        ? filteredPosts.length
        : folder === 'skills'
          ? filteredSkills.length
          : folder === 'services'
            ? filteredServices.length
            : folder === 'gallery'
              ? filteredGallery.length
              : folder === 'music'
                ? filteredMusic.length
                : 0

  const selectedLabel = selected || 'Nothing selected'

  return (
    <div className="flex h-full min-h-0 text-fg">
      <aside className="flex w-[188px] shrink-0 flex-col border-r border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel-soft)_70%,black)] max-sm:hidden">
        <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2.5">
          <p className="px-2 pb-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
            Favorites
          </p>
          {FAVORITES.map((item) => (
            <SidebarRow
              key={item.id}
              active={folder === item.id}
              icon={item.icon}
              label={FOLDER_LABEL[item.id]}
              count={counts[item.id]}
              onClick={() => go(item.id)}
            />
          ))}

          <p className="px-2 pb-1 pt-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
            Portfolio
          </p>
          {PORTFOLIO_FOLDERS.map((item) => (
            <SidebarRow
              key={item.id}
              active={folder === item.id}
              icon={item.icon}
              label={FOLDER_LABEL[item.id]}
              count={counts[item.id]}
              onClick={() => go(item.id)}
            />
          ))}

          <p className="px-2 pb-1 pt-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
            Locations
          </p>
          <SidebarRow icon={UserRound} label="Desktop" onClick={() => launch('welcome')} />
          <SidebarRow icon={Star} label="GitHub" onClick={() => launch('github')} />
          <SidebarRow icon={Mail} label="Contact" onClick={() => launch('contact')} />
          <SidebarRow icon={Trash2} label="Trash" onClick={() => launch('trash')} />
        </div>

        <div className="border-t border-[var(--stroke)] px-2.5 py-2">
          <p className="truncate text-[10.5px] font-medium text-fg">{profile?.name || 'Mukeshimana Kevin'}</p>
          <p className="truncate text-[9px] text-[var(--fg-faint)]">{profile?.location || 'Remote · Worldwide'}</p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-faint)]">
            {stats ? `${stats.projects} projects · ${stats.posts} articles` : 'ARENA OS'}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[42px] shrink-0 items-center gap-1.5 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-2.5">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={back}
              disabled={historyIndex <= 0}
              className="grid h-6 w-6 place-items-center rounded text-[var(--fg-muted)] hover:bg-white/[0.08] hover:text-fg disabled:opacity-30"
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={forward}
              disabled={historyIndex >= history.length - 1}
              className="grid h-6 w-6 place-items-center rounded text-[var(--fg-muted)] hover:bg-white/[0.08] hover:text-fg disabled:opacity-30"
              aria-label="Forward"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex min-w-0 items-center gap-1 px-1 text-[11px]">
            <button
              type="button"
              onClick={() => go('home')}
              className="shrink-0 text-[var(--fg-faint)] hover:text-fg"
            >
              Kevin
            </button>
            {folder !== 'home' && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-[var(--fg-faint)]" />
                <span className="truncate font-medium text-fg">{FOLDER_LABEL[folder]}</span>
              </>
            )}
            {folder !== 'home' && q && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-[var(--fg-faint)]" />
                <span className="truncate text-[var(--fg-faint)]">“{query}”</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--fg-faint)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                aria-label="Search this folder"
                className="h-6 w-[130px] rounded-md border border-[var(--stroke)] bg-white/[0.05] pl-6 pr-5 text-[11px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--stroke))] sm:w-[160px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--fg-faint)] hover:text-fg"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort items"
              className="h-6 rounded-md border border-[var(--stroke)] bg-[var(--panel-strong)] px-1 text-[10px] text-[var(--fg-muted)] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="views">Most viewed</option>
            </select>

            <div className="flex overflow-hidden rounded-md border border-[var(--stroke)]">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'grid h-6 w-6 place-items-center',
                  view === 'grid' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-faint)] hover:bg-white/[0.08]'
                )}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
              >
                <Grid2X2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'grid h-6 w-6 place-items-center',
                  view === 'list' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-faint)] hover:bg-white/[0.08]'
                )}
                aria-label="List view"
                aria-pressed={view === 'list'}
              >
                <List className="h-3 w-3" />
              </button>
            </div>

            {folder !== 'home' && (
              <button
                type="button"
                onClick={() => launch(folder)}
                className="hidden items-center gap-1 rounded-md border border-[var(--stroke)] px-1.5 py-1 text-[10px] text-[var(--fg-muted)] hover:bg-white/[0.08] hover:text-fg sm:flex"
                title={`Open ${FOLDER_LABEL[folder]} app`}
              >
                <ArrowUpRight className="h-3 w-3" /> Open
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {folder === 'home' ? (
            <FinderHome onOpenFolder={go} />
          ) : loading ? (
            <div className="grid h-full min-h-[180px] place-items-center text-[11.5px] text-muted">Reading folder…</div>
          ) : error ? (
            <EmptyFolder label="Could not read this folder" hint={error} />
          ) : (
            <div className="px-3 py-3">
              {folder === 'projects' &&
                (filteredProjects.length === 0 ? (
                  <EmptyFolder label="No projects match" hint="Clear the search or open another folder." />
                ) : view === 'grid' ? (
                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(184px,1fr))]">
                    {filteredProjects.map((project) => (
                      <ProjectTile key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--stroke)]">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-2 border-b border-[var(--stroke)] bg-white/[0.04] px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)]">
                      <span>Name</span>
                      <span>Category</span>
                      <span>Stack</span>
                      <span className="text-right">Views</span>
                    </div>
                    {filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onDoubleClick={() => launch('project', { slug: project.slug })}
                        onClick={(event) => {
                          setSelected(project.title)
                          if (event.detail === 0) launch('project', { slug: project.slug })
                        }}
                        className={cn(
                          'grid w-full grid-cols-[1.5fr_1fr_1fr_80px] items-center gap-2 border-b border-[var(--stroke)] px-3 py-1.5 text-left text-[10.5px] last:border-0 hover:bg-white/[0.05]',
                          selected === project.title && 'bg-[var(--accent-soft)]'
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <FolderKanban className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                          <span className="truncate font-medium text-fg">{project.title}</span>
                        </span>
                        <span className="truncate text-[var(--fg-faint)]">{project.category || '—'}</span>
                        <span className="truncate text-[var(--fg-faint)]">
                          {(project.technologies || []).slice(0, 3).join(', ') || '—'}
                        </span>
                        <span className="text-right font-mono text-[9.5px] text-[var(--fg-faint)]">
                          {formatNumber(project.views || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}

              {folder === 'blog' &&
                (filteredPosts.length === 0 ? (
                  <EmptyFolder label="No articles match" hint="Try another search term." />
                ) : view === 'grid' ? (
                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
                    {filteredPosts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onDoubleClick={() => launch('post', { slug: post.slug })}
                        onClick={(event) => {
                          setSelected(post.title)
                          if (event.detail === 0) launch('post', { slug: post.slug })
                        }}
                        className="overflow-hidden rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] text-left hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--stroke))] hover:bg-white/[0.06]"
                        title={`${post.title} — double click to open`}
                      >
                        <Cover src={post.coverImage} alt={post.title} icon={FileText} className="h-[94px] w-full" />
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-fg">{post.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 font-mono text-[8.5px] text-[var(--fg-faint)]">
                            <Clock3 className="h-2.5 w-2.5" /> {formatDate(post.publishedAt || post.createdAt)}
                            {post.readingTime ? ` · ${post.readingTime}m` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--stroke)]">
                    {filteredPosts.map((post) => (
                      <PostListRow key={post.id} post={post} />
                    ))}
                  </div>
                ))}

              {folder === 'skills' && (
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                  {filteredSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                          <Layers className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-medium text-fg">{skill.name}</p>
                          <p className="truncate text-[9.5px] text-[var(--fg-faint)]">{skill.category}</p>
                        </div>
                        <span className="rounded border border-[var(--stroke)] px-1 py-px font-mono text-[8px] uppercase text-[var(--fg-faint)]">
                          {skill.level}
                        </span>
                      </div>
                      {skill.description && (
                        <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{skill.description}</p>
                      )}
                    </div>
                  ))}
                  {filteredSkills.length === 0 && (
                    <EmptyFolder label="No skills match" hint="Try a different technology or category." />
                  )}
                </div>
              )}

              {folder === 'services' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold text-fg">{service.title}</p>
                        <Briefcase className="h-3.5 w-3.5 text-[var(--fg-faint)]" />
                      </div>
                      <p className="mt-1 line-clamp-3 text-[10.5px] leading-relaxed text-muted">{service.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(service.technologies || []).slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="rounded border border-[var(--stroke)] px-1 py-px font-mono text-[8px] text-[var(--fg-faint)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <EmptyFolder label="No services match" hint="Try another keyword." />
                  )}
                </div>
              )}

              {folder === 'gallery' && (
                <>
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(148px,1fr))]">
                    {filteredGallery.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelected(item.title)
                          if (item.type === 'image') setLightbox(item)
                          else window.open(item.url, '_blank', 'noopener,noreferrer')
                        }}
                        className="group relative overflow-hidden rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] text-left hover:border-[color-mix(in_srgb,var(--accent)_50%,var(--stroke))]"
                        title={item.type === 'image' ? `Preview ${item.title}` : `Open ${item.title}`}
                      >
                        <Cover
                          src={item.thumbnail || item.url}
                          alt={item.title}
                          icon={Images}
                          className="aspect-[4/3] w-full"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4">
                          <p className="truncate text-[10px] font-medium text-white">{item.title}</p>
                          <p className="truncate text-[8.5px] text-white/60">{item.category || 'Gallery'}</p>
                        </div>
                        {item.type === 'video' && (
                          <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                            <Play className="h-3 w-3 fill-current" />
                          </span>
                        )}
                      </button>
                    ))}
                    {filteredGallery.length === 0 && (
                      <EmptyFolder label="No images match" hint="Try a different tag or title." />
                    )}
                  </div>
                  {lightbox && (
                    <div
                      className="absolute inset-0 z-[40] grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
                      onClick={() => setLightbox(null)}
                      role="dialog"
                      aria-label={lightbox.title}
                    >
                      <div
                        className="max-h-full w-full max-w-[720px] overflow-hidden rounded-xl border border-white/15 bg-[#0a0e18]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium text-white">{lightbox.title}</p>
                            <p className="truncate text-[9.5px] text-white/50">
                              {lightbox.category || 'Gallery'} · {lightbox.type}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLightbox(null)}
                            className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                            aria-label="Close preview"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <img
                          src={lightbox.url}
                          alt={lightbox.title}
                          className="max-h-[62vh] w-full bg-black object-contain"
                        />
                        {lightbox.description && (
                          <p className="px-3 py-2 text-[11px] leading-relaxed text-white/65">{lightbox.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {folder === 'music' && (
                <div className="overflow-hidden rounded-lg border border-[var(--stroke)]">
                  <div className="flex items-center justify-between border-b border-[var(--stroke)] bg-white/[0.04] px-3 py-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                      ARENA Sound library
                    </p>
                    <button
                      type="button"
                      onClick={() => launch('music')}
                      className="flex items-center gap-1 rounded border border-[var(--stroke)] px-1.5 py-0.5 text-[9.5px] text-[var(--fg-muted)] hover:bg-white/[0.08] hover:text-fg"
                    >
                      <Music2 className="h-2.5 w-2.5" /> Open Music
                    </button>
                  </div>
                  {filteredMusic.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onDoubleClick={() => launch('music')}
                      onClick={(event) => {
                        setSelected(track.title)
                        if (event.detail === 0) launch('music')
                      }}
                      className="flex w-full items-center gap-2.5 border-b border-[var(--stroke)] px-3 py-2 text-left last:border-0 hover:bg-white/[0.05]"
                    >
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[var(--accent-soft)]">
                        <Cover src={track.cover} alt={track.title} icon={Music2} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-fg">{track.title}</span>
                        <span className="block truncate text-[9.5px] text-[var(--fg-faint)]">
                          {track.artist || 'ARENA Sound'} · {track.album || track.genre || 'Single'}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-[var(--fg-faint)]">
                        {track.synth?.enabled || !track.src ? '∞' : formatTime(track.duration || 0)}
                      </span>
                    </button>
                  ))}
                  {filteredMusic.length === 0 && (
                    <EmptyFolder label="No tracks match" hint="Try another artist or genre." />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex h-[25px] shrink-0 items-center justify-between border-t border-[var(--stroke)] bg-[var(--panel-soft)] px-2.5 font-mono text-[8.5px] text-[var(--fg-faint)]">
          <span>{folder === 'home' ? `${counts.projects + counts.blog + counts.skills + counts.services + counts.gallery} items in portfolio` : `${currentCount} items`}</span>
          <span className="truncate px-3">{selectedLabel}</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ARENA OS · local session
          </span>
        </div>
      </div>
    </div>
  )
}

export type { FolderId }

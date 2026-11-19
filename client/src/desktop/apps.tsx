import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Briefcase,
  Compass,
  FileText,
  FolderKanban,
  FolderOpen,
  Github,
  Images,
  Keyboard,
  Layers,
  Mail,
  Music2,
  Orbit,
  PenLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Trash2,
  UserRound,
} from 'lucide-react'

export type AppId =
  | 'finder'
  | 'welcome'
  | 'about'
  | 'projects'
  | 'project'
  | 'skills'
  | 'services'
  | 'blog'
  | 'post'
  | 'gallery'
  | 'contact'
  | 'arena'
  | 'github'
  | 'terminal'
  | 'music'
  | 'settings'
  | 'trash'
  | 'universe'
  | 'shortcuts'
  | 'notfound'

export interface AppDefinition {
  id: AppId
  label: string
  subtitle: string
  icon: LucideIcon
  tone: string
  category: 'portfolio' | 'tools' | 'system'
  keywords: string[]
  width: number
  height: number
  minWidth: number
  minHeight: number
  dock?: boolean
  desktop?: boolean
  component: LazyExoticComponent<ComponentType<any>>
  windowId: (params?: Record<string, string>) => string
  path: (params?: Record<string, string>) => string
  title: (params?: Record<string, string>) => string
}

const humanize = (slug = '') =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const FinderApp = lazy(() => import('./FinderApp'))
const SettingsApp = lazy(() => import('./SystemSettingsApp'))
const MusicApp = lazy(() => import('./MusicApp'))
const TrashApp = lazy(() => import('./TrashApp'))
const ShortcutsApp = lazy(() => import('./ShortcutsApp'))
const WelcomeApp = lazy(() => import('../pages/Home'))
const AboutPage = lazy(() => import('../pages/About'))
const ProjectsPage = lazy(() => import('../pages/Projects'))
const ProjectPage = lazy(() => import('../pages/ProjectDetail'))
const SkillsPage = lazy(() => import('../pages/Skills'))
const ServicesPage = lazy(() => import('../pages/Services'))
const BlogPage = lazy(() => import('../pages/Blog'))
const PostPage = lazy(() => import('../pages/BlogDetail'))
const GalleryPage = lazy(() => import('../pages/Gallery'))
const ContactPage = lazy(() => import('../pages/Contact'))
const ArenaPage = lazy(() => import('../pages/ArenaAI'))
const GithubPage = lazy(() => import('../pages/Github'))
const TerminalPage = lazy(() => import('../pages/Terminal'))
const UniversePage = lazy(() => import('../pages/Universe'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))

export const APPS: Record<AppId, AppDefinition> = {
  finder: {
    id: 'finder',
    label: 'Finder',
    subtitle: 'Home',
    icon: FolderOpen,
    tone: 'from-sky-400 to-blue-600',
    category: 'system',
    keywords: ['finder', 'files', 'home', 'desktop', 'portfolio'],
    width: 1120,
    height: 700,
    minWidth: 720,
    minHeight: 440,
    dock: true,
    component: FinderApp,
    windowId: () => 'app:finder',
    path: () => '/',
    title: () => 'Finder — Home',
  },
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    subtitle: 'Portfolio overview',
    icon: Sparkles,
    tone: 'from-violet-500 to-cyan-500',
    category: 'portfolio',
    keywords: ['welcome', 'home', 'overview', 'kevin', 'portfolio'],
    width: 1040,
    height: 720,
    minWidth: 700,
    minHeight: 440,
    component: WelcomeApp,
    windowId: () => 'app:welcome',
    path: () => '/welcome',
    title: () => 'Welcome — Kevin The Cyber Coder',
  },
  about: {
    id: 'about',
    label: 'About Me',
    subtitle: 'Profile & journey',
    icon: UserRound,
    tone: 'from-violet-400 to-purple-700',
    category: 'portfolio',
    keywords: ['about', 'profile', 'bio', 'experience', 'education', 'resume'],
    width: 940,
    height: 700,
    minWidth: 620,
    minHeight: 400,
    dock: true,
    desktop: true,
    component: AboutPage,
    windowId: () => 'app:about',
    path: () => '/about',
    title: () => 'About Me — Mukeshimana Kevin',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    subtitle: 'Selected work',
    icon: FolderKanban,
    tone: 'from-amber-400 to-orange-600',
    category: 'portfolio',
    keywords: ['projects', 'work', 'case study', 'portfolio', 'github'],
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 440,
    dock: true,
    desktop: true,
    component: ProjectsPage,
    windowId: () => 'app:projects',
    path: () => '/projects',
    title: () => 'Projects',
  },
  project: {
    id: 'project',
    label: 'Project',
    subtitle: 'Case study',
    icon: FolderKanban,
    tone: 'from-amber-400 to-orange-600',
    category: 'portfolio',
    keywords: ['project', 'case study'],
    width: 1020,
    height: 720,
    minWidth: 640,
    minHeight: 420,
    component: ProjectPage,
    windowId: (params) => `project:${params?.slug || 'unknown'}`,
    path: (params) => `/projects/${params?.slug || ''}`,
    title: (params) => `Project — ${humanize(params?.slug)}`,
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    subtitle: 'Technical stack',
    icon: Layers,
    tone: 'from-emerald-400 to-teal-600',
    category: 'portfolio',
    keywords: ['skills', 'stack', 'technologies', 'react', 'node', 'typescript'],
    width: 1000,
    height: 700,
    minWidth: 640,
    minHeight: 400,
    dock: true,
    desktop: true,
    component: SkillsPage,
    windowId: () => 'app:skills',
    path: () => '/skills',
    title: () => 'Skills & Stack',
  },
  services: {
    id: 'services',
    label: 'Services',
    subtitle: 'How I can help',
    icon: Briefcase,
    tone: 'from-pink-400 to-rose-600',
    category: 'portfolio',
    keywords: ['services', 'hire', 'freelance', 'development', 'consulting'],
    width: 1020,
    height: 700,
    minWidth: 640,
    minHeight: 400,
    dock: true,
    desktop: true,
    component: ServicesPage,
    windowId: () => 'app:services',
    path: () => '/services',
    title: () => 'Services',
  },
  blog: {
    id: 'blog',
    label: 'Journal',
    subtitle: 'Articles & notes',
    icon: PenLine,
    tone: 'from-cyan-400 to-sky-600',
    category: 'portfolio',
    keywords: ['blog', 'journal', 'articles', 'writing', 'notes'],
    width: 1040,
    height: 720,
    minWidth: 680,
    minHeight: 420,
    dock: true,
    desktop: true,
    component: BlogPage,
    windowId: () => 'app:blog',
    path: () => '/blog',
    title: () => 'Journal',
  },
  post: {
    id: 'post',
    label: 'Article',
    subtitle: 'Journal entry',
    icon: FileText,
    tone: 'from-cyan-400 to-sky-600',
    category: 'portfolio',
    keywords: ['article', 'post', 'journal'],
    width: 920,
    height: 720,
    minWidth: 620,
    minHeight: 400,
    component: PostPage,
    windowId: (params) => `post:${params?.slug || 'unknown'}`,
    path: (params) => `/blog/${params?.slug || ''}`,
    title: (params) => humanize(params?.slug) || 'Journal — Article',
  },
  gallery: {
    id: 'gallery',
    label: 'Gallery',
    subtitle: 'Visual archive',
    icon: Images,
    tone: 'from-fuchsia-400 to-pink-600',
    category: 'portfolio',
    keywords: ['gallery', 'photos', 'images', 'design', 'visual'],
    width: 1060,
    height: 720,
    minWidth: 680,
    minHeight: 420,
    dock: true,
    desktop: true,
    component: GalleryPage,
    windowId: () => 'app:gallery',
    path: () => '/gallery',
    title: () => 'Gallery',
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    subtitle: 'Start a conversation',
    icon: Mail,
    tone: 'from-indigo-400 to-blue-700',
    category: 'portfolio',
    keywords: ['contact', 'email', 'message', 'hire', 'collaboration'],
    width: 940,
    height: 700,
    minWidth: 620,
    minHeight: 420,
    dock: true,
    desktop: true,
    component: ContactPage,
    windowId: () => 'app:contact',
    path: () => '/contact',
    title: () => 'Contact',
  },
  arena: {
    id: 'arena',
    label: 'ARENA AI',
    subtitle: 'Portfolio assistant',
    icon: Bot,
    tone: 'from-violet-500 to-cyan-500',
    category: 'tools',
    keywords: ['arena', 'ai', 'assistant', 'chat', 'gpt'],
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 440,
    dock: true,
    desktop: true,
    component: ArenaPage,
    windowId: () => 'app:arena',
    path: () => '/arena-ai',
    title: () => 'ARENA AI',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    subtitle: 'Command center',
    icon: Github,
    tone: 'from-slate-500 to-slate-800',
    category: 'tools',
    keywords: ['github', 'repositories', 'contributions', 'achievements', 'code'],
    width: 1080,
    height: 740,
    minWidth: 720,
    minHeight: 440,
    dock: true,
    desktop: true,
    component: GithubPage,
    windowId: () => 'app:github',
    path: () => '/github',
    title: () => 'GitHub Command Center',
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    subtitle: 'ARENA shell',
    icon: SquareTerminal,
    tone: 'from-emerald-500 to-slate-800',
    category: 'tools',
    keywords: ['terminal', 'shell', 'console', 'commands', 'cli'],
    width: 920,
    height: 580,
    minWidth: 560,
    minHeight: 320,
    dock: true,
    desktop: true,
    component: TerminalPage,
    windowId: () => 'app:terminal',
    path: () => '/terminal',
    title: () => 'Terminal — kevin@arena',
  },
  music: {
    id: 'music',
    label: 'Music',
    subtitle: 'ARENA Sound',
    icon: Music2,
    tone: 'from-rose-400 to-purple-700',
    category: 'tools',
    keywords: ['music', 'player', 'sound', 'playlist', 'audio'],
    width: 1000,
    height: 660,
    minWidth: 640,
    minHeight: 400,
    dock: true,
    desktop: true,
    component: MusicApp,
    windowId: () => 'app:music',
    path: () => '/music',
    title: () => 'Music — ARENA Sound',
  },
  settings: {
    id: 'settings',
    label: 'System Settings',
    subtitle: 'Preferences',
    icon: Settings2,
    tone: 'from-zinc-400 to-zinc-700',
    category: 'system',
    keywords: ['settings', 'preferences', 'appearance', 'wallpaper', 'dock', 'privacy'],
    width: 980,
    height: 680,
    minWidth: 680,
    minHeight: 440,
    dock: true,
    desktop: true,
    component: SettingsApp,
    windowId: () => 'app:settings',
    path: () => '/settings',
    title: () => 'System Settings',
  },
  trash: {
    id: 'trash',
    label: 'Trash',
    subtitle: 'Deleted items',
    icon: Trash2,
    tone: 'from-slate-400 to-slate-600',
    category: 'system',
    keywords: ['trash', 'bin', 'deleted', 'empty'],
    width: 780,
    height: 500,
    minWidth: 520,
    minHeight: 340,
    dock: true,
    desktop: true,
    component: TrashApp,
    windowId: () => 'app:trash',
    path: () => '/trash',
    title: () => 'Trash',
  },
  universe: {
    id: 'universe',
    label: 'Universe',
    subtitle: '3D portfolio',
    icon: Orbit,
    tone: 'from-purple-500 to-indigo-800',
    category: 'tools',
    keywords: ['universe', '3d', 'three', 'space', 'visual'],
    width: 1120,
    height: 720,
    minWidth: 720,
    minHeight: 440,
    component: UniversePage,
    windowId: () => 'app:universe',
    path: () => '/universe',
    title: () => 'Universe — 3D Portfolio',
  },
  shortcuts: {
    id: 'shortcuts',
    label: 'Shortcuts',
    subtitle: 'Keyboard guide',
    icon: Keyboard,
    tone: 'from-sky-400 to-indigo-600',
    category: 'system',
    keywords: ['shortcuts', 'keyboard', 'help', 'keys'],
    width: 780,
    height: 580,
    minWidth: 540,
    minHeight: 380,
    component: ShortcutsApp,
    windowId: () => 'app:shortcuts',
    path: () => '/shortcuts',
    title: () => 'Keyboard Shortcuts',
  },
  notfound: {
    id: 'notfound',
    label: 'System',
    subtitle: 'Route not found',
    icon: Compass,
    tone: 'from-slate-500 to-slate-700',
    category: 'system',
    keywords: ['404', 'not found'],
    width: 820,
    height: 540,
    minWidth: 560,
    minHeight: 380,
    component: NotFoundPage,
    windowId: () => 'app:notfound',
    path: () => '/404',
    title: () => 'Page not found',
  },
}

export const DOCK_APPS: AppId[] = [
  'finder',
  'gallery',
  'projects',
  'blog',
  'contact',
  'music',
  'arena',
  'terminal',
  'github',
]

/** Reference order, read left to right then top to bottom across three columns. */
export const DESKTOP_APPS: AppId[] = [
  'music',
  'gallery',
  'about',
  'settings',
  'arena',
  'projects',
  'trash',
  'contact',
  'skills',
  'github',
  'services',
  'terminal',
  'blog',
]

export const ALL_APPS = Object.values(APPS).filter(
  (app) => !['project', 'post', 'notfound'].includes(app.id)
)

export const BARE_APPS = new Set<AppId>(['finder', 'settings', 'music', 'trash', 'shortcuts'])

export interface PathMatch {
  appId: AppId
  params: Record<string, string>
  path: string
}

export function findAppForPath(pathname: string): PathMatch {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/') return { appId: 'finder', params: {}, path: '/' }
  if (clean === '/welcome') return { appId: 'welcome', params: {}, path: clean }
  if (clean.startsWith('/projects/')) {
    const slug = clean.slice('/projects/'.length).split('/')[0]
    return { appId: 'project', params: { slug }, path: `/projects/${slug}` }
  }
  if (clean.startsWith('/blog/')) {
    const slug = clean.slice('/blog/'.length).split('/')[0]
    return { appId: 'post', params: { slug }, path: `/blog/${slug}` }
  }
  const exact: Record<string, AppId> = {
    '/about': 'about',
    '/projects': 'projects',
    '/skills': 'skills',
    '/services': 'services',
    '/blog': 'blog',
    '/gallery': 'gallery',
    '/contact': 'contact',
    '/arena-ai': 'arena',
    '/github': 'github',
    '/terminal': 'terminal',
    '/music': 'music',
    '/settings': 'settings',
    '/trash': 'trash',
    '/universe': 'universe',
    '/shortcuts': 'shortcuts',
  }
  if (exact[clean]) return { appId: exact[clean], params: {}, path: clean }
  return { appId: 'notfound', params: {}, path: clean }
}

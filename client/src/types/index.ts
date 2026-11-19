export interface SocialLink {
  label: string
  url: string
  icon?: string
}

export interface Profile {
  id: string
  name: string
  displayName: string
  title: string
  tagline: string
  shortBio: string
  bio: string
  avatar: string
  resumeUrl: string
  email: string
  phone: string
  location: string
  availability: { status: 'available' | 'limited' | 'unavailable'; label: string }
  socials: SocialLink[]
  mission: string
  vision: string
  values: { title: string; description: string; icon?: string }[]
  interests: string[]
  education: {
    institution: string
    degree: string
    field: string
    start: string
    end: string
    description: string
  }[]
  experience: {
    company: string
    role: string
    start: string
    end: string
    current?: boolean
    description: string
    technologies: string[]
  }[]
  timeline: { year: string; title: string; description: string; type?: string }[]
  futureGoals: string[]
  stats: { label: string; value: string; suffix?: string }[]
}

export interface Project {
  id: string
  title: string
  slug: string
  category: string
  coverImage: string
  gallery: string[]
  summary: string
  description: string
  problem: string
  solution: string
  technologies: string[]
  features: string[]
  process: { title: string; description: string }[]
  liveUrl: string
  repoUrl: string
  status: 'draft' | 'published' | 'archived'
  stage: 'completed' | 'in-progress' | 'concept'
  featured: boolean
  tags: string[]
  views: number
  likes: number
  order: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: string
  name: string
  category: string
  icon?: string
  description: string
  level: 'expert' | 'advanced' | 'intermediate' | 'learning'
  learning: boolean
  featured: boolean
  order: number
}

export interface Service {
  id: string
  title: string
  slug: string
  icon: string
  description: string
  features: string[]
  benefits: string[]
  technologies: string[]
  cta: string
  order: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishedAt: string
  readingTime: number
  views: number
  likes: number
  featured: boolean
  author: string
  seo?: { title?: string; description?: string; keywords?: string[] }
  createdAt: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

export interface GalleryItem {
  id: string
  title: string
  category: string
  type: 'image' | 'video'
  url: string
  thumbnail: string
  description: string
  tags: string[]
  featured: boolean
  order: number
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  quote: string
  rating: number
  featured: boolean
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  cover: string
  src: string
  duration: number
  genre: string
  synth: {
    enabled: boolean
    root: number
    mode: string
    tempo: number
    brightness: number
  }
  featured: boolean
  order: number
}

export interface CommentItem {
  id: string
  targetType: 'project' | 'post' | 'portfolio'
  targetId: string
  targetTitle?: string
  name: string
  content: string
  rating?: number
  likes: number
  parentId?: string | null
  status?: string
  createdAt: string
  replies?: CommentItem[]
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  meta?: Record<string, unknown>
  createdAt: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor'
  avatar?: string
  lastLoginAt?: string
  active?: boolean
}

export interface Achievement {
  key: string
  name: string
  icon: string
  description: string
  levels: { level: number; target: number; label: string }[]
  current: number
  nextTarget: number | null
  nextLevel: number | null
  currentLevel: number
  currentLevelLabel: string
  percent: number
  source: 'github' | 'manual' | 'estimated'
  verified: boolean
  officialStatus: string
  officialUrl: string
  strategy: string[]
  notes: string
  verifiedAt: string | null
  history: { date: string; value: number; note?: string }[]
}

export interface AchievementBoard {
  ok: boolean
  username: string
  github: { available: boolean; tokenConfigured: boolean; error: string | null; fetchedAt: string }
  metrics: Record<string, number | null>
  achievements: Achievement[]
  disclaimer: string
}

export interface GithubRepo {
  name: string
  fullName: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  topics: string[]
  license?: string
  url: string
  homepage: string | null
  updatedAt: string
}

export interface GithubSummary {
  ok: boolean
  configured?: boolean
  username: string
  error?: string
  profile?: {
    login: string
    name: string
    avatarUrl: string
    bio: string
    company: string
    location: string
    blog: string
    htmlUrl: string
    publicRepos: number
    followers: number
    following: number
    createdAt: string
  }
  stars?: number
  publicRepos?: number
  languages?: { name: string; count: number }[]
  topRepos?: GithubRepo[]
  recentActivity?: { type: string; repo: string; title: string; url: string; date: string }[]
  contributions?: { total: number; days: { date: string; count: number }[] } | null
  mergedPRs?: number | null
  rateLimit?: { remaining: string | null; reset: string | null }
  tokenConfigured?: boolean
  fetchedAt: string
}

export interface RepoAudit {
  ok: boolean
  username?: string
  error?: string
  averageScore?: number
  auditedAt?: string
  note?: string
  repositories: (GithubRepo & {
    checks: { key: string; label: string; passed: boolean; detail: string }[]
    score: number
  })[]
}

export interface SponsorshipCandidate {
  packageName: string
  version: string
  repository: string
  maintainers: string[]
  fundingUrls: string[]
  fundingSource: string
  verified: boolean
  status: 'unreviewed' | 'reviewed' | 'sponsored'
  note: string
  lastCheckedAt: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  tokens?: number
  latencyMs?: number
  source?: 'provider' | 'knowledge-base'
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  messageCount: number
  pinned: boolean
  archived: boolean
  lastMessageAt: string
  createdAt: string
}

export interface SiteSettings {
  general: {
    siteName: string
    title: string
    description: string
    email: string
    phone: string
    location: string
    resumeUrl: string
  }
  appearance: {
    accent: string
    defaultTheme: string
    wallpaper: string
    glass: number
    reduceMotion: boolean
  }
  seo: { keywords?: string[]; ogImage?: string; twitterHandle?: string; canonical?: string }
  features: Record<'music' | 'gestures' | 'assistant' | 'universe' | 'terminal' | 'newsletter' | 'comments', boolean>
  maintenance: { enabled: boolean; message?: string }
  github?: { username?: string }
}

export interface DashboardStats {
  projects: number
  publishedProjects: number
  posts: number
  publishedPosts: number
  gallery: number
  comments: number
  pendingComments: number
  newFeedback: number
  subscribers: number
  newMessages: number
  conversations: number
  aiMessages: number
  unread: number
  visitors30d: number
  pageviews30d: number
  github: null | { username: string; stars: number; publicRepos: number; followers: number; lastSyncedAt: string }
  mailConfigured: boolean
}

export interface AnalyticsSummary {
  range: { days: number; since: string }
  totals: { pageviews: number; uniqueVisitors: number; events: number; avgPerDay: number }
  perDay: { date: string; views: number; visitors: number }[]
  topPages: { path: string; views: number }[]
  referrers: { source: string; count: number }[]
  events: { name: string; count: number }[]
}

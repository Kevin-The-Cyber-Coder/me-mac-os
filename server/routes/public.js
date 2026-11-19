import { Router } from 'express'
import { repo } from '../config/store.js'
import { asyncHandler, notFound } from '../utils/errors.js'
import { parsePagination } from '../utils/helpers.js'
import { getGithubSummary } from '../services/github.js'

const router = Router()

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { views: -1 },
  title: { title: 1 },
  featured: { featured: -1, order: 1 },
}

function listHandler(resource, options = {}) {
  return asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query)
    const filter = { ...(typeof options.publicFilter === 'function' ? options.publicFilter() : options.publicFilter || {}) }
    if (req.query.category) filter.category = req.query.category
    if (req.query.featured === 'true') filter.featured = true
    if (req.query.tag) filter.tags = req.query.tag
    if (req.query.learning === 'true') filter.learning = true

    const sort = SORTS[req.query.sort] || options.sort || { createdAt: -1 }
    const result = await repo.find(resource, {
      filter,
      search: req.query.q,
      searchFields: options.search || ['title', 'name'],
      sort,
      page,
      limit,
    })
    res.json({ success: true, ...result })
  })
}

const stripPrivate = (doc) => {
  if (!doc) return doc
  const clone = { ...doc }
  delete clone.email
  delete clone.ipHash
  delete clone.userAgent
  delete clone.passwordHash
  return clone
}

/* ── Profile & settings ─────────────────────────────────────── */

router.get(
  '/profile',
  asyncHandler(async (_req, res) => {
    const profile = await repo.findOne('profile', {})
    res.json({ success: true, profile: profile || null })
  })
)

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    if (!settings) {
      return res.json({
        success: true,
        settings: {
          general: { siteName: 'Kevin The Cyber Coder' },
          appearance: { accent: 'violet', defaultTheme: 'dark', wallpaper: 'aurora', glass: 0.7, reduceMotion: false },
          seo: {},
          features: { music: true, gestures: true, assistant: true, universe: true, terminal: true, newsletter: true, comments: true },
          maintenance: { enabled: false },
        },
      })
    }
    res.json({
      success: true,
      settings: {
        general: settings.general,
        appearance: settings.appearance,
        seo: settings.seo,
        features: settings.features,
        maintenance: settings.maintenance,
        github: { username: settings.github?.username },
      },
    })
  })
)

/* ── Content collections ────────────────────────────────────── */

router.get('/projects', listHandler('projects', { publicFilter: { status: 'published' }, search: ['title', 'summary', 'technologies', 'tags'], sort: { featured: -1, order: 1 } }))
router.get('/skills', listHandler('skills', { search: ['name', 'category', 'description'], sort: { category: 1, order: 1 } }))
router.get('/services', listHandler('services', { search: ['title', 'description', 'technologies'], sort: { order: 1 } }))
router.get('/testimonials', listHandler('testimonials', { sort: { order: 1 } }))
router.get('/gallery', listHandler('gallery', { search: ['title', 'tags', 'description'], sort: { order: 1, createdAt: -1 } }))
router.get('/music', listHandler('music', { sort: { order: 1 } }))
router.get('/playlists', listHandler('playlists', { sort: { order: 1 } }))
router.get('/blog-categories', listHandler('blog-categories', { sort: { name: 1 } }))
router.get(
  '/blog',
  listHandler('blog', {
    publicFilter: { status: 'published' },
    search: ['title', 'excerpt', 'tags', 'category'],
    sort: { publishedAt: -1 },
  })
)

async function findPublicBySlug(resource, slugOrId, extra = {}) {
  const bySlug = await repo.findOne(resource, { slug: slugOrId, ...extra })
  if (bySlug) return bySlug
  return repo.findById(resource, slugOrId)
}

router.get(
  '/projects/:slug',
  asyncHandler(async (req, res) => {
    const project = await findPublicBySlug('projects', req.params.slug, { status: 'published' })
    if (!project) throw notFound('Project not found')
    await repo.inc('projects', project.id, 'views', 1)
    const related = await repo.find('projects', {
      filter: { status: 'published', category: project.category, id: { $ne: project.id } },
      sort: { featured: -1 },
      limit: 3,
    })
    res.json({ success: true, project: { ...project, views: (project.views || 0) + 1 }, related: related.items })
  })
)

router.get(
  '/blog/:slug',
  asyncHandler(async (req, res) => {
    const post = await findPublicBySlug('blog', req.params.slug, { status: 'published' })
    if (!post) throw notFound('Article not found')
    await repo.inc('blog', post.id, 'views', 1)
    const related = await repo.find('blog', {
      filter: { status: 'published', category: post.category, id: { $ne: post.id } },
      sort: { publishedAt: -1 },
      limit: 3,
    })
    res.json({ success: true, post: { ...post, views: (post.views || 0) + 1 }, related: related.items })
  })
)

/* ── Global search ──────────────────────────────────────────── */

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim()
    if (q.length < 2) return res.json({ success: true, q, results: [], groups: {} })

    const [projects, posts, skills, services, gallery] = await Promise.all([
      repo.find('projects', { filter: { status: 'published' }, search: q, searchFields: ['title', 'summary', 'technologies', 'tags'], limit: 6 }),
      repo.find('blog', { filter: { status: 'published' }, search: q, searchFields: ['title', 'excerpt', 'tags'], limit: 6 }),
      repo.find('skills', { search: q, searchFields: ['name', 'category'], limit: 6 }),
      repo.find('services', { search: q, searchFields: ['title', 'description'], limit: 6 }),
      repo.find('gallery', { search: q, searchFields: ['title', 'tags'], limit: 4 }),
    ])

    let githubRepos = []
    try {
      const gh = await getGithubSummary()
      if (gh.ok) {
        const needle = q.toLowerCase()
        githubRepos = gh.topRepos
          .filter((r) => `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`.toLowerCase().includes(needle))
          .slice(0, 5)
          .map((r) => ({ id: r.fullName, title: r.name, description: r.description, url: r.url, stars: r.stars }))
      }
    } catch {
      /* GitHub is optional for search */
    }

    const groups = {
      projects: projects.items.map((p) => ({ id: p.id, title: p.title, description: p.summary, href: `/projects/${p.slug}`, meta: p.category })),
      blog: posts.items.map((p) => ({ id: p.id, title: p.title, description: p.excerpt, href: `/blog/${p.slug}`, meta: p.category })),
      skills: skills.items.map((s) => ({ id: s.id, title: s.name, description: s.description, href: '/skills', meta: s.category })),
      services: services.items.map((s) => ({ id: s.id, title: s.title, description: s.description, href: '/services', meta: 'Service' })),
      gallery: gallery.items.map((g) => ({ id: g.id, title: g.title || 'Gallery item', description: g.description, href: '/gallery', meta: g.category })),
      github: githubRepos.map((r) => ({ id: r.id, title: r.title, description: r.description, href: r.url, meta: `GitHub · ${r.stars}★`, external: true })),
    }
    const results = Object.entries(groups).flatMap(([group, items]) => items.map((item) => ({ ...item, group })))
    res.json({ success: true, q, results, groups })
  })
)

router.get(
  '/stats/public',
  asyncHandler(async (_req, res) => {
    const [projects, posts, skills, gallery, comments] = await Promise.all([
      repo.count('projects', { status: 'published' }),
      repo.count('blog', { status: 'published' }),
      repo.count('skills'),
      repo.count('gallery'),
      repo.count('comments', { status: 'approved' }),
    ])
    res.json({ success: true, stats: { projects, posts, skills, gallery, comments } })
  })
)

export { stripPrivate }
export default router

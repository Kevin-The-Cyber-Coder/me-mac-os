import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { repo } from '../config/store.js'
import { asyncHandler, badRequest, notFound, HttpError } from '../utils/errors.js'
import { parsePagination, slugify, readingTime, stripUnsafe } from '../utils/helpers.js'
import { protect, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { upload, persistUpload } from '../middleware/upload.js'
import { createAdminSchema, aiSettingsSchema } from '../validators/schemas.js'
import { sendMail, mailTemplates, mailConfigured } from '../services/mail.js'
import { createNotification, unreadCount } from '../services/notifications.js'
import { analyticsSummary } from '../services/analytics.js'
import { logActivity } from '../services/activity.js'
import { encryptSecret, maskSecret, decryptSecret } from '../services/crypto.js'
import { getGithubSummary } from '../services/github.js'
import { getAchievementBoard } from '../services/achievements.js'
import { allModelEntries } from '../models/index.js'

const router = Router()
router.use(protect)

/* ── Collection registry ────────────────────────────────────── */

const ADMIN_COLLECTIONS = {
  projects: {
    search: ['title', 'slug', 'category', 'technologies'],
    sort: { order: 1, createdAt: -1 },
    beforeSave: (d) => ({ ...d, slug: d.slug ? slugify(d.slug) : slugify(d.title || 'project') }),
  },
  skills: { search: ['name', 'category'], sort: { category: 1, order: 1 } },
  services: {
    search: ['title', 'description'],
    sort: { order: 1 },
    beforeSave: (d) => ({ ...d, slug: d.slug ? slugify(d.slug) : slugify(d.title || 'service') }),
  },
  'blog-categories': { search: ['name'], sort: { name: 1 } },
  blog: {
    search: ['title', 'slug', 'category', 'tags'],
    sort: { publishedAt: -1 },
    beforeSave: (d) => ({
      ...d,
      slug: d.slug ? slugify(d.slug) : slugify(d.title || 'article'),
      readingTime: readingTime(d.content || ''),
    }),
  },
  gallery: { search: ['title', 'category', 'tags'], sort: { order: 1, createdAt: -1 } },
  testimonials: { search: ['name', 'company'], sort: { order: 1 } },
  music: { search: ['title', 'artist', 'album'], sort: { order: 1 } },
  playlists: { search: ['name'], sort: { order: 1 } },
  comments: { search: ['name', 'content', 'targetTitle'], sort: { createdAt: -1 }, select: '+email' },
  feedback: { search: ['name', 'message', 'category'], sort: { createdAt: -1 }, select: '+email' },
  messages: { search: ['name', 'email', 'subject', 'message'], sort: { createdAt: -1 } },
  subscribers: { search: ['email', 'name'], sort: { createdAt: -1 } },
  campaigns: { search: ['subject', 'status'], sort: { createdAt: -1 } },
  notifications: { search: ['title', 'message'], sort: { createdAt: -1 } },
  achievements: { search: ['name', 'key'], sort: { order: 1 } },
  sponsorships: { search: ['packageName', 'repository'], sort: { packageName: 1 } },
  audit: { search: ['repo'], sort: { score: -1 } },
  activity: { search: ['action', 'actor', 'entity'], sort: { createdAt: -1 } },
  analytics: { search: ['path', 'event'], sort: { createdAt: -1 } },
  'github-accounts': { search: ['username'], sort: { createdAt: -1 } },
  'github-activity': { search: ['repo', 'title'], sort: { date: -1 } },
  conversations: { search: ['title', 'visitorId'], sort: { lastMessageAt: -1 } },
}

router.get('/collections', (_req, res) => {
  res.json({ success: true, collections: Object.keys(ADMIN_COLLECTIONS) })
})

/* ── Dashboard ──────────────────────────────────────────────── */

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [
      projects,
      publishedProjects,
      posts,
      publishedPosts,
      gallery,
      comments,
      pendingComments,
      newFeedback,
      subscribers,
      newMessages,
      conversations,
      aiMessages,
      unread,
      activity,
      recentMessages,
      githubSnapshot,
    ] = await Promise.all([
      repo.count('projects'),
      repo.count('projects', { status: 'published' }),
      repo.count('blog'),
      repo.count('blog', { status: 'published' }),
      repo.count('gallery'),
      repo.count('comments'),
      repo.count('comments', { status: 'pending' }),
      repo.count('feedback', { status: 'new' }),
      repo.count('subscribers', { status: 'subscribed' }),
      repo.count('messages', { status: 'new' }),
      repo.count('conversations'),
      repo.count('chatmessages', { role: 'user' }),
      unreadCount(),
      repo.find('activity', { sort: { createdAt: -1 }, limit: 8 }),
      repo.find('messages', { sort: { createdAt: -1 }, limit: 5 }),
      repo.findOne('github-accounts', {}),
    ])

    const analytics = await analyticsSummary(30)

    res.json({
      success: true,
      stats: {
        projects,
        publishedProjects,
        posts,
        publishedPosts,
        gallery,
        comments,
        pendingComments,
        newFeedback,
        subscribers,
        newMessages,
        conversations,
        aiMessages,
        unread,
        visitors30d: analytics.totals.uniqueVisitors,
        pageviews30d: analytics.totals.pageviews,
        github: githubSnapshot
          ? {
              username: githubSnapshot.username,
              stars: githubSnapshot.stars,
              publicRepos: githubSnapshot.publicRepos,
              followers: githubSnapshot.followers,
              lastSyncedAt: githubSnapshot.lastSyncedAt,
            }
          : null,
        mailConfigured: mailConfigured(),
      },
      analytics,
      recentActivity: activity.items,
      recentMessages: recentMessages.items,
    })
  })
)

router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const days = Math.min(365, Math.max(7, Number(req.query.days) || 30))
    const summary = await analyticsSummary(days)
    res.json({ success: true, ...summary })
  })
)

/* ── AI management ──────────────────────────────────────────── */

router.get(
  '/ai/usage',
  asyncHandler(async (_req, res) => {
    const [conversations, messages, assistantMessages, recent] = await Promise.all([
      repo.count('conversations'),
      repo.count('chatmessages'),
      repo.find('chatmessages', { filter: { role: 'assistant' }, sort: { createdAt: -1 }, limit: 5000 }),
      repo.find('conversations', { sort: { lastMessageAt: -1 }, limit: 10 }),
    ])
    const tokens = assistantMessages.items.reduce((sum, m) => sum + (m.tokens || 0), 0)
    const avgLatency = assistantMessages.items.length
      ? Math.round(
          assistantMessages.items.reduce((sum, m) => sum + (m.latencyMs || 0), 0) / assistantMessages.items.length
        )
      : 0
    res.json({
      success: true,
      usage: {
        conversations,
        messages,
        tokens,
        avgLatencyMs: avgLatency,
        recentConversations: recent.items,
      },
    })
  })
)

router.get(
  '/ai/settings',
  asyncHandler(async (_req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    const ai = settings?.ai || {}
    const storedKey = ai.apiKeyEncrypted ? 'set' : 'none'
    res.json({
      success: true,
      settings: {
        enabled: ai.enabled !== false,
        provider: ai.provider || env.ai.provider,
        baseUrl: ai.baseUrl || env.ai.baseUrl,
        model: ai.model || env.ai.model,
        systemPrompt: ai.systemPrompt || '',
        maxTokens: ai.maxTokens || env.ai.maxTokens,
        temperature: ai.temperature ?? env.ai.temperature,
        dailyLimit: ai.dailyLimit || env.ai.dailyLimit,
        retentionDays: ai.retentionDays || env.ai.retentionDays,
      },
      key: {
        envKeyConfigured: Boolean(env.ai.apiKey),
        storedKey,
        masked: env.ai.apiKey ? maskSecret(env.ai.apiKey) : maskSecret(decryptSecret(ai.apiKeyEncrypted || '')),
      },
    })
  })
)

router.put(
  '/ai/settings',
  requireRole('admin'),
  validate(aiSettingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    if (!settings) throw notFound('Site settings not initialised')
    const { apiKey, ...rest } = req.body
    const patch = { ...settings.ai, ...rest }
    if (apiKey !== undefined) {
      patch.apiKeyEncrypted = apiKey ? encryptSecret(apiKey) : ''
    }
    const updated = await repo.update('settings', settings.id, { ai: patch })
    await logActivity({ actor: req.admin.email, action: 'ai.settings.update', entity: 'settings', req })
    res.json({ success: true, message: 'ARENA AI settings saved', settings: updated.ai })
  })
)

router.post(
  '/ai/test',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    const ai = settings?.ai || {}
    const apiKey = env.ai.apiKey || decryptSecret(ai.apiKeyEncrypted || '')
    if (!apiKey) {
      return res.json({
        success: true,
        result: {
          ok: false,
          mode: 'knowledge-base',
          message: 'No provider API key configured. ARENA AI is running in verified portfolio knowledge mode.',
        },
      })
    }
    const baseUrl = (ai.baseUrl || env.ai.baseUrl).replace(/\/+$/, '')
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: ai.model || env.ai.model,
          messages: [{ role: 'user', content: 'Reply with exactly: ARENA ONLINE' }],
          max_tokens: 12,
          temperature: 0,
        }),
      })
      const data = await response.json().catch(() => ({}))
      res.json({
        success: true,
        result: {
          ok: response.ok,
          status: response.status,
          mode: 'provider',
          reply: data.choices?.[0]?.message?.content || null,
          error: response.ok ? null : data.error?.message || 'Provider rejected the request',
        },
      })
    } catch (err) {
      res.json({ success: true, result: { ok: false, mode: 'provider', error: err.message } })
    }
  })
)

router.delete(
  '/ai/conversations',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const retentionDays = Math.max(1, Number(req.query.olderThanDays) || 0)
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const { items } = await repo.find('conversations', {
      filter: retentionDays ? { lastMessageAt: { $lte: cutoff } } : {},
      limit: 2000,
      page: 1,
    })
    for (const c of items) {
      const msgs = await repo.find('chatmessages', { filter: { conversationId: c.id }, limit: 500, page: 1 })
      await Promise.all(msgs.items.map((m) => repo.remove('chatmessages', m.id)))
      await repo.remove('conversations', c.id)
    }
    await logActivity({ actor: req.admin.email, action: 'ai.conversations.purge', entity: 'conversation', meta: { removed: items.length }, req })
    res.json({ success: true, removed: items.length })
  })
)

/* ── Settings & profile ─────────────────────────────────────── */

router.get(
  '/settings/full',
  asyncHandler(async (_req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    if (!settings) throw notFound('Settings not initialised')
    const { ai, ...rest } = settings
    res.json({
      success: true,
      settings: {
        ...rest,
        ai: {
          ...ai,
          apiKeyEncrypted: undefined,
          apiKeySet: Boolean(ai.apiKeyEncrypted),
        },
      },
    })
  })
)

router.put(
  '/settings',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const settings = await repo.findOne('settings', { key: 'site' })
    if (!settings) throw notFound('Settings not initialised')
    const body = req.body || {}
    const allowed = ['general', 'appearance', 'seo', 'features', 'maintenance', 'github']
    const patch = {}
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = { ...(settings[key] || {}), ...body[key] }
    }
    if (body.ai) {
      const { apiKey, ...aiRest } = body.ai
      patch.ai = { ...(settings.ai || {}), ...aiRest }
      if (apiKey !== undefined) patch.ai.apiKeyEncrypted = apiKey ? encryptSecret(apiKey) : ''
    }
    const updated = await repo.update('settings', settings.id, patch)
    await logActivity({ actor: req.admin.email, action: 'settings.update', entity: 'settings', req })
    res.json({ success: true, settings: updated, message: 'Settings saved' })
  })
)

router.get(
  '/profile/full',
  asyncHandler(async (_req, res) => {
    const profile = await repo.findOne('profile', {})
    res.json({ success: true, profile })
  })
)

router.put(
  '/profile',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const profile = await repo.findOne('profile', {})
    const data = stripUnsafe(req.body || {})
    const saved = profile
      ? await repo.update('profile', profile.id, data)
      : await repo.create('profile', data)
    await logActivity({ actor: req.admin.email, action: 'profile.update', entity: 'profile', entityId: saved.id, req })
    res.json({ success: true, profile: saved, message: 'Profile updated' })
  })
)

/* ── Uploads ────────────────────────────────────────────────── */

router.post(
  '/upload',
  requireRole('admin'),
  upload.array('files', 4),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw badRequest('No files received')
    const files = []
    for (const file of req.files) {
      const persisted = await persistUpload(file)
      files.push({ ...persisted, name: file.originalname, mimetype: file.mimetype, size: file.size })
    }
    await logActivity({ actor: req.admin.email, action: 'media.upload', entity: 'media', meta: { count: files.length }, req })
    res.status(201).json({ success: true, files })
  })
)

/* ── User management ────────────────────────────────────────── */

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const { items } = await repo.find('admins', { sort: { createdAt: 1 }, limit: 50 })
    res.json({
      success: true,
      users: items.map(({ passwordHash, resetTokenHash, ...safe }) => safe),
    })
  })
)

router.post(
  '/users',
  requireRole('admin'),
  validate(createAdminSchema),
  asyncHandler(async (req, res) => {
    const exists = await repo.findOne('admins', { email: req.body.email })
    if (exists) throw new HttpError(409, 'An administrator with that email already exists')
    const doc = await repo.create('admins', {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'editor',
      passwordHash: await bcrypt.hash(req.body.password, 12),
      active: true,
    })
    await logActivity({ actor: req.admin.email, action: 'admin.create', entity: 'admin', entityId: doc.id, req })
    res.status(201).json({ success: true, message: 'Administrator created', user: { id: doc.id, name: doc.name, email: doc.email, role: doc.role } })
  })
)

router.patch(
  '/users/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const target = await repo.findById('admins', req.params.id)
    if (!target) throw notFound('Administrator not found')
    const patch = {}
    if (req.body.name) patch.name = req.body.name
    if (req.body.role) patch.role = req.body.role
    if (typeof req.body.active === 'boolean') patch.active = req.body.active
    if (req.body.password) patch.passwordHash = await bcrypt.hash(req.body.password, 12)
    if (target.id === req.admin.id && req.body.active === false) {
      throw badRequest('You cannot deactivate your own account')
    }
    const updated = await repo.update('admins', target.id, patch)
    await logActivity({ actor: req.admin.email, action: 'admin.update', entity: 'admin', entityId: target.id, req })
    res.json({ success: true, message: 'Administrator updated', user: { id: updated.id, name: updated.name, role: updated.role, active: updated.active } })
  })
)

router.delete(
  '/users/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.admin.id) throw badRequest('You cannot delete your own account')
    const removed = await repo.remove('admins', req.params.id)
    if (!removed) throw notFound('Administrator not found')
    await logActivity({ actor: req.admin.email, action: 'admin.delete', entity: 'admin', entityId: req.params.id, req })
    res.json({ success: true, message: 'Administrator removed' })
  })
)

/* ── Notifications ──────────────────────────────────────────── */

router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination({ page: req.query.page, limit: req.query.limit || 30 })
    const result = await repo.find('notifications', {
      sort: { createdAt: -1 },
      page,
      limit,
    })
    res.json({ success: true, ...result, unread: await unreadCount() })
  })
)

router.patch(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    const { items } = await repo.find('notifications', { filter: { read: false }, limit: 1000, page: 1 })
    await Promise.all(items.map((n) => repo.update('notifications', n.id, { read: true })))
    res.json({ success: true, unread: 0 })
  })
)

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const updated = await repo.update('notifications', req.params.id, { read: true })
    if (!updated) throw notFound('Notification not found')
    res.json({ success: true, notification: updated })
  })
)

router.delete(
  '/notifications/:id',
  asyncHandler(async (req, res) => {
    const removed = await repo.remove('notifications', req.params.id)
    if (!removed) throw notFound('Notification not found')
    res.json({ success: true })
  })
)

/* ── Newsletter campaigns ───────────────────────────────────── */

router.post(
  '/campaigns/:id/send',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const campaign = await repo.findById('campaigns', req.params.id)
    if (!campaign) throw notFound('Campaign not found')
    if (campaign.status === 'sent' && req.body?.resend !== true) {
      throw badRequest('This campaign was already sent. Pass resend:true to send again.')
    }

    const { items: subscribers } = await repo.find('subscribers', {
      filter: { status: 'subscribed' },
      limit: 1000,
      page: 1,
    })
    if (!subscribers.length) throw badRequest('There are no confirmed subscribers yet')

    await repo.update('campaigns', campaign.id, { status: 'sending' })
    let delivered = 0
    let failed = 0
    const batchSize = 15
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (sub) => {
          const unsubscribe = `${env.publicApiUrl}/api/newsletter/unsubscribe?token=${sub.token}`
          const html = `${campaign.content}<p style="margin-top:26px;font-size:11px;color:#5c6788">You are receiving this because you subscribed. <a href="${unsubscribe}" style="color:#8b9bff">Unsubscribe</a>.</p>`
          const result = await sendMail({ to: sub.email, subject: campaign.subject, html })
          if (result.delivered) delivered += 1
          else failed += 1
        })
      )
    }

    const updated = await repo.update('campaigns', campaign.id, {
      status: 'sent',
      sentAt: new Date(),
      recipients: subscribers.length,
      stats: { delivered, failed, opened: campaign.stats?.opened || 0, clicked: campaign.stats?.clicked || 0 },
    })

    await createNotification({
      type: 'system',
      title: 'Newsletter campaign sent',
      message: `${campaign.subject} — ${delivered} delivered, ${failed} failed`,
      link: '/admin?module=campaigns',
    })
    await logActivity({ actor: req.admin.email, action: 'newsletter.send', entity: 'campaign', entityId: campaign.id, req, meta: { delivered, failed } })
    res.json({ success: true, campaign: updated, delivered, failed, message: `Campaign processed for ${subscribers.length} subscribers.` })
  })
)

/* ── Backup & restore ───────────────────────────────────────── */

const BACKUP_EXCLUDE = new Set(['admins', 'analytics', 'activity'])

router.post(
  '/backup/export',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = {}
    for (const [slug] of allModelEntries()) {
      if (BACKUP_EXCLUDE.has(slug)) continue
      data[slug] = await repo.all(slug)
    }
    await logActivity({ actor: req.admin.email, action: 'backup.export', entity: 'system', req })
    res.json({
      success: true,
      backup: {
        meta: {
          app: 'Kevin The Cyber Coder',
          exportedAt: new Date().toISOString(),
          dbMode: repo.mode,
          version: 1,
        },
        collections: data,
      },
    })
  })
)

router.post(
  '/backup/restore',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const collections = req.body?.collections
    if (!collections || typeof collections !== 'object') throw badRequest('Invalid backup payload')
    const restored = {}
    for (const [slug, docs] of Object.entries(collections)) {
      if (BACKUP_EXCLUDE.has(slug) || !Array.isArray(docs)) continue
      if (!allModelEntries().some(([key]) => key === slug)) continue
      await repo.clear(slug)
      if (docs.length) {
        await repo.insertMany(
          slug,
          docs.map((doc) => {
            const clean = { ...doc }
            delete clean.__v
            return clean
          })
        )
      }
      restored[slug] = docs.length
    }
    await logActivity({ actor: req.admin.email, action: 'backup.restore', entity: 'system', req, meta: restored })
    res.json({ success: true, restored, message: 'Backup restored' })
  })
)

/* ── GitHub helper for admin dashboard ──────────────────────── */

router.get(
  '/github/overview',
  asyncHandler(async (_req, res) => {
    const [summary, achievements] = await Promise.all([getGithubSummary(), getAchievementBoard()])
    res.json({ success: true, summary, achievements })
  })
)

/* ── Generic collection CRUD (must stay last) ───────────────── */

function configFor(collection) {
  const config = ADMIN_COLLECTIONS[collection]
  if (!config) throw notFound(`Unknown admin collection: ${collection}`)
  return config
}

router.get(
  '/:collection',
  asyncHandler(async (req, res) => {
    const { collection } = req.params
    const config = configFor(collection)
    const { page, limit } = parsePagination(req.query)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.category) filter.category = req.query.category
    const result = await repo.find(collection, {
      filter,
      search: req.query.q,
      searchFields: config.search,
      sort: config.sort,
      page,
      limit,
      select: config.select,
    })
    const items =
      collection === 'admins'
        ? result.items.map(({ passwordHash, ...safe }) => safe)
        : result.items
    res.json({ success: true, ...result, items })
  })
)

router.get(
  '/:collection/:id',
  asyncHandler(async (req, res) => {
    const config = configFor(req.params.collection)
    const doc = await repo.findById(req.params.collection, req.params.id, { select: config.select })
    if (!doc) throw notFound('Record not found')
    res.json({ success: true, item: doc })
  })
)

router.post(
  '/:collection',
  asyncHandler(async (req, res) => {
    const { collection } = req.params
    const config = configFor(collection)
    let data = stripUnsafe(req.body || {})
    if (config.beforeSave) data = config.beforeSave(data)
    if (collection === 'subscribers' && !data.token) {
      data.token = nanoid(32)
      data.status = data.status || 'subscribed'
      data.consentAt = data.consentAt || new Date()
    }
    const doc = await repo.create(collection, data)
    await logActivity({ actor: req.admin.email, action: `${collection}.create`, entity: collection, entityId: doc.id, req })
    res.status(201).json({ success: true, item: doc, message: 'Created' })
  })
)

router.patch(
  '/:collection/:id',
  asyncHandler(async (req, res) => {
    const { collection, id } = req.params
    const config = configFor(collection)
    let data = stripUnsafe(req.body || {})
    if (config.beforeSave) data = config.beforeSave({ ...(await repo.findById(collection, id)), ...data })
    const doc = await repo.update(collection, id, data)
    if (!doc) throw notFound('Record not found')
    await logActivity({ actor: req.admin.email, action: `${collection}.update`, entity: collection, entityId: id, req })
    res.json({ success: true, item: doc, message: 'Saved' })
  })
)

router.delete(
  '/:collection/:id',
  asyncHandler(async (req, res) => {
    const { collection, id } = req.params
    configFor(collection)
    const removed = await repo.remove(collection, id)
    if (!removed) throw notFound('Record not found')
    await logActivity({ actor: req.admin.email, action: `${collection}.delete`, entity: collection, entityId: id, req })
    res.json({ success: true, message: 'Deleted' })
  })
)

export default router

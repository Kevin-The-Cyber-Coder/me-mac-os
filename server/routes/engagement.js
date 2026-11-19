import { Router } from 'express'
import { nanoid } from 'nanoid'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { repo } from '../config/store.js'
import { asyncHandler, notFound, badRequest } from '../utils/errors.js'
import { hashIp } from '../utils/helpers.js'
import { validate } from '../middleware/validate.js'
import { contactLimiter, engagementLimiter } from '../middleware/rateLimit.js'
import { commentSchema, contactSchema, feedbackSchema, newsletterSchema } from '../validators/schemas.js'
import { sendMail, mailTemplates } from '../services/mail.js'
import { createNotification } from '../services/notifications.js'
import { emitPublic } from '../sockets/index.js'

const router = Router()

const sanitizeComment = (doc) => {
  const clone = { ...doc }
  delete clone.email
  delete clone.ipHash
  delete clone.userAgent
  return clone
}

/* ── Contact ────────────────────────────────────────────────── */

router.post(
  '/contact',
  contactLimiter,
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    const { name, email, subject, service, message, honeypot } = req.body
    if (honeypot) return res.json({ success: true, message: 'Message received.' })

    const doc = await repo.create('messages', {
      name,
      email,
      subject,
      service: service || '',
      message,
      status: 'new',
      ipHash: hashIp(req.ip || ''),
    })

    await createNotification({
      type: 'message',
      title: `New message from ${name}`,
      message: subject,
      link: '/admin?module=messages',
      meta: { id: doc.id, service },
    })

    const confirm = mailTemplates.contactConfirm(name, subject)
    await sendMail({ to: email, subject: confirm.subject, html: confirm.html, replyTo: env.smtp.adminEmail })
    const admin = mailTemplates.adminContact({ name, email, subject, service, message })
    await sendMail({ to: env.smtp.adminEmail, subject: admin.subject, html: admin.html, replyTo: email })

    emitPublic('contact:received', { id: doc.id })
    res.status(201).json({ success: true, message: 'Your message is on its way. Check your inbox for a confirmation.' })
  })
)

/* ── Comments ───────────────────────────────────────────────── */

router.get(
  '/comments',
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.query
    if (!targetType || !targetId) throw badRequest('targetType and targetId are required')
    const { items } = await repo.find('comments', {
      filter: { targetType, targetId, status: 'approved' },
      sort: { createdAt: 1 },
      limit: 200,
      page: 1,
    })
    const clean = items.map(sanitizeComment)
    const roots = clean.filter((c) => !c.parentId)
    const replies = clean.filter((c) => c.parentId)
    res.json({
      success: true,
      comments: roots.map((c) => ({ ...c, replies: replies.filter((r) => r.parentId === c.id) })),
      total: clean.length,
    })
  })
)

router.post(
  '/comments',
  engagementLimiter,
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    const { targetType, targetId, targetTitle, name, email, content, rating, parentId, honeypot } = req.body
    if (honeypot) return res.json({ success: true, message: 'Comment received for moderation.' })

    const doc = await repo.create('comments', {
      targetType,
      targetId,
      targetTitle: targetTitle || '',
      name,
      email,
      content,
      rating: rating || undefined,
      parentId: parentId || null,
      status: 'pending',
      ipHash: hashIp(req.ip || ''),
      userAgent: req.headers['user-agent']?.slice(0, 250) || '',
    })

    await createNotification({
      type: 'comment',
      title: `New comment from ${name}`,
      message: content.slice(0, 120),
      link: '/admin?module=comments',
      meta: { id: doc.id, targetType, targetId },
    })

    res.status(201).json({
      success: true,
      message: 'Thanks! Your comment is awaiting moderation and will appear shortly.',
      comment: sanitizeComment(doc),
    })
  })
)

router.post(
  '/comments/:id/like',
  engagementLimiter,
  asyncHandler(async (req, res) => {
    const comment = await repo.findById('comments', req.params.id)
    if (!comment || comment.status !== 'approved') throw notFound('Comment not found')
    const updated = await repo.inc('comments', comment.id, 'likes', 1)
    res.json({ success: true, likes: updated?.likes || 0 })
  })
)

router.post(
  '/comments/:id/report',
  engagementLimiter,
  asyncHandler(async (req, res) => {
    const comment = await repo.findById('comments', req.params.id)
    if (!comment) throw notFound('Comment not found')
    await createNotification({
      type: 'comment',
      title: 'Comment reported',
      message: `A visitor reported a comment by ${comment.name}`,
      link: '/admin?module=comments',
      meta: { id: comment.id, reason: String(req.body?.reason || '').slice(0, 300) },
    })
    res.json({ success: true, message: 'Thanks — the report has reached the moderator.' })
  })
)

/* ── Feedback ───────────────────────────────────────────────── */

router.post(
  '/feedback',
  engagementLimiter,
  validate(feedbackSchema),
  asyncHandler(async (req, res) => {
    const { name, email, category, rating, message, honeypot } = req.body
    if (honeypot) return res.json({ success: true })

    const doc = await repo.create('feedback', {
      name,
      email: email || undefined,
      category: category || 'General',
      rating: rating || undefined,
      message,
      status: 'new',
      ipHash: hashIp(req.ip || ''),
    })

    await createNotification({
      type: 'feedback',
      title: `New feedback from ${name}`,
      message: message.slice(0, 120),
      link: '/admin?module=feedback',
      meta: { id: doc.id, category },
    })

    res.status(201).json({ success: true, message: 'Thank you for helping improve the experience.' })
  })
)

/* ── Newsletter ─────────────────────────────────────────────── */

const unsubscribeUrl = (token) => `${env.publicApiUrl}/api/newsletter/unsubscribe?token=${token}`

router.post(
  '/newsletter/subscribe',
  engagementLimiter,
  validate(newsletterSchema),
  asyncHandler(async (req, res) => {
    const { email, name, source } = req.body
    const existing = await repo.findOne('subscribers', { email })

    if (existing && existing.status === 'subscribed') {
      return res.json({ success: true, message: 'You are already subscribed. Thanks for being here!' })
    }

    const token = existing?.token || nanoid(32)
    const doc = existing
      ? await repo.update('subscribers', existing.id, {
          status: 'subscribed',
          name: name || existing.name,
          consentAt: new Date(),
          unsubscribedAt: null,
          token,
        })
      : await repo.create('subscribers', {
          email,
          name: name || '',
          status: 'subscribed',
          token,
          source: source || 'website',
          consentAt: new Date(),
        })

    const welcome = mailTemplates.welcome(name || 'there', unsubscribeUrl(token))
    await sendMail({ to: email, subject: welcome.subject, html: welcome.html })

    await createNotification({
      type: 'subscriber',
      title: 'New newsletter subscriber',
      message: email,
      link: '/admin?module=subscribers',
      meta: { id: doc.id },
    })

    res.status(201).json({ success: true, message: 'Subscribed! A welcome email is on its way.' })
  })
)

router.get(
  '/newsletter/unsubscribe',
  asyncHandler(async (req, res) => {
    const token = String(req.query.token || '')
    const subscriber = token ? await repo.findOne('subscribers', { token }) : null
    if (subscriber) {
      await repo.update('subscribers', subscriber.id, { status: 'unsubscribed', unsubscribedAt: new Date() })
    }
    const ok = Boolean(subscriber)
    res
      .status(ok ? 200 : 400)
      .type('html')
      .send(`<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title>
      <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05060c;color:#e8ecff;font-family:Inter,system-ui,sans-serif}
      .card{max-width:420px;padding:36px;border:1px solid #1e2540;border-radius:18px;background:linear-gradient(160deg,#0d1226,#080b16);text-align:center}
      h1{font-size:20px;margin:0 0 10px}p{color:#98a2c6;font-size:14px;line-height:1.6}a{color:#8b9bff}</style></head>
      <body><div class="card"><h1>${ok ? 'You are unsubscribed' : 'Invalid unsubscribe link'}</h1>
      <p>${ok ? 'You will no longer receive newsletter emails. You can resubscribe from the portfolio at any time.' : 'This link is invalid or has expired.'}</p>
      <p><a href="${env.clientUrl}">Return to the portfolio</a></p></div></body></html>`)
  })
)

/* ── Likes / appreciation ───────────────────────────────────── */

router.post(
  '/appreciate',
  engagementLimiter,
  asyncHandler(async (req, res) => {
    const { type, id } = req.body || {}
    const collection = type === 'post' ? 'blog' : type === 'project' ? 'projects' : null
    if (!collection || !id) throw badRequest('type and id are required')
    const doc = await repo.findById(collection, id)
    if (!doc) throw notFound('Not found')
    const updated = await repo.inc(collection, doc.id, 'likes', 1)
    res.json({ success: true, likes: updated?.likes || 0 })
  })
)

export default router

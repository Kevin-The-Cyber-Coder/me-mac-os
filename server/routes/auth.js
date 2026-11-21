import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { repo } from '../config/store.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { validate } from '../middleware/validate.js'
import { protect, signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js'
import { authLimiter, refreshLimiter } from '../middleware/rateLimit.js'
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/schemas.js'
import { sendMail, mailTemplates } from '../services/mail.js'
import { logActivity } from '../services/activity.js'

const router = Router()

// Same-site deployments keep the refresh cookie strict; a separate client
// origin still requires SameSite=None for the cookie to travel.
const sameSite = (() => {
  try {
    return new URL(env.clientUrl).host === new URL(env.publicApiUrl).host ? 'lax' : 'none'
  } catch {
    return 'lax'
  }
})()

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? sameSite : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  priority: 'high',
}

const publicAdmin = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  avatar: admin.avatar || '',
  lastLoginAt: admin.lastLoginAt || null,
})

function issueSession(res, admin) {
  const accessToken = signAccessToken(admin)
  const refreshToken = signRefreshToken(admin)
  res.cookie('kcp_refresh', refreshToken, cookieOptions)
  return { accessToken, admin: publicAdmin(admin) }
}

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const admin = await repo.findOne('admins', { email }, { select: '+passwordHash' })
    if (!admin || !admin.active) throw new HttpError(401, 'Invalid email or password')

    const ok = await bcrypt.compare(password, admin.passwordHash || '')
    if (!ok) {
      await logActivity({ action: 'auth.login.failed', entity: 'admin', entityId: admin.id, req })
      throw new HttpError(401, 'Invalid email or password')
    }

    await repo.update('admins', admin.id, { lastLoginAt: new Date() })
    await logActivity({ actor: admin.email, action: 'auth.login.success', entity: 'admin', entityId: admin.id, req })
    res.json({ success: true, ...issueSession(res, admin) })
  })
)

router.post(
  '/refresh',
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.kcp_refresh
    if (!token) throw new HttpError(401, 'No refresh session')
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new HttpError(401, 'Refresh session expired')
    }
    const admin = await repo.findById('admins', payload.sub)
    if (!admin || !admin.active || (admin.tokenVersion || 0) !== (payload.v || 0)) {
      throw new HttpError(401, 'Session is no longer valid')
    }
    res.json({ success: true, ...issueSession(res, admin) })
  })
)

router.post('/logout', (req, res) => {
  res.clearCookie('kcp_refresh', { ...cookieOptions, maxAge: undefined })
  res.json({ success: true, message: 'Signed out' })
})

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, admin: publicAdmin(req.admin) })
}))

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const admin = await repo.findOne('admins', { email: req.body.email })
    // Always return success to avoid account enumeration.
    if (admin) {
      const token = crypto.randomBytes(32).toString('hex')
      await repo.update('admins', admin.id, {
        resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
      })
      const resetUrl = `${env.clientUrl}/login?reset=${token}&id=${admin.id}`
      const template = mailTemplates.resetPassword(admin.name, resetUrl)
      await sendMail({ to: admin.email, ...template })
      await logActivity({ action: 'auth.password.reset_requested', entity: 'admin', entityId: admin.id, req })
    }
    res.json({ success: true, message: 'If that account exists, a reset link has been sent.' })
  })
)

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { id, token, password } = req.body
    const admin = await repo.findById('admins', id)
    const record = admin ? await repo.findById('admins', id, { select: '+resetTokenHash +resetTokenExpires' }) : null
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    if (
      !admin ||
      !record?.resetTokenHash ||
      record.resetTokenHash !== hash ||
      !record.resetTokenExpires ||
      new Date(record.resetTokenExpires).getTime() < Date.now()
    ) {
      throw new HttpError(400, 'This reset link is invalid or has expired')
    }
    await repo.update('admins', admin.id, {
      passwordHash: await bcrypt.hash(password, 12),
      tokenVersion: (admin.tokenVersion || 0) + 1,
      resetTokenHash: null,
      resetTokenExpires: null,
    })
    await logActivity({ action: 'auth.password.reset', entity: 'admin', entityId: admin.id, req })
    res.json({ success: true, message: 'Password updated. You can sign in now.' })
  })
)

router.post(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const record = await repo.findById('admins', req.admin.id, { select: '+passwordHash' })
    const ok = await bcrypt.compare(req.body.currentPassword, record?.passwordHash || '')
    if (!ok) throw new HttpError(400, 'Current password is incorrect')
    await repo.update('admins', req.admin.id, {
      passwordHash: await bcrypt.hash(req.body.newPassword, 12),
      tokenVersion: (req.admin.tokenVersion || 0) + 1,
    })
    await logActivity({ actor: req.admin.email, action: 'auth.password.changed', entity: 'admin', entityId: req.admin.id, req })
    res.json({ success: true, message: 'Password changed. Other sessions have been invalidated.' })
  })
)

export default router

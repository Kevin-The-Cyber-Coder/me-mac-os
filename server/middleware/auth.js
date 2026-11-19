import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { repo } from '../config/store.js'
import { asyncHandler } from '../utils/errors.js'
import { HttpError } from '../utils/errors.js'

export function signAccessToken(admin) {
  return jwt.sign(
    { sub: String(admin.id), role: admin.role, email: admin.email, name: admin.name, type: 'access' },
    env.accessSecret,
    { expiresIn: env.accessTtl }
  )
}

export function signRefreshToken(admin) {
  return jwt.sign(
    { sub: String(admin.id), v: admin.tokenVersion || 0, type: 'refresh' },
    env.refreshSecret,
    { expiresIn: env.refreshTtl }
  )
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret)
}

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Authentication required')

  let payload
  try {
    payload = jwt.verify(token, env.accessSecret)
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.')
  }
  if (payload.type !== 'access') throw new HttpError(401, 'Invalid token type')

  const admin = await repo.findById('admins', payload.sub)
  if (!admin || !admin.active) throw new HttpError(401, 'Account is not active')
  delete admin.passwordHash
  req.admin = admin
  next()
})

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.admin) return next(new HttpError(401, 'Authentication required'))
    if (!roles.includes(req.admin.role)) return next(new HttpError(403, 'Insufficient permissions'))
    next()
  }

export const adminOnly = [protect, requireRole('admin')]

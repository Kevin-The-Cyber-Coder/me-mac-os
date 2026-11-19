import rateLimit from 'express-rate-limit'

const message = (msg) => ({ success: false, message: msg })

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many requests. Please slow down and try again shortly.'),
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many authentication attempts. Try again in 15 minutes.'),
})

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('You have sent several messages recently. Please try again later.'),
})

export const engagementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many submissions. Please try again later.'),
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('ARENA AI rate limit reached. Please try again in a little while.'),
})

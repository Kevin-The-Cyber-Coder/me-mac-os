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
  max: 8,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many authentication attempts. Try again in 15 minutes.'),
})

// Refresh is cheap but still worth bounding so a stolen cookie cannot be
// replayed indefinitely without tripping a limit.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many session refreshes. Sign in again shortly.'),
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

import { env } from '../config/env.js'
import { HttpError } from '../utils/errors.js'

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500
  let message = err.message || 'Unexpected server error'
  let details = err.details

  if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation failed'
    details = Object.values(err.errors || {}).map((e) => ({ path: e.path, message: e.message }))
  }
  if (err.name === 'CastError') {
    status = 400
    message = `Invalid value for ${err.path}`
  }
  if (err.code === 11000) {
    status = 409
    message = 'A record with that unique value already exists'
    details = err.keyValue
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413
    message = 'File is too large (maximum 8MB)'
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err)
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProd ? {} : { stack: status >= 500 ? err.stack : undefined }),
  })
}

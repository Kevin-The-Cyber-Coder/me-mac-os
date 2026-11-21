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
  if (status === 500 && /not allowed by CORS/i.test(err.message || '')) {
    status = 403
    message = 'Origin is not allowed'
  }
  if (err.type === 'entity.too.large') {
    status = 413
    message = 'Request body is too large'
  }
  if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Malformed JSON body'
  }

  const serverError = status >= 500
  if (serverError) {
    // Log the method, path and id only — never the request body or headers.
    // eslint-disable-next-line no-console
    console.error('[error]', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status,
      name: err.name,
      message: err.message,
    })
  }

  const expose = err.expose === true || !serverError || !env.isProd
  res.status(status).json({
    success: false,
    message: expose ? message : 'Unexpected server error',
    ...(req.id ? { requestId: req.id } : {}),
    ...(expose && details ? { details } : {}),
    ...(expose && !env.isProd && serverError && err.stack ? { stack: err.stack } : {}),
  })
}

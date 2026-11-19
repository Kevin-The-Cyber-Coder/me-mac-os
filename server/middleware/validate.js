import { HttpError } from '../utils/errors.js'

/**
 * Validate a request section against a Zod schema and replace it with the
 * parsed (typed, trimmed, stripped) value.
 */
export const validate = (schema, section = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[section])
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return next(new HttpError(400, 'Validation failed', details))
  }
  if (section === 'body') req.body = result.data
  else if (section === 'query') req.validatedQuery = result.data
  else req[section] = result.data
  next()
}

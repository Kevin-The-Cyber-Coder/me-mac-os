import { Router } from 'express'
import { asyncHandler } from '../utils/errors.js'
import { validate } from '../middleware/validate.js'
import { trackSchema } from '../validators/schemas.js'
import { trackEvent } from '../services/analytics.js'

const router = Router()

router.post(
  '/track',
  validate(trackSchema),
  asyncHandler(async (req, res) => {
    await trackEvent(req.body, req)
    res.status(202).json({ success: true })
  })
)

export default router

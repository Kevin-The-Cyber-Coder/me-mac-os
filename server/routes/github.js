import { Router } from 'express'
import { asyncHandler } from '../utils/errors.js'
import { protect, requireRole } from '../middleware/auth.js'
import { getGithubSummary, getRepositoryAudit, getSponsorshipCandidates, clearGithubCache } from '../services/github.js'
import { getAchievementBoard, recordAchievementProgress } from '../services/achievements.js'
import { logActivity } from '../services/activity.js'

const router = Router()

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const summary = await getGithubSummary({ force: req.query.force === 'true' && Boolean(req.admin) })
    res.json({ success: true, summary })
  })
)

router.get(
  '/achievements',
  asyncHandler(async (req, res) => {
    const board = await getAchievementBoard({ force: req.query.force === 'true' && Boolean(req.admin) })
    res.json({ success: true, ...board })
  })
)

router.get(
  '/audit',
  protect,
  asyncHandler(async (req, res) => {
    const audit = await getRepositoryAudit({ force: req.query.force === 'true' })
    res.json({ success: true, ...audit })
  })
)

router.get(
  '/sponsorships',
  protect,
  asyncHandler(async (req, res) => {
    const data = await getSponsorshipCandidates({ force: req.query.force === 'true' })
    res.json({ success: true, ...data })
  })
)

router.post(
  '/sync',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    clearGithubCache()
    const [summary, achievements] = await Promise.all([
      getGithubSummary({ force: true }),
      getAchievementBoard({ force: true }),
    ])
    await logActivity({ actor: req.admin.email, action: 'github.sync', entity: 'github', req })
    res.json({ success: true, summary, achievements })
  })
)

router.patch(
  '/achievements/:key',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { current, note } = req.body || {}
    const updated = await recordAchievementProgress(req.params.key, Number(current) || 0, String(note || ''))
    await logActivity({ actor: req.admin.email, action: 'github.achievement.update', entity: 'achievement', entityId: req.params.key, req })
    res.json({ success: true, achievement: updated })
  })
)

export default router

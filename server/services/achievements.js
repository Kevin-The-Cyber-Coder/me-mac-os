import { repo } from '../config/store.js'
import { env } from '../config/env.js'
import { getGithubSummary } from './github.js'

/**
 * Achievement definitions follow GitHub's published achievement levels.
 * GitHub alone decides when a badge is awarded — this module tracks verified
 * contribution metrics and never claims an unlock.
 */
export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'pull-shark',
    name: 'Pull Shark',
    icon: 'GitPullRequest',
    description: 'Merged pull requests authored by you.',
    metric: 'mergedPRs',
    levels: [
      { level: 1, target: 2, label: 'Default' },
      { level: 2, target: 16, label: 'Bronze' },
      { level: 3, target: 128, label: 'Silver' },
      { level: 4, target: 1024, label: 'Gold' },
    ],
    strategy: [
      'Break large features into small, focused pull requests.',
      'Keep one logical change per PR and write a descriptive title.',
      'Link the related issue and include tests with the change.',
      'Track merged PR progress from verified GitHub data.',
    ],
    order: 1,
  },
  {
    key: 'pair-extraordinaire',
    name: 'Pair Extraordinaire',
    icon: 'Users',
    description: 'Merged pull requests with a genuine co-author.',
    metric: 'coAuthoredMergedPRs',
    levels: [
      { level: 1, target: 1, label: 'Default' },
      { level: 2, target: 10, label: 'Bronze' },
      { level: 3, target: 24, label: 'Silver' },
      { level: 4, target: 48, label: 'Gold' },
    ],
    strategy: [
      'Collaborate on shared features with another developer.',
      'Use the Co-authored-by trailer only when both people genuinely contributed and agreed.',
      'Never invent collaborator identities or add false attribution.',
    ],
    order: 2,
  },
  {
    key: 'starstruck',
    name: 'Starstruck',
    icon: 'Star',
    description: 'Stars earned across your public repositories.',
    metric: 'stars',
    levels: [
      { level: 1, target: 16, label: 'Default' },
      { level: 2, target: 128, label: 'Bronze' },
      { level: 3, target: 512, label: 'Silver' },
      { level: 4, target: 4096, label: 'Gold' },
    ],
    strategy: [
      'Ship repositories with a clear README, screenshots and install steps.',
      'Add a LICENSE, CONTRIBUTING.md and relevant topics.',
      'Share genuinely useful projects with relevant communities — never buy stars.',
    ],
    order: 3,
  },
  {
    key: 'galaxy-brain',
    name: 'Galaxy Brain',
    icon: 'Brain',
    description: 'Accepted answers in GitHub Discussions.',
    metric: 'acceptedAnswers',
    levels: [
      { level: 1, target: 2, label: 'Default' },
      { level: 2, target: 8, label: 'Bronze' },
      { level: 3, target: 16, label: 'Silver' },
      { level: 4, target: 32, label: 'Gold' },
    ],
    strategy: [
      'Enable Discussions on eligible repositories with useful Q&A categories.',
      'Answer real questions in MERN, React, Node.js, TypeScript and API development.',
      'Write detailed, technically accurate answers — accepted answers are verified on GitHub.',
    ],
    order: 4,
  },
  {
    key: 'quickdraw',
    name: 'Quickdraw',
    icon: 'Zap',
    description: 'An issue or PR opened and closed within five minutes.',
    metric: 'quickdrawCount',
    levels: [{ level: 1, target: 1, label: 'Default' }],
    strategy: [
      'Fix genuine small problems such as typos or broken documentation links.',
      'Open a focused issue/PR and resolve it immediately — only for real corrections.',
      'Never create meaningless issues just to unlock an achievement.',
    ],
    order: 5,
  },
  {
    key: 'yolo',
    name: 'YOLO',
    icon: 'Rocket',
    description: 'A pull request merged without a review.',
    metric: 'yoloCount',
    levels: [{ level: 1, target: 1, label: 'Default' }],
    strategy: [
      'Only consider trivial, low-risk documentation corrections in personal repositories.',
      'Never skip review for application logic, auth, security, database or dependency changes.',
      'Quality and security always take priority over achievement progress.',
    ],
    order: 6,
  },
  {
    key: 'public-sponsor',
    name: 'Public Sponsor',
    icon: 'HeartHandshake',
    description: 'Sponsoring an open-source maintainer through GitHub Sponsors.',
    metric: 'sponsorships',
    levels: [{ level: 1, target: 1, label: 'Default' }],
    strategy: [
      'Identify critical dependencies and check their official FUNDING.yml.',
      'Sponsor maintainers through GitHub Sponsors or other official channels.',
      'Never claim a project accepts sponsorship without verification.',
    ],
    order: 7,
  },
]

const officialUrl = (username) =>
  `https://github.com/users/${username || 'kevinthecybercoder'}/achievements`

export function levelFor(levels = [], current = 0) {
  const sorted = [...levels].sort((a, b) => a.target - b.target)
  let achieved = null
  for (const lvl of sorted) if (current >= lvl.target) achieved = lvl
  const next = sorted.find((l) => current < l.target) || null
  const maxTarget = sorted[sorted.length - 1]?.target || 1
  return {
    achieved,
    next,
    percent: Math.min(100, Math.round((current / (next?.target || maxTarget)) * 100)),
  }
}

export async function ensureAchievementDocs() {
  const existing = await repo.find('achievements', { limit: 100, sort: { order: 1 } })
  if (existing.total > 0) return existing.items
  const created = []
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    created.push(
      await repo.create('achievements', {
        ...def,
        current: 0,
        source: 'manual',
        verified: false,
        officialUrl: officialUrl(env.github.username),
        history: [],
      })
    )
  }
  return created
}

export async function getAchievementBoard({ force = false } = {}) {
  await ensureAchievementDocs()
  const [summary, stored] = await Promise.all([
    getGithubSummary({ force }),
    repo.find('achievements', { limit: 100, sort: { order: 1 } }),
  ])

  const metrics = {
    mergedPRs: summary.ok ? summary.mergedPRs : null,
    stars: summary.ok ? summary.stars : null,
  }
  const username = summary.username || env.github.username
  const byKey = new Map(stored.items.map((d) => [d.key, d]))

  const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const doc = byKey.get(def.key) || {}
    const metricValue = metrics[def.metric]
    const verifiedFromGithub = typeof metricValue === 'number'
    const current = verifiedFromGithub ? metricValue : Number(doc.current || 0)
    const { achieved, next, percent } = levelFor(def.levels, current)
    const source = verifiedFromGithub ? 'github' : doc.source || 'manual'
    const verified = verifiedFromGithub ? true : Boolean(doc.verified)

    return {
      key: def.key,
      name: def.name,
      icon: def.icon,
      description: def.description,
      levels: def.levels,
      current,
      nextTarget: next?.target ?? null,
      nextLevel: next?.level ?? null,
      currentLevel: achieved?.level ?? 0,
      currentLevelLabel: achieved?.label ?? 'Not yet reached',
      percent,
      source,
      verified,
      // GitHub controls badge awarding — this is never asserted here.
      officialStatus: 'GitHub controls achievement awarding — verify on your profile',
      officialUrl: doc.officialUrl || officialUrl(username),
      strategy: def.strategy,
      notes: doc.notes || '',
      verifiedAt: doc.verifiedAt || null,
      history: doc.history || [],
    }
  })

  return {
    ok: true,
    username,
    github: {
      available: summary.ok,
      tokenConfigured: Boolean(env.github.token),
      error: summary.error || null,
      fetchedAt: summary.fetchedAt,
    },
    metrics: {
      mergedPRs: metrics.mergedPRs,
      stars: metrics.stars,
      coAuthoredMergedPRs: null,
      acceptedAnswers: null,
      quickdrawCount: null,
      yoloCount: null,
      sponsorships: null,
    },
    achievements,
    disclaimer:
      'Verified metrics come from the GitHub API. Metrics the public API cannot query (co-authored PRs, accepted discussion answers, Quickdraw, YOLO, sponsorship) must be verified manually against your GitHub profile. Badges are awarded solely by GitHub.',
  }
}

export async function recordAchievementProgress(key, value, note = '') {
  const doc = await repo.findOne('achievements', { key })
  if (!doc) return null
  const history = [...(doc.history || []), { date: new Date(), value, note }].slice(-50)
  return repo.update('achievements', doc.id, {
    current: value,
    source: 'manual',
    verified: true,
    verifiedAt: new Date(),
    history,
    notes: note || doc.notes,
  })
}

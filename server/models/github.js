import mongoose from 'mongoose'

const base = { timestamps: true, versionKey: false }

const githubAccountSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    githubId: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    name: { type: String, default: '' },
    bio: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    blog: { type: String, default: '' },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    accessTokenEncrypted: { type: String, default: '', select: false },
    scopes: [String],
    lastSyncedAt: Date,
  },
  base
)

const githubActivitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['commit', 'pull_request', 'issue', 'discussion', 'release', 'star', 'repo'], default: 'commit' },
    repo: { type: String, default: '' },
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  base
)

const achievementProgressSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Trophy' },
    officialUrl: { type: String, default: 'https://github.com/users/{username}/achievements' },
    levels: [{ level: Number, target: Number, label: String, _id: false }],
    current: { type: Number, default: 0 },
    // 'github' = fetched from GitHub, 'manual' = administrator verified
    source: { type: String, enum: ['github', 'manual', 'estimated'], default: 'manual' },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    notes: { type: String, default: '' },
    strategy: [String],
    history: [{ date: Date, value: Number, note: String, _id: false }],
    order: { type: Number, default: 0 },
  },
  base
)

const repositoryAuditSchema = new mongoose.Schema(
  {
    repo: { type: String, required: true, index: true },
    url: { type: String, default: '' },
    description: { type: String, default: '' },
    stars: { type: Number, default: 0 },
    topics: [String],
    score: { type: Number, default: 0 },
    checks: [{ key: String, label: String, passed: Boolean, detail: String, _id: false }],
    lastAuditedAt: Date,
  },
  base
)

const sponsorshipRecordSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, index: true },
    version: { type: String, default: '' },
    repository: { type: String, default: '' },
    maintainers: [String],
    fundingUrls: [String],
    fundingSource: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['unreviewed', 'reviewed', 'sponsored'], default: 'unreviewed' },
    note: { type: String, default: '' },
    lastCheckedAt: Date,
  },
  base
)

export const GitHubAccount = mongoose.model('GitHubAccount', githubAccountSchema)
export const GitHubActivity = mongoose.model('GitHubActivity', githubActivitySchema)
export const AchievementProgress = mongoose.model('AchievementProgress', achievementProgressSchema)
export const RepositoryAudit = mongoose.model('RepositoryAudit', repositoryAuditSchema)
export const SponsorshipRecord = mongoose.model('SponsorshipRecord', sponsorshipRecordSchema)

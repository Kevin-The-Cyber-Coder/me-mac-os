import mongoose from 'mongoose'

const base = { timestamps: true, versionKey: false }

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
    avatar: { type: String, default: '' },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: Date,
  },
  base
)

const analyticsSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['pageview', 'event'], default: 'pageview', index: true },
    path: { type: String, default: '/', index: true },
    referrer: { type: String, default: '' },
    sessionId: { type: String, default: '', index: true },
    visitorHash: { type: String, default: '', index: true },
    event: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  base
)
analyticsSchema.index({ createdAt: -1 })

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: String, default: 'system' },
    action: { type: String, required: true },
    entity: { type: String, default: '' },
    entityId: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  base
)

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    general: {
      siteName: { type: String, default: 'Kevin The Cyber Coder' },
      title: { type: String, default: 'Kevin The Cyber Coder — Full-Stack Developer' },
      description: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      resumeUrl: { type: String, default: '' },
    },
    appearance: {
      accent: { type: String, default: 'violet' },
      defaultTheme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      wallpaper: { type: String, default: 'aurora' },
      glass: { type: Number, default: 0.7 },
      reduceMotion: { type: Boolean, default: false },
    },
    seo: {
      keywords: [String],
      ogImage: String,
      twitterHandle: String,
      canonical: String,
    },
    ai: {
      enabled: { type: Boolean, default: true },
      provider: { type: String, default: 'openai' },
      baseUrl: { type: String, default: 'https://api.openai.com/v1' },
      model: { type: String, default: 'gpt-4o-mini' },
      systemPrompt: { type: String, default: '' },
      maxTokens: { type: Number, default: 1200 },
      temperature: { type: Number, default: 0.7 },
      dailyLimit: { type: Number, default: 60 },
      retentionDays: { type: Number, default: 30 },
      apiKeyEncrypted: { type: String, default: '', select: false },
    },
    github: {
      username: { type: String, default: 'kevinthecybercoder' },
      cacheTtlSeconds: { type: Number, default: 600 },
    },
    features: {
      music: { type: Boolean, default: true },
      gestures: { type: Boolean, default: true },
      assistant: { type: Boolean, default: true },
      universe: { type: Boolean, default: true },
      terminal: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
    },
    maintenance: { enabled: { type: Boolean, default: false }, message: String },
  },
  base
)

export const Admin = mongoose.model('Admin', adminSchema)
export const Analytics = mongoose.model('Analytics', analyticsSchema)
export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema)

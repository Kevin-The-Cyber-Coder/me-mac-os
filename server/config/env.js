import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Root .env first, then server-local overrides.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const bool = (v, fallback = false) =>
  v === undefined || v === '' ? fallback : /^(1|true|yes|on)$/i.test(String(v))
const num = (v, fallback) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? fallback : Number(v))

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${num(process.env.PORT, 5000)}`,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI || '',

  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  settingsSecret: process.env.SETTINGS_SECRET || 'dev-settings-secret-change-me',

  admin: {
    name: process.env.ADMIN_NAME || 'Mukeshimana Kevin',
    email: (process.env.ADMIN_EMAIL || 'admin@kevinthecybercoder.dev').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'CyberCoder#2026',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Kevin The Cyber Coder <no-reply@kevinthecybercoder.dev>',
    adminEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'admin@kevinthecybercoder.dev',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'kevin-cyber-portfolio',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.AI_API_KEY || '',
    maxTokens: num(process.env.AI_MAX_TOKENS, 1200),
    temperature: num(process.env.AI_TEMPERATURE, 0.7),
    dailyLimit: num(process.env.AI_DAILY_MESSAGE_LIMIT, 60),
    retentionDays: num(process.env.AI_RETENTION_DAYS, 30),
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || 'kevinthecybercoder',
    cacheTtl: num(process.env.GITHUB_CACHE_TTL_SECONDS, 600) * 1000,
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    oauthRedirect:
      process.env.GITHUB_OAUTH_REDIRECT || 'http://localhost:5000/api/github/oauth/callback',
  },

  analyticsSalt: process.env.ANALYTICS_SALT || 'dev-analytics-salt',
}

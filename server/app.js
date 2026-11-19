import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { dbState } from './config/db.js'
import { repo } from './config/store.js'
import { globalLimiter } from './middleware/rateLimit.js'
import { notFoundHandler, errorHandler } from './middleware/error.js'
import { uploadDir } from './middleware/upload.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import engagementRoutes from './routes/engagement.js'
import aiRoutes from './routes/ai.js'
import githubRoutes from './routes/github.js'
import adminRoutes from './routes/admin.js'
import analyticsRoutes from './routes/analytics.js'
import { mailConfigured } from './services/mail.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  const allowed = new Set([env.clientUrl, ...env.allowedOrigins].filter(Boolean))
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true)
        if (allowed.has(origin)) return callback(null, true)
        if (!env.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true)
        return callback(new Error(`Origin ${origin} is not allowed by CORS`))
      },
      credentials: true,
    })
  )

  app.use(express.json({ limit: '6mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())
  app.use(compression())
  if (!env.isProd) app.use(morgan('dev'))

  app.use('/uploads', express.static(uploadDir, { maxAge: '7d', fallthrough: true }))
  app.use('/api', globalLimiter)

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      status: 'ok',
      app: 'Kevin The Cyber Coder API',
      version: '1.0.0',
      uptime: Math.round(process.uptime()),
      database: { mode: dbState.mode, connected: dbState.connected },
      integrations: {
        ai: Boolean(env.ai.apiKey),
        github: Boolean(env.github.token),
        mail: mailConfigured(),
        cloudinary: Boolean(env.cloudinary.cloudName),
      },
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/api', (_req, res) => {
    res.json({
      success: true,
      name: 'Kevin The Cyber Coder API',
      developer: 'Mukeshimana Kevin',
      tagline: "Building Tomorrow's Technology, One Innovation at a Time.",
      endpoints: [
        '/api/auth',
        '/api/profile',
        '/api/projects',
        '/api/skills',
        '/api/services',
        '/api/blog',
        '/api/gallery',
        '/api/comments',
        '/api/contact',
        '/api/newsletter',
        '/api/ai',
        '/api/github',
        '/api/analytics',
        '/api/admin',
        '/api/health',
      ],
    })
  })

  // Lightweight maintenance gate (settings cached for 15s).
  let maintenanceCache = { at: 0, value: null }
  app.use(async (req, res, next) => {
    try {
      const isExempt =
        req.path.startsWith('/api/admin') ||
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/health') ||
        req.path.startsWith('/api/settings')
      if (isExempt) return next()
      if (Date.now() - maintenanceCache.at > 15_000) {
        const settings = await repo.findOne('settings', { key: 'site' })
        maintenanceCache = { at: Date.now(), value: settings?.maintenance || null }
      }
      if (maintenanceCache.value?.enabled && req.path.startsWith('/api')) {
        return res.status(503).json({
          success: false,
          maintenance: true,
          message: maintenanceCache.value.message || 'The portfolio is briefly under maintenance.',
        })
      }
      next()
    } catch {
      next()
    }
  })

  app.use('/api/auth', authRoutes)
  app.use('/api', publicRoutes)
  app.use('/api', engagementRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/github', githubRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/analytics', analyticsRoutes)

  if (env.isProd) {
    const clientDist = path.resolve(__dirname, '../../client/dist')
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist, { maxAge: '1h', index: false }))
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
        res.sendFile(path.join(clientDist, 'index.html'))
      })
    }
  }

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

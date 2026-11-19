import http from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDB, dbState } from './config/db.js'
import { seedDatabase } from './scripts/seedData.js'
import { initSockets } from './sockets/index.js'
import { mailConfigured } from './services/mail.js'

async function start() {
  await connectDB()
  await seedDatabase({ silent: false })

  const app = createApp()
  const server = http.createServer(app)
  initSockets(server)

  server.listen(env.port, () => {
    const line = '─'.repeat(58)
    console.info(`\n${line}`)
    console.info('  KEVIN THE CYBER CODER — ARENA API')
    console.info(`  http://localhost:${env.port}/api/health`)
    console.info(`  environment : ${env.nodeEnv}`)
    console.info(`  database    : ${dbState.mode}${dbState.connected ? '' : ' (demo mode — set MONGODB_URI)'}`)
    console.info(`  client      : ${env.clientUrl}`)
    console.info(`  ai provider : ${env.ai.apiKey ? 'configured' : 'knowledge-base fallback'}`)
    console.info(`  github      : ${env.github.token ? 'authenticated' : 'unauthenticated (rate limited)'}`)
    console.info(`  smtp        : ${mailConfigured() ? 'configured' : 'console log only'}`)
    console.info(`${line}\n`)
  })

  const shutdown = async (signal) => {
    console.info(`\n[server] ${signal} received — shutting down`)
    server.close(async () => {
      try {
        const { disconnectDB } = await import('./config/db.js')
        await disconnectDB()
      } finally {
        process.exit(0)
      }
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((err) => {
  console.error('[server] failed to start:', err)
  process.exit(1)
})

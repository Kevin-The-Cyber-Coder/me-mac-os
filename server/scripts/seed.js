import { connectDB, dbState, disconnectDB } from '../config/db.js'
import { seedDatabase } from './seedData.js'
import { env } from '../config/env.js'

const force = process.argv.includes('--force')

try {
  await connectDB()
  if (dbState.mode === 'memory') {
    console.warn(
      '\n[seed] MONGODB_URI is not configured or unreachable. Seeding in-memory only — this data disappears when the process exits.\n'
    )
  }
  const summary = await seedDatabase({ force })
  console.info(`[seed] done in ${dbState.mode} mode:`, summary)
  console.info(`[seed] admin login: ${env.admin.email}`)
  await disconnectDB()
  process.exit(0)
} catch (err) {
  console.error('[seed] failed:', err)
  process.exit(1)
}

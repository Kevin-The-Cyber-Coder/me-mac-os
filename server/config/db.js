import mongoose from 'mongoose'
import { env } from './env.js'

export const dbState = {
  mode: 'memory', // 'mongodb' | 'memory'
  connected: false,
  error: null,
  lastAttempt: null,
}

let attempted = false

/**
 * Connect to MongoDB when a URI is configured. The API intentionally keeps
 * running in an in-memory demo mode when Mongo is unavailable so the public
 * portfolio stays browsable and automated tests can run without infrastructure.
 * Admin writes in demo mode are process-local and are documented as such.
 */
export async function connectDB(uri = env.mongoUri) {
  attempted = true
  dbState.lastAttempt = new Date().toISOString()
  if (!uri) {
    dbState.mode = 'memory'
    dbState.connected = false
    dbState.error = 'MONGODB_URI not configured'
    return dbState
  }
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      maxPoolSize: 10,
      autoIndex: !env.isProd,
    })
    dbState.mode = 'mongodb'
    dbState.connected = true
    dbState.error = null
  } catch (err) {
    dbState.mode = 'memory'
    dbState.connected = false
    dbState.error = err.message
    // eslint-disable-next-line no-console
    console.warn(`[db] MongoDB unavailable (${err.message}). Falling back to in-memory demo mode.`)
  }
  return dbState
}

export async function disconnectDB() {
  if (dbState.connected) await mongoose.disconnect()
  dbState.connected = false
  dbState.mode = 'memory'
}

export function hasAttempted() {
  return attempted
}

export { mongoose }

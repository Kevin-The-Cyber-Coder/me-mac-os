import crypto from 'node:crypto'
import { env } from '../config/env.js'

const ALGO = 'aes-256-gcm'
const key = crypto.createHash('sha256').update(env.settingsSecret).digest()

export function encryptSecret(plain = '') {
  if (!plain) return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptSecret(payload = '') {
  if (!payload) return ''
  try {
    const [ivB64, tagB64, dataB64] = String(payload).split('.')
    if (!ivB64 || !tagB64 || !dataB64) return ''
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}

export const maskSecret = (value = '') => (value ? `••••••••${String(value).slice(-4)}` : '')

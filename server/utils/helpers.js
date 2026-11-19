import crypto from 'node:crypto'
import { env } from '../config/env.js'

export const slugify = (input = '') =>
  String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 12))
  return { page, limit }
}

export const hashIp = (ip = '') =>
  crypto.createHash('sha256').update(`${ip}:${env.analyticsSalt}`).digest('hex').slice(0, 32)

export const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const readingTime = (markdown = '') => {
  const words = String(markdown).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key]
    return acc
  }, {})

export const stripUnsafe = (obj = {}) => {
  const clone = { ...obj }
  delete clone._id
  delete clone.id
  delete clone.__v
  delete clone.createdAt
  delete clone.updatedAt
  return clone
}

export const toInt = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export const dayKey = (date) => new Date(date).toISOString().slice(0, 10)

export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

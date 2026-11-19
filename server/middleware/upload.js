import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
import { HttpError } from '../utils/errors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const uploadDir = path.resolve(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`))
    }
    cb(null, true)
  },
})

/**
 * Upload to Cloudinary when configured, otherwise keep the local disk copy.
 */
export async function persistUpload(file) {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return { url: `/uploads/${file.filename}`, provider: 'local', publicId: file.filename }
  }
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  })
  const resourceType = file.mimetype.startsWith('video')
    ? 'video'
    : file.mimetype.startsWith('audio')
      ? 'video'
      : 'image'
  const result = await cloudinary.uploader.upload(file.path, {
    folder: env.cloudinary.folder,
    resource_type: resourceType,
  })
  fs.promises.unlink(file.path).catch(() => {})
  return { url: result.secure_url, provider: 'cloudinary', publicId: result.public_id }
}

import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')
const shortText = (max = 200) => z.string().trim().min(1, 'This field is required').max(max)
const optionalText = (max = 500) => z.string().trim().max(max).optional().default('')

export const loginSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  id: z.string().min(1),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/[0-9]/, 'Include a number'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'Use at least 10 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/[0-9]/, 'Include a number'),
})

export const contactSchema = z.object({
  name: shortText(120),
  email,
  subject: shortText(200),
  service: optionalText(120),
  message: z.string().trim().min(20, 'Please add a little more detail (20+ characters)').max(6000),
  honeypot: z.string().max(0).optional(),
})

export const commentSchema = z.object({
  targetType: z.enum(['project', 'post', 'portfolio']),
  targetId: shortText(160),
  targetTitle: optionalText(200),
  name: shortText(80),
  email,
  content: z.string().trim().min(3, 'Comment is too short').max(3000),
  rating: z.coerce.number().min(1).max(5).optional(),
  parentId: z.string().nullable().optional(),
  honeypot: z.string().max(0).optional(),
})

export const feedbackSchema = z.object({
  name: shortText(80),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  category: optionalText(80),
  rating: z.coerce.number().min(1).max(5).optional(),
  message: z.string().trim().min(10, 'Tell us a little more').max(3000),
  honeypot: z.string().max(0).optional(),
})

export const newsletterSchema = z.object({
  email,
  name: optionalText(80),
  source: optionalText(80),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required to subscribe' }) }),
})

export const trackSchema = z.object({
  type: z.enum(['pageview', 'event']).optional().default('pageview'),
  path: z.string().max(300).optional().default('/'),
  referrer: z.string().max(300).optional().default(''),
  sessionId: z.string().max(80).optional().default(''),
  event: z.string().max(80).optional().default(''),
  meta: z.record(z.any()).optional().default({}),
})

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Ask ARENA AI something').max(4000),
  conversationId: z.string().optional().nullable(),
  visitorId: z.string().trim().min(8).max(80),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(8000) }))
    .max(12)
    .optional()
    .default([]),
})

export const conversationPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
})

export const createAdminSchema = z.object({
  name: shortText(80),
  email,
  password: z.string().min(10, 'Use at least 10 characters'),
  role: z.enum(['admin', 'editor']).optional().default('editor'),
})

export const campaignSendSchema = z.object({
  test: z.boolean().optional().default(false),
})

export const aiSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.string().max(60).optional(),
  baseUrl: z.string().url().optional(),
  model: z.string().max(120).optional(),
  systemPrompt: z.string().max(8000).optional(),
  maxTokens: z.coerce.number().min(128).max(8000).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  dailyLimit: z.coerce.number().min(1).max(1000).optional(),
  retentionDays: z.coerce.number().min(1).max(365).optional(),
  apiKey: z.string().max(300).optional(),
})

export const repositoryQuerySchema = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

import { Router } from 'express'
import { repo } from '../config/store.js'
import { asyncHandler, badRequest, notFound, HttpError } from '../utils/errors.js'
import { validate } from '../middleware/validate.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import { chatSchema, conversationPatchSchema } from '../validators/schemas.js'
import {
  getAIConfig,
  buildPortfolioContext,
  buildMessages,
  streamProvider,
  answerFromKnowledge,
  estimateTokens,
} from '../services/ai.js'

const router = Router()

const visitorFrom = (req) => String(req.headers['x-visitor-id'] || req.query.visitorId || req.body?.visitorId || '')

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const config = await getAIConfig()
    res.json({
      success: true,
      status: {
        enabled: config.enabled,
        mode: config.configured ? 'provider' : 'knowledge-base',
        provider: config.provider,
        model: config.model,
        configured: config.configured,
        dailyLimit: config.dailyLimit,
      },
    })
  })
)

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const visitorId = visitorFrom(req)
    if (!visitorId) return res.json({ success: true, conversations: [] })
    const { items } = await repo.find('conversations', {
      filter: { visitorId, archived: false },
      sort: { pinned: -1, lastMessageAt: -1 },
      limit: 50,
      page: 1,
    })
    res.json({ success: true, conversations: items })
  })
)

router.post(
  '/conversations',
  asyncHandler(async (req, res) => {
    const visitorId = visitorFrom(req)
    if (!visitorId) throw badRequest('A visitorId is required')
    const config = await getAIConfig()
    const doc = await repo.create('conversations', {
      visitorId,
      title: 'New conversation',
      provider: config.provider,
      model: config.model,
      lastMessageAt: new Date(),
    })
    res.status(201).json({ success: true, conversation: doc })
  })
)

async function ownedConversation(req, res) {
  const visitorId = visitorFrom(req)
  const doc = await repo.findById('conversations', req.params.id)
  if (!doc) throw notFound('Conversation not found')
  if (doc.visitorId !== visitorId && req.admin?.role !== 'admin') {
    throw new HttpError(403, 'You do not have access to this conversation')
  }
  return doc
}

router.get(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const conversation = await ownedConversation(req, res)
    const { items } = await repo.find('chatmessages', {
      filter: { conversationId: conversation.id },
      sort: { createdAt: 1 },
      limit: 200,
      page: 1,
    })
    res.json({ success: true, conversation, messages: items })
  })
)

router.patch(
  '/conversations/:id',
  validate(conversationPatchSchema),
  asyncHandler(async (req, res) => {
    const conversation = await ownedConversation(req, res)
    const updated = await repo.update('conversations', conversation.id, req.body)
    res.json({ success: true, conversation: updated })
  })
)

router.delete(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conversation = await ownedConversation(req, res)
    const { items } = await repo.find('chatmessages', {
      filter: { conversationId: conversation.id },
      limit: 500,
      page: 1,
    })
    await Promise.all(items.map((m) => repo.remove('chatmessages', m.id)))
    await repo.remove('conversations', conversation.id)
    res.json({ success: true, message: 'Conversation deleted' })
  })
)

router.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const visitorId = visitorFrom(req)
    const config = await getAIConfig()
    if (!visitorId) return res.json({ success: true, used: 0, limit: config.dailyLimit, remaining: config.dailyLimit })
    const { total } = await repo.find('chatmessages', {
      filter: { visitorId, role: 'user', createdAt: { $gte: startOfToday() } },
      limit: 1,
      page: 1,
    })
    res.json({
      success: true,
      used: total,
      limit: config.dailyLimit,
      remaining: Math.max(0, config.dailyLimit - total),
    })
  })
)

/* ── Streaming chat ─────────────────────────────────────────── */

router.post(
  '/chat',
  aiLimiter,
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    const { message, conversationId, visitorId, history } = req.body
    const config = await getAIConfig()
    if (!config.enabled) throw new HttpError(503, 'ARENA AI is currently disabled by the administrator.')

    const { total: usedToday } = await repo.find('chatmessages', {
      filter: { visitorId, role: 'user', createdAt: { $gte: startOfToday() } },
      limit: 1,
      page: 1,
    })
    if (usedToday >= config.dailyLimit) {
      throw new HttpError(429, `Daily ARENA AI limit reached (${config.dailyLimit} messages). Please continue tomorrow.`)
    }

    let conversation = null
    if (conversationId) {
      conversation = await repo.findById('conversations', conversationId)
      if (conversation && conversation.visitorId !== visitorId) conversation = null
    }
    if (!conversation) {
      conversation = await repo.create('conversations', {
        visitorId,
        title: message.slice(0, 64) || 'New conversation',
        provider: config.provider,
        model: config.model,
        lastMessageAt: new Date(),
      })
    }

    const previous = await repo.find('chatmessages', {
      filter: { conversationId: conversation.id },
      sort: { createdAt: 1 },
      limit: 12,
      page: 1,
    })
    const priorMessages = previous.items.length ? previous.items : history

    await repo.create('chatmessages', {
      conversationId: conversation.id,
      visitorId,
      role: 'user',
      content: message,
      model: config.model,
    })

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') res.flushHeaders()

    const send = (payload) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    const controller = new AbortController()
    let finished = false
    res.on('close', () => {
      if (!finished) controller.abort()
    })

    const startedAt = Date.now()
    send({
      type: 'meta',
      conversationId: conversation.id,
      model: config.model,
      mode: config.configured ? 'provider' : 'knowledge-base',
    })

    let content = ''
    let source = 'provider'
    let tokens = 0

    try {
      const ctx = await buildPortfolioContext()

      if (config.configured) {
        try {
          const messages = buildMessages({
            systemPrompt: config.systemPrompt,
            context: ctx.context,
            history: priorMessages,
            message,
          })
          const result = await streamProvider({
            config,
            messages,
            signal: controller.signal,
            onDelta: (delta) => {
              content += delta
              send({ type: 'delta', content: delta })
            },
          })
          tokens = result.tokens
        } catch (err) {
          if (controller.signal.aborted) throw err
          // Provider failed — degrade to verified portfolio knowledge.
          source = 'knowledge-base'
          send({
            type: 'notice',
            message: 'The AI provider is unreachable right now. Answering from verified portfolio data instead.',
          })
          content = await answerFromKnowledge(message, ctx)
          send({ type: 'delta', content })
          tokens = estimateTokens(content)
        }
      } else {
        source = 'knowledge-base'
        content = await answerFromKnowledge(message, ctx)
        send({ type: 'delta', content })
        tokens = estimateTokens(content)
      }

      const assistant = await repo.create('chatmessages', {
        conversationId: conversation.id,
        visitorId,
        role: 'assistant',
        content,
        model: config.model,
        tokens,
        latencyMs: Date.now() - startedAt,
        source,
      })

      const isFirst = (conversation.messageCount || 0) === 0
      await repo.update('conversations', conversation.id, {
        messageCount: (conversation.messageCount || 0) + 2,
        tokens: (conversation.tokens || 0) + tokens,
        lastMessageAt: new Date(),
        model: config.model,
        ...(isFirst ? { title: message.slice(0, 64) } : {}),
      })

      send({
        type: 'done',
        messageId: assistant.id,
        conversationId: conversation.id,
        source,
        tokens,
        latencyMs: Date.now() - startedAt,
      })
    } catch (err) {
      if (!controller.signal.aborted) {
        send({ type: 'error', message: err.message || 'ARENA AI could not complete that response.' })
      }
    } finally {
      finished = true
      if (!res.writableEnded) res.end()
    }
  })
)

export default router

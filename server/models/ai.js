import mongoose from 'mongoose'

const base = { timestamps: true, versionKey: false }

const conversationSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    title: { type: String, default: 'New conversation' },
    provider: { type: String, default: 'openai' },
    model: { type: String, default: '' },
    messageCount: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  base
)

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    visitorId: { type: String, default: '', index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, default: '' },
    model: { type: String, default: '' },
    tokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    attachments: [{ name: String, type: String, url: String, _id: false }],
    error: { type: Boolean, default: false },
    source: { type: String, enum: ['provider', 'knowledge-base'], default: 'provider' },
  },
  base
)

export const Conversation = mongoose.model('Conversation', conversationSchema)
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)

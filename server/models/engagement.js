import mongoose from 'mongoose'

const base = { timestamps: true, versionKey: false }

const commentSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['project', 'post', 'portfolio'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetTitle: { type: String, default: '' },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, select: false }, // never exposed publicly
    content: { type: String, required: true, maxlength: 3000 },
    rating: { type: Number, min: 1, max: 5 },
    likes: { type: Number, default: 0 },
    parentId: { type: String, default: null, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    ipHash: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  base
)

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, select: false },
    category: { type: String, default: 'General' },
    rating: { type: Number, min: 1, max: 5 },
    message: { type: String, required: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'reviewed', 'archived'], default: 'new', index: true },
    ipHash: { type: String, default: '' },
  },
  base
)

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true, maxlength: 200 },
    service: { type: String, default: '' },
    message: { type: String, required: true, maxlength: 6000 },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new', index: true },
    ipHash: { type: String, default: '' },
    repliedAt: Date,
  },
  base
)

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'subscribed', 'unsubscribed'], default: 'subscribed', index: true },
    token: { type: String, required: true, index: true },
    source: { type: String, default: 'website' },
    tags: [String],
    consentAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
  },
  base
)

const newsletterCampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    preheader: { type: String, default: '' },
    content: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'], default: 'draft', index: true },
    scheduledAt: Date,
    sentAt: Date,
    recipients: { type: Number, default: 0 },
    stats: {
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
    },
    createdBy: String,
  },
  base
)

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['message', 'comment', 'feedback', 'subscriber', 'inquiry', 'ai', 'github', 'achievement', 'system'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '/admin' },
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  base
)

export const Comment = mongoose.model('Comment', commentSchema)
export const Feedback = mongoose.model('Feedback', feedbackSchema)
export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema)
export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema)
export const NewsletterCampaign = mongoose.model('NewsletterCampaign', newsletterCampaignSchema)
export const Notification = mongoose.model('Notification', notificationSchema)

import mongoose from 'mongoose'
import * as content from './content.js'
import * as engagement from './engagement.js'
import * as ai from './ai.js'
import * as system from './system.js'
import * as github from './github.js'

export const models = {
  ...content,
  ...engagement,
  ...ai,
  ...system,
  ...github,
}

/** Collection slug -> Mongoose model name used by generic routes and backups. */
export const collectionMap = {
  profile: 'Profile',
  projects: 'Project',
  skills: 'Skill',
  services: 'Service',
  'blog-categories': 'BlogCategory',
  blog: 'BlogPost',
  gallery: 'Gallery',
  testimonials: 'Testimonial',
  music: 'MusicTrack',
  playlists: 'Playlist',
  comments: 'Comment',
  feedback: 'Feedback',
  messages: 'ContactMessage',
  subscribers: 'NewsletterSubscriber',
  campaigns: 'NewsletterCampaign',
  notifications: 'Notification',
  conversations: 'Conversation',
  chatmessages: 'ChatMessage',
  analytics: 'Analytics',
  activity: 'ActivityLog',
  settings: 'SiteSettings',
  admins: 'Admin',
  'github-accounts': 'GitHubAccount',
  'github-activity': 'GitHubActivity',
  achievements: 'AchievementProgress',
  audit: 'RepositoryAudit',
  sponsorships: 'SponsorshipRecord',
}

export function getModel(nameOrCollection) {
  const key = collectionMap[nameOrCollection] || nameOrCollection
  const model = models[key]
  if (!model) throw new Error(`Unknown collection: ${nameOrCollection}`)
  return model
}

export function allModelEntries() {
  return Object.entries(collectionMap)
}

export const isObjectId = (v) => mongoose.isValidObjectId(v)

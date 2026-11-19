import { repo } from '../config/store.js'
import { emitToAdmins } from '../sockets/index.js'

export async function createNotification({ type = 'system', title, message = '', link = '/admin', meta = {} }) {
  const doc = await repo.create('notifications', { type, title, message, link, read: false, meta })
  const unread = await repo.count('notifications', { read: false })
  emitToAdmins('notification:new', { notification: doc, unread })
  emitToAdmins('notification:count', { unread })
  return doc
}

export async function unreadCount() {
  return repo.count('notifications', { read: false })
}

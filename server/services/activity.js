import { repo } from '../config/store.js'

export async function logActivity({ actor = 'system', action, entity = '', entityId = '', req, meta = {} }) {
  try {
    return await repo.create('activity', {
      actor,
      action,
      entity,
      entityId: String(entityId || ''),
      ip: req?.ip || '',
      userAgent: req?.headers?.['user-agent']?.slice(0, 250) || '',
      meta,
    })
  } catch {
    return null
  }
}

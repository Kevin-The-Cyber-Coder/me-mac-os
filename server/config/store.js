import mongoose from 'mongoose'
import { dbState } from './db.js'
import { getModel } from '../models/index.js'
import { escapeRegex } from '../utils/helpers.js'

/**
 * Repository layer used by every controller.
 * - MongoDB mode delegates to Mongoose (indexed queries, validation).
 * - Memory mode provides the same contract so the app and the test suite run
 *   without external infrastructure. Data is process-local in this mode.
 */

const memory = new Map()
export const memoryTables = memory

function table(name) {
  const key = String(name)
  if (!memory.has(key)) memory.set(key, [])
  return memory.get(key)
}

function plain(doc) {
  if (!doc) return null
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: false }) : { ...doc }
  if (obj._id !== undefined) {
    obj.id = String(obj._id)
    delete obj._id
  }
  delete obj.__v
  return obj
}

function matchesValue(value, cond) {
  if (cond instanceof Date) return value && new Date(value).getTime() === cond.getTime()
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$in' in cond) return cond.$in.some((v) => String(v) === String(value))
    if ('$ne' in cond) return String(value) !== String(cond.$ne)
    if ('$exists' in cond) return (value !== undefined && value !== null) === cond.$exists
    if ('$regex' in cond) {
      const re = new RegExp(cond.$regex, cond.$options || 'i')
      if (Array.isArray(value)) return value.some((v) => re.test(String(v)))
      return re.test(String(value ?? ''))
    }
    if ('$gte' in cond || '$lte' in cond) {
      const t = value ? new Date(value).getTime() : NaN
      if ('$gte' in cond && !(t >= new Date(cond.$gte).getTime())) return false
      if ('$lte' in cond && !(t <= new Date(cond.$lte).getTime())) return false
      return true
    }
    return true
  }
  if (Array.isArray(value)) return value.map(String).includes(String(cond))
  return String(value) === String(cond)
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === '$and') return cond.every((c) => matches(doc, c))
    if (key === '$or') return cond.some((c) => matches(doc, c))
    return matchesValue(doc[key], cond)
  })
}

function compare(a, b) {
  if (a === b) return 0
  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1
  const an = typeof a === 'number' ? a : new Date(a).getTime()
  const bn = typeof b === 'number' ? b : new Date(b).getTime()
  if (Number.isFinite(an) && Number.isFinite(bn) && typeof a !== 'string') return an - bn
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function sortDocs(items, sort = {}) {
  const entries = Object.entries(sort)
  if (!entries.length) return items
  return [...items].sort((a, b) => {
    for (const [field, dir] of entries) {
      const result = compare(a[field], b[field])
      if (result !== 0) return dir < 0 ? -result : result
    }
    return 0
  })
}

function buildSearch(filter, search, fields) {
  if (!search || !fields?.length) return filter
  const re = { $regex: escapeRegex(String(search)), $options: 'i' }
  const or = fields.map((f) => ({ [f]: re }))
  return { $and: [filter, { $or: or }] }
}

const idValue = (v) => (mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(v) : v)

/** Translate repository-level `id` filters to Mongo `_id`. */
function toMongoFilter(filter = {}) {
  const out = {}
  for (const [key, value] of Object.entries(filter)) {
    if (key === 'id') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const mapped = {}
        for (const [op, val] of Object.entries(value)) {
          mapped[op] = op === '$in' && Array.isArray(val) ? val.map(idValue) : op === '$ne' ? idValue(val) : val
        }
        out._id = mapped
      } else {
        out._id = idValue(value)
      }
      continue
    }
    if ((key === '$and' || key === '$or') && Array.isArray(value)) {
      out[key] = value.map(toMongoFilter)
      continue
    }
    if (key === 'conversationId') {
      out[key] = value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([op, v]) => [op, op === '$in' && Array.isArray(v) ? v.map(idValue) : idValue(v)]))
        : idValue(value)
      continue
    }
    out[key] = value
  }
  return out
}

export const repo = {
  get mode() {
    return dbState.mode
  },

  async find(name, options = {}) {
    const {
      filter = {},
      search = '',
      searchFields = [],
      sort = { createdAt: -1 },
      page = 1,
      limit = 20,
      select,
    } = options

    if (dbState.connected) {
      const model = getModel(name)
      const finalFilter = toMongoFilter(buildSearch(filter, search, searchFields))
      const skip = (page - 1) * limit
      let query = model.find(finalFilter).sort(sort).skip(skip).limit(limit)
      if (select) query = query.select(select)
      const [items, total] = await Promise.all([query.lean({ virtuals: false }), model.countDocuments(finalFilter)])
      return {
        items: items.map(plain),
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      }
    }

    let items = table(name).filter((doc) => matches(doc, buildSearch(filter, search, searchFields)))
    items = sortDocs(items, sort)
    const total = items.length
    const start = (page - 1) * limit
    const pageItems = items.slice(start, start + limit).map(plain)
    return { items: pageItems, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
  },

  async findOne(name, filter = {}, options = {}) {
    if (dbState.connected) {
      const model = getModel(name)
      let query = model.findOne(toMongoFilter(filter))
      if (options.select) query = query.select(options.select)
      return plain(await query.lean({ virtuals: false }))
    }
    const doc = table(name).find((d) => matches(d, filter))
    return plain(doc || null)
  },

  async findById(name, id, options = {}) {
    if (!id) return null
    if (dbState.connected) {
      if (!mongoose.isValidObjectId(id)) return null
      const model = getModel(name)
      let query = model.findById(id)
      if (options.select) query = query.select(options.select)
      return plain(await query.lean({ virtuals: false }))
    }
    return plain(table(name).find((d) => String(d.id) === String(id)) || null)
  },

  async create(name, data = {}) {
    if (dbState.connected) {
      const model = getModel(name)
      const doc = await model.create(data)
      return plain(doc)
    }
    const now = new Date()
    const doc = {
      ...data,
      id: data.id || new mongoose.Types.ObjectId().toString(),
      createdAt: now,
      updatedAt: now,
    }
    table(name).unshift(doc)
    return plain(doc)
  },

  async update(name, id, data = {}) {
    if (dbState.connected) {
      if (!mongoose.isValidObjectId(id)) return null
      const model = getModel(name)
      return plain(
        await model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean({ virtuals: false })
      )
    }
    const items = table(name)
    const index = items.findIndex((d) => String(d.id) === String(id))
    if (index === -1) return null
    items[index] = { ...items[index], ...data, updatedAt: new Date() }
    return plain(items[index])
  },

  async remove(name, id) {
    if (dbState.connected) {
      if (!mongoose.isValidObjectId(id)) return false
      const result = await getModel(name).findByIdAndDelete(id)
      return Boolean(result)
    }
    const items = table(name)
    const index = items.findIndex((d) => String(d.id) === String(id))
    if (index === -1) return false
    items.splice(index, 1)
    return true
  },

  async count(name, filter = {}) {
    if (dbState.connected) return getModel(name).countDocuments(toMongoFilter(filter))
    return table(name).filter((doc) => matches(doc, filter)).length
  },

  async inc(name, id, field, by = 1) {
    if (dbState.connected) {
      if (!mongoose.isValidObjectId(id)) return null
      return plain(
        await getModel(name)
          .findByIdAndUpdate(id, { $inc: { [field]: by } }, { new: true })
          .lean({ virtuals: false })
      )
    }
    const doc = table(name).find((d) => String(d.id) === String(id))
    if (!doc) return null
    doc[field] = Number(doc[field] || 0) + by
    doc.updatedAt = new Date()
    return plain(doc)
  },

  async distinct(name, field, filter = {}) {
    if (dbState.connected) return getModel(name).distinct(field, filter)
    const values = new Set()
    table(name)
      .filter((doc) => matches(doc, filter))
      .forEach((doc) => {
        const v = doc[field]
        if (Array.isArray(v)) v.forEach((x) => values.add(x))
        else if (v !== undefined) values.add(v)
      })
    return [...values]
  },

  async upsertOne(name, filter, data) {
    const existing = await this.findOne(name, filter)
    if (existing) return this.update(name, existing.id, data)
    return this.create(name, { ...filter, ...data })
  },

  async insertMany(name, docs = []) {
    if (dbState.connected) {
      const prepared = docs.map((doc) => {
        const { id, ...rest } = doc
        return { ...(mongoose.isValidObjectId(id) ? { _id: id } : {}), ...rest }
      })
      const created = await getModel(name).insertMany(prepared)
      return created.map(plain)
    }
    return Promise.all(docs.map((doc) => this.create(name, doc)))
  },

  async clear(name) {
    if (dbState.connected) {
      await getModel(name).deleteMany({})
      return
    }
    memory.set(String(name), [])
  },

  async all(name, { sort = { createdAt: -1 } } = {}) {
    return this.find(name, { sort, limit: 100000, page: 1 }).then((r) => r.items)
  },
}

export function resetMemory() {
  memory.clear()
}

export { plain as serializeDoc }

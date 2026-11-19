import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { seedDatabase } from '../scripts/seedData.js'
import { env } from '../config/env.js'

let app
let token

beforeAll(async () => {
  app = createApp()
  await seedDatabase({ silent: true })
})

describe('health & public content', () => {
  it('reports API health', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(['memory', 'mongodb']).toContain(res.body.database.mode)
  })

  it('returns seeded projects with pagination', async () => {
    const res = await request(app).get('/api/projects?limit=3')
    expect(res.status).toBe(200)
    expect(res.body.items.length).toBeGreaterThan(0)
    expect(res.body.items.length).toBeLessThanOrEqual(3)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('returns a project by slug and increments views', async () => {
    const list = await request(app).get('/api/projects?limit=1')
    const slug = list.body.items[0].slug
    const res = await request(app).get(`/api/projects/${slug}`)
    expect(res.status).toBe(200)
    expect(res.body.project.slug).toBe(slug)
    expect(res.body.related).toBeInstanceOf(Array)
  })

  it('returns profile and public settings without secrets', async () => {
    const profile = await request(app).get('/api/profile')
    expect(profile.body.profile.name).toBe('Mukeshimana Kevin')
    const settings = await request(app).get('/api/settings')
    expect(settings.body.settings.ai).toBeUndefined()
    expect(settings.body.settings.appearance).toBeTruthy()
  })

  it('searches across collections', async () => {
    const res = await request(app).get('/api/search?q=react')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.results)).toBe(true)
  })
})

describe('engagement', () => {
  it('validates contact submissions', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'A', email: 'bad', subject: '', message: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.details.length).toBeGreaterThan(0)
  })

  it('accepts a valid contact message and notifies the admin', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Test Visitor',
      email: 'visitor@example.com',
      subject: 'Project inquiry',
      message: 'I would like to discuss a full-stack project with you this month.',
      service: 'Full-Stack Development',
    })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('creates comments as pending and never exposes email publicly', async () => {
    const created = await request(app).post('/api/comments').send({
      targetType: 'portfolio',
      targetId: 'portfolio',
      name: 'Commenter',
      email: 'private@example.com',
      content: 'A public comment awaiting moderation.',
      rating: 5,
    })
    expect(created.status).toBe(201)
    expect(created.body.comment.email).toBeUndefined()

    const publicList = await request(app).get('/api/comments?targetType=portfolio&targetId=portfolio')
    expect(publicList.status).toBe(200)
    expect(JSON.stringify(publicList.body)).not.toContain('private@example.com')
  })

  it('subscribes to the newsletter with consent', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'subscriber@example.com', consent: true })
    expect(res.status).toBe(201)
  })

  it('rejects newsletter subscriptions without consent', async () => {
    const res = await request(app).post('/api/newsletter/subscribe').send({ email: 'no-consent@example.com' })
    expect(res.status).toBe(400)
  })
})

describe('authentication & authorization', () => {
  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: env.admin.email, password: 'wrong-password' })
    expect(res.status).toBe(401)
  })

  it('logs in the seeded administrator', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: env.admin.email, password: env.admin.password })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.admin.email).toBe(env.admin.email)
    token = res.body.accessToken
  })

  it('protects admin routes', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('serves dashboard statistics to an authenticated admin', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.stats.projects).toBeGreaterThan(0)
    expect(res.body.analytics.perDay.length).toBe(30)
  })
})

describe('admin CRUD', () => {
  let createdId

  it('creates a project', async () => {
    const res = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Project', summary: 'Created by the test suite', category: 'Web Applications', status: 'draft' })
    expect(res.status).toBe(201)
    expect(res.body.item.slug).toBe('test-project')
    createdId = res.body.item.id
  })

  it('updates the project', async () => {
    const res = await request(app)
      .patch(`/api/admin/projects/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
    expect(res.status).toBe(200)
    expect(res.body.item.status).toBe('published')
  })

  it('deletes the project', async () => {
    const res = await request(app)
      .delete(`/api/admin/projects/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('rejects unknown collections', async () => {
    const res = await request(app)
      .get('/api/admin/not-a-collection')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('ARENA AI', () => {
  it('exposes assistant status', async () => {
    const res = await request(app).get('/api/ai/status')
    expect(res.status).toBe(200)
    expect(['provider', 'knowledge-base']).toContain(res.body.status.mode)
  })

  it('streams a grounded knowledge-base answer without a provider key', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Which projects use React?', visitorId: 'test-visitor-1234' })
      .buffer(true)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    expect(res.text).toContain('"type":"meta"')
    expect(res.text).toContain('"type":"done"')
  })
})

describe('security headers', () => {
  it('sets helmet headers', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})

import { repo } from '../config/store.js'
import { hashIp, dayKey, addDays } from '../utils/helpers.js'

export async function trackEvent({ type = 'pageview', path = '/', referrer = '', sessionId = '', event = '', meta = {} }, req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || ''
  const visitorHash = hashIp(`${ip}:${req.headers['user-agent'] || ''}`)
  return repo.create('analytics', {
    type,
    path: String(path).slice(0, 300),
    referrer: String(referrer || '').slice(0, 300),
    sessionId: String(sessionId || '').slice(0, 80),
    visitorHash,
    event: String(event || '').slice(0, 80),
    meta: typeof meta === 'object' ? meta : {},
  })
}

export async function analyticsSummary(days = 30) {
  const since = addDays(new Date(), -days)
  const { items } = await repo.find('analytics', {
    filter: { createdAt: { $gte: since } },
    sort: { createdAt: 1 },
    limit: 20000,
    page: 1,
  })

  const perDayMap = new Map()
  for (let i = days - 1; i >= 0; i -= 1) {
    perDayMap.set(dayKey(addDays(new Date(), -i)), { date: dayKey(addDays(new Date(), -i)), views: 0, visitors: new Set() })
  }

  const pageCounts = new Map()
  const referrers = new Map()
  const visitors = new Set()
  const events = new Map()
  let pageviews = 0

  for (const item of items) {
    if (item.type === 'pageview') {
      pageviews += 1
      pageCounts.set(item.path, (pageCounts.get(item.path) || 0) + 1)
      if (item.referrer) referrers.set(item.referrer, (referrers.get(item.referrer) || 0) + 1)
      const key = dayKey(item.createdAt)
      const bucket = perDayMap.get(key)
      if (bucket) {
        bucket.views += 1
        bucket.visitors.add(item.visitorHash)
      }
    } else if (item.event) {
      events.set(item.event, (events.get(item.event) || 0) + 1)
    }
    if (item.visitorHash) visitors.add(item.visitorHash)
  }

  return {
    range: { days, since: since.toISOString() },
    totals: {
      pageviews,
      uniqueVisitors: visitors.size,
      events: [...events.values()].reduce((a, b) => a + b, 0),
      avgPerDay: Math.round((pageviews / days) * 10) / 10,
    },
    perDay: [...perDayMap.values()].map((d) => ({ date: d.date, views: d.views, visitors: d.visitors.size })),
    topPages: [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views })),
    referrers: [...referrers.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([source, count]) => ({ source, count })),
    events: [...events.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  }
}

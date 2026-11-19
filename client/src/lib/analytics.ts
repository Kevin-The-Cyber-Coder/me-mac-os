import { api } from './api'
import { getVisitorId } from './utils'

const SESSION_KEY = 'kcp_analytics_session'

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = getVisitorId()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return getVisitorId()
  }
}

export function trackPageview(path: string) {
  void api
    .post('/analytics/track', {
      type: 'pageview',
      path,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      sessionId: sessionId(),
    })
    .catch(() => {
      /* analytics must never break the experience */
    })
}

export function trackEvent(event: string, meta: Record<string, unknown> = {}) {
  void api
    .post('/analytics/track', {
      type: 'event',
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      sessionId: sessionId(),
      event,
      meta,
    })
    .catch(() => {
      /* best-effort */
    })
}

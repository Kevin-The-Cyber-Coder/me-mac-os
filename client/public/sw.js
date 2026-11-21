/* Kevin The Cyber Coder — service worker
   Network-first navigation, stale-while-revalidate for static assets and an
   update handshake so the page can offer a refresh instead of reloading itself. */
const VERSION = 'kcp-v1.1.0'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/offline.html', '/og-cover.png']
const ASSET_PATTERN = /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

// The page asks for the waiting worker to take over, then reloads once it does.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

async function revalidate(request) {
  const cache = await caches.open(VERSION)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).catch(() => undefined)
      return response
    })
    .catch(() => cached)

  // Serve the cached copy immediately, refresh in the background.
  return cached || network
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never cache API traffic or socket handshakes.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return

  const sameOrigin = url.origin === self.location.origin
  const cacheableRemote = /\.(?:png|jpg|jpeg|svg|webp|avif|woff2?)$/i.test(url.pathname)
  if (!sameOrigin && !cacheableRemote) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put('/index.html', copy)).catch(() => undefined)
          return response
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/offline.html')))
    )
    return
  }

  if (ASSET_PATTERN.test(url.pathname) || cacheableRemote) {
    event.respondWith(revalidate(request))
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('/offline.html')))
  )
})

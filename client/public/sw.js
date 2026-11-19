/* Kevin The Cyber Coder — service worker
   App-shell caching with network-first navigation and offline fallback. */
const VERSION = 'kcp-v1.0.0'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
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

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never cache API traffic or socket handshakes.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return
  if (url.origin !== self.location.origin && !/\.(?:png|jpg|jpeg|svg|webp|woff2?)$/i.test(url.pathname)) return

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

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            if (response.ok && (url.origin === self.location.origin || /\.(png|jpe?g|svg|webp|woff2?)$/i.test(url.pathname))) {
              const copy = response.clone()
              caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => undefined)
            }
            return response
          })
          .catch(() => caches.match('/offline.html'))
    )
  )
})

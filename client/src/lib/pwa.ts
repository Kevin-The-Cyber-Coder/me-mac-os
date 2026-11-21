/**
 * Service worker registration and update handshake.
 *
 * Registration only happens in production builds. When a new worker is
 * installed the page is notified so it can offer an explicit refresh — the
 * bundle is never reloaded underneath the visitor.
 */

type UpdateListener = (ready: boolean) => void

const listeners = new Set<UpdateListener>()
let waitingWorker: ServiceWorker | null = null
let reloadOnControllerChange = false
let initialized = false

function emit() {
  for (const listener of listeners) listener(Boolean(waitingWorker))
}

export function subscribePwaUpdate(listener: UpdateListener) {
  listeners.add(listener)
  listener(Boolean(waitingWorker))
  return () => {
    listeners.delete(listener)
  }
}

export function applyPwaUpdate() {
  if (!waitingWorker) return
  reloadOnControllerChange = true
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}

function watchInstalling(registration: ServiceWorkerRegistration, worker: ServiceWorker | null) {
  if (!worker) return
  worker.addEventListener('statechange', () => {
    if (worker.state !== 'installed') return
    // No controller means this is the first install, not an update.
    if (!navigator.serviceWorker.controller) return
    waitingWorker = registration.waiting || worker
    emit()
  })
}

export function initPwa() {
  if (initialized || import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return
  initialized = true

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadOnControllerChange) return
    reloadOnControllerChange = false
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting) {
          waitingWorker = registration.waiting
          emit()
        }
        watchInstalling(registration, registration.installing)
        registration.addEventListener('updatefound', () => watchInstalling(registration, registration.installing))
        // Check for a new build hourly while the tab stays open.
        window.setInterval(() => {
          registration.update().catch(() => undefined)
        }, 60 * 60 * 1000)
      })
      .catch(() => {
        /* offline support is optional */
      })
  })
}

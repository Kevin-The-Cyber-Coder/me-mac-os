/**
 * A small localStorage adapter that coalesces frequent writes.
 *
 * Window drags and resizes update the OS store on every animation frame.
 * Persisting each frame would serialise the whole window list dozens of times
 * per second, so writes are buffered and flushed shortly after activity stops.
 */
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createDebouncedStorage(delay = 150): StorageLike {
  let timer: number | undefined
  let pending: { key: string; value: string } | null = null

  const flush = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
    }
    if (!pending) return
    const { key, value } = pending
    pending = null
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* storage can be full or blocked in private mode */
    }
  }

  return {
    getItem: (key) => {
      // Read the buffered value so a reload before the flush is still correct.
      if (pending?.key === key) return pending.value
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key, value) => {
      pending = { key, value }
      if (timer !== undefined) return
      timer = window.setTimeout(flush, delay)
    },
    removeItem: (key) => {
      if (pending?.key === key) pending = null
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    },
  }
}

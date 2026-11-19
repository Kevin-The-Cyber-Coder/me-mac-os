import { useCallback, useEffect, useRef, useState } from 'react'
import { api, apiError } from '../lib/api'
import type { Paginated } from '../types'

interface ListState<T> {
  data: Paginated<T> | null
  loading: boolean
  error: string | null
}

export function useList<T>(path: string, params?: Record<string, unknown>, enabled = true) {
  const key = JSON.stringify(params || {})
  const [state, setState] = useState<ListState<T>>({ data: null, loading: enabled, error: null })
  const alive = useRef(true)

  const load = useCallback(async () => {
    if (!enabled) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { data } = await api.get(path, { params: params || {} })
      if (!alive.current) return
      setState({ data: data as Paginated<T>, loading: false, error: null })
    } catch (error) {
      if (!alive.current) return
      setState({ data: null, loading: false, error: apiError(error) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, enabled])

  useEffect(() => {
    alive.current = true
    load()
    return () => {
      alive.current = false
    }
  }, [load])

  return { ...state, items: state.data?.items ?? [], refetch: load }
}

export function useItem<T>(path: string, key = 'item', enabled = true) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(path)
      if (alive.current) setData(response.data)
    } catch (err) {
      if (alive.current) setError(apiError(err))
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [path, enabled])

  useEffect(() => {
    alive.current = true
    load()
    return () => {
      alive.current = false
    }
  }, [load])

  return {
    data: (data?.[key] as T) ?? null,
    extra: data,
    loading,
    error,
    refetch: load,
  }
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = window.setInterval(() => saved.current(), delay)
    return () => window.clearInterval(id)
  }, [delay])
}

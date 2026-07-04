/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getCached, hasCached, setCached } from '@/lib/queryCache'

interface UseAsyncResult<T> {
  data: T | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useAsync<T>(
  factory: () => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
  cacheKey?: string,
): UseAsyncResult<T> {
  const storageKey = enabled
    ? (cacheKey ?? deps.map(String).join('|'))
    : ''
  const cached = storageKey ? getCached<T>(storageKey) : null

  const [data, setData] = useState<T | null>(cached)
  const [isLoading, setIsLoading] = useState(enabled && cached === null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  const reload = useCallback(async () => {
    if (!enabled) {
      setData(null)
      setIsLoading(false)
      setIsRefreshing(false)
      setError(null)
      return
    }

    const currentRequest = ++requestId.current
    const showInitialLoad = !storageKey || !hasCached(storageKey)

    if (showInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const result = await factoryRef.current()
      if (currentRequest !== requestId.current) return
      if (storageKey) setCached(storageKey, result)
      setData(result)
    } catch (err) {
      if (currentRequest !== requestId.current) return
      if (showInitialLoad) setData(null)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [enabled, storageKey])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, isLoading, isRefreshing, error, reload }
}

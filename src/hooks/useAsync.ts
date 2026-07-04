/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAsyncResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useAsync<T>(
  factory: () => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const factoryRef = useRef(factory)
  factoryRef.current = factory
  const depsKey = deps.map(String).join('|')

  const reload = useCallback(async () => {
    if (!enabled) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const currentRequest = ++requestId.current
    setIsLoading(true)
    setError(null)

    try {
      const result = await factoryRef.current()
      if (currentRequest !== requestId.current) return
      setData(result)
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setData(null)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false)
      }
    }
  }, [enabled, depsKey])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, isLoading, error, reload }
}

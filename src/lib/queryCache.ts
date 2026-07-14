interface CacheEntry {
  data: unknown
  updatedAt: number
}

const store = new Map<string, CacheEntry>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  return entry ? (entry.data as T) : null
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, updatedAt: Date.now() })
}

export function hasCached(key: string): boolean {
  return store.has(key)
}

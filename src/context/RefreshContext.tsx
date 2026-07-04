/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type RefreshScope =
  | 'all'
  | 'bills'
  | 'payments'
  | 'credits'
  | 'events'
  | 'analytics'
  | 'notifications'
  | 'history'
  | 'uploads'
  | 'properties'

interface RefreshContextValue {
  refreshSignal: number
  triggerRefresh: () => void
}

const RefreshContext = createContext<RefreshContextValue | null>(null)

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshSignal, setRefreshSignal] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshSignal((current) => current + 1)
  }, [])

  const value = useMemo(
    () => ({ refreshSignal, triggerRefresh }),
    [refreshSignal, triggerRefresh],
  )

  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  )
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider')
  }
  return context
}

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { ROUTES } from '@/constants'
import {
  fetchAllNotifications,
  fetchNotifications,
  fetchUnreadCount,
} from '@/services/notificationService'
import type { Notification } from '@/types'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { propertyId } = useProperty()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith(ROUTES.admin)

  const query = useAsync(
    async () => {
      const notifications = isAdmin
        ? await fetchAllNotifications()
        : propertyId
          ? await fetchNotifications(propertyId)
          : []
      const unreadCount = isAdmin
        ? await fetchUnreadCount()
        : propertyId
          ? await fetchUnreadCount(propertyId)
          : 0
      return { notifications, unreadCount }
    },
    [propertyId, isAdmin],
    isAdmin || Boolean(propertyId),
  )

  const refresh = useCallback(async () => {
    await query.reload()
  }, [query])

  const value = useMemo(
    () => ({
      notifications: query.data?.notifications ?? [],
      unreadCount: query.data?.unreadCount ?? 0,
      isLoading: query.isLoading,
      refresh,
    }),
    [query.data, query.isLoading, refresh],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

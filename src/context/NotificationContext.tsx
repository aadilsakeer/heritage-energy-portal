/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { usePropertyId } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { ROUTES } from '@/constants'
import {
  fetchAllNotifications,
  fetchNotifications,
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
  const propertyId = usePropertyId()
  const location = useLocation()
  const isAdmin = Boolean(matchPath({ path: ROUTES.admin }, location.pathname))
  const reloadRef = useRef<() => Promise<void>>(async () => {})

  const query = useAsync(
    async () => {
      const notifications = isAdmin
        ? await fetchAllNotifications()
        : propertyId
          ? await fetchNotifications(propertyId)
          : []
      const unreadCount = notifications.filter((item) => !item.isRead).length
      return { notifications, unreadCount }
    },
    [propertyId, isAdmin],
    isAdmin || Boolean(propertyId),
    isAdmin ? 'notifications:admin' : `notifications:${propertyId}`,
  )

  useEffect(() => {
    reloadRef.current = query.reload
  }, [query.reload])

  const refresh = useCallback(async () => {
    await reloadRef.current()
  }, [])

  const value = useMemo(
    () => ({
      notifications: query.data?.notifications ?? [],
      unreadCount: query.data?.unreadCount ?? 0,
      isLoading: query.isLoading && !query.data,
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

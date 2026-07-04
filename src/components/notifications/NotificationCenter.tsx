import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/context/NotificationContext'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService'
import { useProperty } from '@/context/PropertyContext'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/utils/format'
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'

const typeColors: Record<string, string> = {
  bill_published: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  payment_requested: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  payment_approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  payment_rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
  credit_created: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  credit_applied: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  bill_updated: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  payment_edited: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  payment_deleted: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, refresh } = useNotifications()
  const { propertyId } = useProperty()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith(ROUTES.admin)

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      await refresh()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to mark read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(isAdmin ? null : propertyId)
      await refresh()
      notify.success('All notifications marked read')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to mark all read')
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative rounded-2xl"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-soft backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <p className="font-semibold">Notifications</p>
                {notifications.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl"
                    onClick={() => void handleMarkAllRead()}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </Button>
                ) : null}
              </div>
              <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        'w-full border-b border-border/30 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                        !item.isRead && 'bg-primary/5',
                      )}
                      onClick={() => {
                        if (!item.isRead) void handleMarkRead(item.id)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        {!item.isRead ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('border-0 text-[10px]', typeColors[item.type])}
                        >
                          {item.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

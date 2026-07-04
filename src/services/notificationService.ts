import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import type { Notification, NotificationType } from '@/types'
import type { NotificationInsert } from '@/types/database'
import { mapNotification } from '@/utils/mappers'

export async function createNotification(input: {
  propertyId: string
  billId?: string | null
  title: string
  message: string
  type: NotificationType
}): Promise<Notification> {
  const payload: NotificationInsert = {
    property_id: input.propertyId,
    bill_id: input.billId ?? null,
    title: input.title,
    message: input.message,
    type: input.type,
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapNotification(data)
}

export async function fetchNotifications(
  propertyId: string,
  limit = 50,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapNotification)
}

export async function fetchAllNotifications(limit = 100): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapNotification)
}

export async function fetchUnreadCount(propertyId?: string | null): Promise<number> {
  let query = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (propertyId) query = query.eq('property_id', propertyId)

  const { count, error } = await query
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return count ?? 0
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw new Error(getSupabaseErrorMessage(error))
}

export async function markAllNotificationsRead(
  propertyId?: string | null,
): Promise<void> {
  let query = supabase.from('notifications').update({ is_read: true }).eq('is_read', false)

  if (propertyId) query = query.eq('property_id', propertyId)

  const { error } = await query
  if (error) throw new Error(getSupabaseErrorMessage(error))
}

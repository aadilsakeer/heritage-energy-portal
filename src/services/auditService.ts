import type { Json } from '@/types/database'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'

export async function logAuditEvent(input: {
  propertyId?: string | null
  billId?: string | null
  entityType: string
  entityId?: string | null
  action: string
  actor?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from('audit_events').insert({
    property_id: input.propertyId ?? null,
    bill_id: input.billId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor: input.actor ?? 'system',
    metadata: (input.metadata ?? {}) as Json,
  })

  // Soft-fail until migration applied so existing flows keep working
  if (error && !error.message.includes('audit_events')) {
    throw new Error(getSupabaseErrorMessage(error))
  }
}

export async function fetchAuditEvents(options?: {
  propertyId?: string
  limit?: number
}) {
  let query = supabase
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 100)

  if (options?.propertyId) {
    query = query.eq('property_id', options.propertyId)
  }

  const { data, error } = await query
  if (error) {
    if (error.message.includes('audit_events')) return []
    throw new Error(getSupabaseErrorMessage(error))
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    propertyId: row.property_id,
    billId: row.bill_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actor: row.actor,
    metadata: row.metadata,
    createdAt: row.created_at,
  }))
}

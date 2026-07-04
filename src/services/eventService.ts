import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import type { BillEvent } from '@/types'
import type { BillEventType, Json } from '@/types/database'
import { mapBillEvent } from '@/utils/mappers'

export async function logBillEvent(
  billId: string,
  eventType: BillEventType,
  metadata: Json = {},
): Promise<void> {
  const { error } = await supabase.from('bill_events').insert({
    bill_id: billId,
    event_type: eventType,
    metadata,
  })

  if (error) throw new Error(getSupabaseErrorMessage(error))
}

export async function fetchBillEvents(billId: string): Promise<BillEvent[]> {
  const { data, error } = await supabase
    .from('bill_events')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBillEvent)
}

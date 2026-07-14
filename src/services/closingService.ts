import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { fetchBillById } from '@/services/billService'
import { logAuditEvent } from '@/services/auditService'
import type { Bill } from '@/types'

export async function closeBillingMonth(
  propertyId: string,
  billingMonth: string,
): Promise<Bill[]> {
  const month = billingMonth.slice(0, 7) + '-01'
  const { data, error } = await supabase
    .from('bills')
    .update({
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: 'admin',
    })
    .eq('property_id', propertyId)
    .eq('billing_month', month)
    .neq('status', 'draft')
    .select('*')

  if (error) throw new Error(getSupabaseErrorMessage(error))

  await logAuditEvent({
    propertyId,
    entityType: 'month',
    entityId: month,
    action: 'month_closed',
    actor: 'admin',
    metadata: { billingMonth: month, count: data?.length ?? 0 },
  })

  const { mapBill } = await import('@/utils/mappers')
  return (data ?? []).map(mapBill)
}

export async function reopenBill(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')

  const { data, error } = await supabase
    .from('bills')
    .update({
      is_locked: false,
      locked_at: null,
      locked_by: null,
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  await logAuditEvent({
    propertyId: bill.propertyId,
    billId,
    entityType: 'bill',
    entityId: billId,
    action: 'bill_reopened',
    actor: 'admin',
  })

  const { mapBill } = await import('@/utils/mappers')
  return mapBill(data)
}

export async function lockBill(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')

  const { data, error } = await supabase
    .from('bills')
    .update({
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: 'admin',
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  await logAuditEvent({
    propertyId: bill.propertyId,
    billId,
    entityType: 'bill',
    entityId: billId,
    action: 'bill_locked',
    actor: 'admin',
  })

  const { mapBill } = await import('@/utils/mappers')
  return mapBill(data)
}

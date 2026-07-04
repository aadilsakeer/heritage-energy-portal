import {
  computePaymentSummary,
  derivePaymentStatus,
  type PaymentMethod,
} from '@/lib/payments'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { logBillEvent } from '@/services/eventService'
import { fetchBillById } from '@/services/billService'
import type { Bill, Payment } from '@/types'
import type { PaymentInsert, PaymentRow, PaymentUpdate } from '@/types/database'
import { mapPayment } from '@/utils/mappers'

export interface PaymentInput {
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
}

async function syncBillPaymentStatus(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')

  const payments = await fetchPayments(billId)
  const { totalPaid } = computePaymentSummary(bill, payments)

  const { fetchPendingPaymentRequest } = await import(
    '@/services/paymentRequestService'
  )
  const pendingRequest = await fetchPendingPaymentRequest(billId)
  const nextStatus = derivePaymentStatus(
    bill.status,
    bill,
    totalPaid,
    Boolean(pendingRequest),
  )

  if (nextStatus !== bill.status) {
    const { error } = await supabase
      .from('bills')
      .update({ status: nextStatus })
      .eq('id', billId)

    if (error) throw new Error(getSupabaseErrorMessage(error))
  }

  const { syncOverpaymentCredit } = await import('@/services/creditService')
  await syncOverpaymentCredit(billId)

  const updated = await fetchBillById(billId)
  if (!updated) throw new Error('Bill not found')
  return updated
}

export { syncBillPaymentStatus }

export async function fetchPayments(billId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('bill_id', billId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapPayment)
}

export async function createPayment(
  billId: string,
  input: PaymentInput,
): Promise<{ payment: Payment; bill: Bill }> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.tenantTotal === null) {
    throw new Error('Bill must have a calculated total before recording payments')
  }

  const payload: PaymentInsert = {
    bill_id: billId,
    amount: input.amount,
    payment_date: input.paymentDate,
    payment_method: input.paymentMethod,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const payment = mapPayment(data)
  await logBillEvent(billId, 'payment_added', {
    paymentId: payment.id,
    amount: payment.amount,
  })

  const { createNotification } = await import('@/services/notificationService')
  await createNotification({
    propertyId: bill.propertyId,
    billId,
    type: 'payment_edited',
    title: 'Payment recorded',
    message: `Payment of ₹${payment.amount.toFixed(2)} added by admin.`,
  })

  const updatedBill = await syncBillPaymentStatus(billId)
  return { payment, bill: updatedBill }
}

export async function updatePayment(
  paymentId: string,
  input: PaymentInput,
): Promise<{ payment: Payment; bill: Bill }> {
  const existing = await fetchPaymentById(paymentId)
  if (!existing) throw new Error('Payment not found')

  const payload: PaymentUpdate = {
    amount: input.amount,
    payment_date: input.paymentDate,
    payment_method: input.paymentMethod,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', paymentId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const payment = mapPayment(data)
  await logBillEvent(existing.billId, 'payment_updated', {
    paymentId: payment.id,
    amount: payment.amount,
  })

  const bill = await fetchBillById(existing.billId)
  if (bill) {
    const { createNotification } = await import('@/services/notificationService')
    await createNotification({
      propertyId: bill.propertyId,
      billId: existing.billId,
      type: 'payment_edited',
      title: 'Payment updated',
      message: `Payment updated to ₹${payment.amount.toFixed(2)} by admin.`,
    })
  }

  const updatedBill = await syncBillPaymentStatus(existing.billId)
  return { payment, bill: updatedBill }
}

export async function deletePayment(paymentId: string): Promise<Bill> {
  const existing = await fetchPaymentById(paymentId)
  if (!existing) throw new Error('Payment not found')

  const { error } = await supabase.from('payments').delete().eq('id', paymentId)
  if (error) throw new Error(getSupabaseErrorMessage(error))

  await logBillEvent(existing.billId, 'payment_deleted', {
    paymentId: existing.id,
    amount: existing.amount,
  })

  const bill = await fetchBillById(existing.billId)
  if (bill) {
    const { createNotification } = await import('@/services/notificationService')
    await createNotification({
      propertyId: bill.propertyId,
      billId: existing.billId,
      type: 'payment_deleted',
      title: 'Payment deleted',
      message: `Payment of ₹${existing.amount.toFixed(2)} was removed by admin.`,
    })
  }

  return syncBillPaymentStatus(existing.billId)
}

async function fetchPaymentById(paymentId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapPayment(data as PaymentRow) : null
}

export async function fetchPaymentSummaryForBill(billId: string) {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  const payments = await fetchPayments(billId)
  return {
    bill,
    payments,
    summary: computePaymentSummary(bill, payments),
  }
}

import { formatPaymentMethod, type PaymentMethod } from '@/lib/payments'
import { assertAllowedUpload, assertPositiveAmount } from '@/lib/validation'
import {
  getSupabaseErrorMessage,
  KSEB_BILLS_BUCKET,
  supabase,
} from '@/lib/supabase'
import { fetchBillById } from '@/services/billService'
import { logBillEvent } from '@/services/eventService'
import { createNotification } from '@/services/notificationService'
import { createPayment } from '@/services/paymentService'
import type { Bill, PaymentRequest } from '@/types'
import type {
  PaymentRequestInsert,
  PaymentRequestRow,
  PaymentRequestUpdate,
} from '@/types/database'
import { formatCurrency, formatMonthLabel } from '@/utils/format'
import { mapPaymentRequest } from '@/utils/mappers'

export interface PaymentRequestInput {
  amount: number
  paymentMethod: PaymentMethod
  transactionReference?: string
  notes?: string
  proofFile?: File | null
}

async function uploadProof(
  propertyId: string,
  billId: string,
  file: File,
): Promise<string> {
  assertAllowedUpload(file)
  const objectPath = `payment-proofs/${propertyId}/${billId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`

  const { error } = await supabase.storage
    .from(KSEB_BILLS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return objectPath
}

async function setBillPendingVerification(billId: string): Promise<void> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.status === 'draft' || bill.status === 'archived' || bill.status === 'paid') {
    return
  }

  const { error } = await supabase
    .from('bills')
    .update({ status: 'payment_pending_verification' })
    .eq('id', billId)

  if (error) throw new Error(getSupabaseErrorMessage(error))
}

async function syncBillStatusAfterRequestChange(billId: string): Promise<Bill> {
  const { syncBillPaymentStatus } = await import('@/services/paymentService')
  return syncBillPaymentStatus(billId)
}

export async function fetchPendingPaymentRequest(
  billId: string,
): Promise<PaymentRequest | null> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('bill_id', billId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapPaymentRequest(data) : null
}

export async function fetchPendingPaymentRequests(): Promise<PaymentRequest[]> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map((row) => mapPaymentRequest(row as PaymentRequestRow))
}

export async function createPaymentRequest(
  billId: string,
  input: PaymentRequestInput,
): Promise<PaymentRequest> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.status === 'draft' || bill.status === 'archived') {
    throw new Error('Cannot request payment verification for this bill')
  }
  if (bill.status === 'paid') {
    throw new Error('This bill is already paid in full')
  }

  const existing = await fetchPendingPaymentRequest(billId)
  if (existing) {
    throw new Error('A payment verification request is already pending for this bill')
  }

  assertPositiveAmount(input.amount, 'Payment amount')

  let proofUrl: string | null = null
  if (input.proofFile) {
    proofUrl = await uploadProof(bill.propertyId, billId, input.proofFile)
  }

  const payload: PaymentRequestInsert = {
    bill_id: billId,
    property_id: bill.propertyId,
    amount: input.amount,
    payment_method: input.paymentMethod,
    transaction_reference: input.transactionReference ?? null,
    proof_url: proofUrl,
    notes: input.notes ?? null,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const request = mapPaymentRequest(data as PaymentRequestRow)
  await setBillPendingVerification(billId)

  await logBillEvent(billId, 'payment_requested', {
    requestId: request.id,
    amount: request.amount,
    paymentMethod: request.paymentMethod,
  })

  const monthLabel = formatMonthLabel(bill.billingMonth)
  await createNotification({
    propertyId: bill.propertyId,
    billId,
    type: 'payment_requested',
    title: 'Payment verification requested',
    message: `${monthLabel}: ${formatCurrency(request.amount)} via ${formatPaymentMethod(request.paymentMethod)} awaiting admin approval.`,
  })

  return request
}

export async function approvePaymentRequest(
  requestId: string,
  approvedBy = 'Admin',
): Promise<{ request: PaymentRequest; bill: Bill }> {
  const request = await fetchPaymentRequestById(requestId)
  if (!request) throw new Error('Payment request not found')
  if (request.status !== 'pending') {
    throw new Error('Only pending requests can be approved')
  }

  const { bill: updatedBill } = await createPayment(request.billId, {
    amount: request.amount,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: request.paymentMethod as PaymentMethod,
    reference: request.transactionReference ?? undefined,
    notes: request.notes ?? undefined,
  })

  const updatePayload: PaymentRequestUpdate = {
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const approved = mapPaymentRequest(data as PaymentRequestRow)
  const bill = await syncBillStatusAfterRequestChange(request.billId)

  await logBillEvent(request.billId, 'payment_approved', {
    requestId: request.id,
    amount: request.amount,
    paymentMethod: request.paymentMethod,
  })

  await createNotification({
    propertyId: request.propertyId,
    billId: request.billId,
    type: 'payment_approved',
    title: 'Payment approved',
    message: `Your payment of ${formatCurrency(request.amount)} has been verified and recorded.`,
  })

  return { request: approved, bill: bill ?? updatedBill }
}

export async function rejectPaymentRequest(
  requestId: string,
  reason: string,
): Promise<PaymentRequest> {
  if (!reason.trim()) {
    throw new Error('Rejection reason is required')
  }

  const request = await fetchPaymentRequestById(requestId)
  if (!request) throw new Error('Payment request not found')
  if (request.status !== 'pending') {
    throw new Error('Only pending requests can be rejected')
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  await syncBillStatusAfterRequestChange(request.billId)

  await logBillEvent(request.billId, 'payment_rejected', {
    requestId: request.id,
    amount: request.amount,
    reason: reason.trim(),
  })

  await createNotification({
    propertyId: request.propertyId,
    billId: request.billId,
    type: 'payment_rejected',
    title: 'Payment verification rejected',
    message: reason.trim(),
  })

  return mapPaymentRequest(data as PaymentRequestRow)
}

export async function getPaymentProofUrl(proofPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(KSEB_BILLS_BUCKET)
    .createSignedUrl(proofPath, 60 * 10)

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data.signedUrl
}

async function fetchPaymentRequestById(
  requestId: string,
): Promise<PaymentRequest | null> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapPaymentRequest(data as PaymentRequestRow) : null
}

import type { Bill, BillStatus, Payment } from '@/types'
import { getBillAmountDue, roundMoney } from '@/lib/credits'

export const PAYABLE_STATUSES: BillStatus[] = [
  'published',
  'payment_pending_verification',
  'partially_paid',
  'paid',
]

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export interface PaymentSummary {
  billAmount: number
  creditApplied: number
  finalAmount: number
  totalPaid: number
  balance: number
  paymentPercentage: number
}

export function computePaymentSummary(
  bill: Bill,
  payments: Payment[],
): PaymentSummary {
  const billAmount = bill.tenantTotal ?? 0
  const creditApplied = bill.creditApplied ?? 0
  const finalAmount = getBillAmountDue(bill)
  const totalPaid = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  )
  const balance = Math.max(0, roundMoney(finalAmount - totalPaid))
  const paymentPercentage =
    finalAmount > 0
      ? Math.min(100, roundMoney((totalPaid / finalAmount) * 100))
      : 0

  return {
    billAmount,
    creditApplied,
    finalAmount,
    totalPaid,
    balance,
    paymentPercentage,
  }
}

export function derivePaymentStatus(
  currentStatus: BillStatus,
  bill: Bill,
  totalPaid: number,
  hasPendingRequest = false,
): BillStatus {
  if (currentStatus === 'draft' || currentStatus === 'archived') {
    return currentStatus
  }

  const amountDue = getBillAmountDue(bill)
  if (totalPaid >= amountDue) return 'paid'
  if (hasPendingRequest) return 'payment_pending_verification'
  if (totalPaid > 0) return 'partially_paid'
  return 'published'
}

export function formatBillStatus(status: BillStatus): string {
  const labels: Record<BillStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    payment_pending_verification: 'Pending Verification',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    archived: 'Archived',
  }
  return labels[status]
}

export function formatPaymentMethod(method: string): string {
  return (
    PAYMENT_METHODS.find((item) => item.value === method)?.label ??
    method.replace(/_/g, ' ')
  )
}

export function canRecordPayments(status: BillStatus): boolean {
  return (
    status === 'published' ||
    status === 'payment_pending_verification' ||
    status === 'partially_paid' ||
    status === 'paid'
  )
}

export function canRequestPaymentVerification(status: BillStatus): boolean {
  return (
    status === 'published' ||
    status === 'payment_pending_verification' ||
    status === 'partially_paid'
  )
}

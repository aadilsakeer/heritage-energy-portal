import type { BillStatus, Payment } from '@/types'

export const PAYABLE_STATUSES: BillStatus[] = [
  'published',
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
  totalPaid: number
  balance: number
  paymentPercentage: number
}

export function computePaymentSummary(
  billAmount: number,
  payments: Payment[],
): PaymentSummary {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const balance = Math.max(0, Math.round((billAmount - totalPaid) * 100) / 100)
  const paymentPercentage =
    billAmount > 0
      ? Math.min(100, Math.round((totalPaid / billAmount) * 10000) / 100)
      : 0

  return {
    billAmount,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balance,
    paymentPercentage,
  }
}

export function derivePaymentStatus(
  currentStatus: BillStatus,
  billAmount: number,
  totalPaid: number,
): BillStatus {
  if (currentStatus === 'draft' || currentStatus === 'archived') {
    return currentStatus
  }

  if (totalPaid <= 0) return 'published'
  if (totalPaid >= billAmount) return 'paid'
  return 'partially_paid'
}

export function formatBillStatus(status: BillStatus): string {
  const labels: Record<BillStatus, string> = {
    draft: 'Draft',
    published: 'Published',
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
  return status === 'published' || status === 'partially_paid' || status === 'paid'
}

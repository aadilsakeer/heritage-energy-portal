import type { Bill, CustomerCredit } from '@/types'

export type CreditStatus = 'active' | 'used' | 'cancelled'

export const CREDIT_REASONS = {
  overpayment: 'Overpayment',
  manual: 'Manual Credit',
} as const

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function getBillAmountDue(bill: Bill): number {
  if (bill.amountPayable !== null && bill.amountPayable !== undefined) {
    return bill.amountPayable
  }
  return bill.tenantTotal ?? 0
}

export function getActiveCreditBalance(credits: CustomerCredit[]): number {
  return roundMoney(
    credits
      .filter((credit) => credit.status === 'active')
      .reduce((sum, credit) => sum + credit.remainingAmount, 0),
  )
}

export function formatCreditStatus(status: CreditStatus): string {
  const labels: Record<CreditStatus, string> = {
    active: 'Active',
    used: 'Used',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

export interface CreditAnalytics {
  outstandingCredits: number
  creditsUsed: number
  totalCreditsGiven: number
}

export function buildCreditAnalytics(credits: CustomerCredit[]): CreditAnalytics {
  const outstandingCredits = getActiveCreditBalance(credits)
  const creditsUsed = roundMoney(
    credits
      .filter((credit) => credit.status === 'used')
      .reduce((sum, credit) => sum + credit.amount, 0),
  )
  const totalCreditsGiven = roundMoney(
    credits
      .filter((credit) => credit.status !== 'cancelled')
      .reduce((sum, credit) => sum + credit.amount, 0),
  )

  return { outstandingCredits, creditsUsed, totalCreditsGiven }
}
